-- Lane 02: preventive maintenance execution + daily/pre-start evidence.
-- Extends the existing maintenance_plans/work_orders model rather than creating a parallel CMMS.

alter table public.maintenance_plans
  add column if not exists description text,
  add column if not exists plan_kind text not null default 'pm';

alter table public.maintenance_plans
  drop constraint if exists maintenance_plans_plan_kind_check;
alter table public.maintenance_plans
  add constraint maintenance_plans_plan_kind_check check (plan_kind in ('pm','prestart'));

alter table public.maintenance_plans
  drop constraint if exists maintenance_plans_frequency_unit_check;
alter table public.maintenance_plans
  add constraint maintenance_plans_frequency_unit_check check (frequency_unit in ('day','week','month'));

create table if not exists public.maintenance_executions (
  id uuid primary key default gen_random_uuid(),
  maintenance_plan_id uuid not null references public.maintenance_plans(id) on delete restrict,
  asset_id uuid not null references public.assets(id) on delete restrict,
  work_order_id uuid references public.work_orders(id) on delete set null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  result text check (result in ('pass','fail','na')),
  checklist_results jsonb not null default '[]'::jsonb,
  notes text,
  started_at timestamptz,
  started_by uuid references auth.users(id),
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (maintenance_plan_id, due_date)
);

create index if not exists maintenance_executions_due_idx on public.maintenance_executions(status, due_date);
create index if not exists maintenance_executions_asset_idx on public.maintenance_executions(asset_id, due_date desc);
create index if not exists maintenance_executions_work_order_idx on public.maintenance_executions(work_order_id) where work_order_id is not null;

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete restrict,
  maintenance_plan_id uuid not null references public.maintenance_plans(id) on delete restrict,
  work_order_id uuid references public.work_orders(id) on delete set null,
  check_date date not null default current_date,
  checklist_results jsonb not null default '[]'::jsonb,
  overall_result text not null check (overall_result in ('pass','fail','na')),
  note text,
  checked_by uuid not null default auth.uid() references auth.users(id),
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (asset_id, check_date)
);

create index if not exists daily_checkins_asset_date_idx on public.daily_checkins(asset_id, check_date desc);
create index if not exists daily_checkins_work_order_idx on public.daily_checkins(work_order_id) where work_order_id is not null;

alter table public.maintenance_executions enable row level security;
alter table public.daily_checkins enable row level security;

-- This application currently has no organization/tenant column on assets or maintenance plans.
-- Restrict the new operational tables to signed-in users and preserve actor ownership for writes.
drop policy if exists maintenance_executions_authenticated_read on public.maintenance_executions;
create policy maintenance_executions_authenticated_read
  on public.maintenance_executions for select to authenticated
  using ((select auth.uid()) is not null);

drop policy if exists maintenance_executions_authenticated_insert on public.maintenance_executions;
create policy maintenance_executions_authenticated_insert
  on public.maintenance_executions for insert to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists maintenance_executions_actor_update on public.maintenance_executions;
create policy maintenance_executions_actor_update
  on public.maintenance_executions for update to authenticated
  using ((select auth.uid()) is not null)
  with check (
    (started_by is null or started_by = (select auth.uid()))
    and (completed_by is null or completed_by = (select auth.uid()))
  );

drop policy if exists daily_checkins_authenticated_read on public.daily_checkins;
create policy daily_checkins_authenticated_read
  on public.daily_checkins for select to authenticated
  using ((select auth.uid()) is not null);

drop policy if exists daily_checkins_actor_insert on public.daily_checkins;
create policy daily_checkins_actor_insert
  on public.daily_checkins for insert to authenticated
  with check (checked_by = (select auth.uid()));

create or replace function public.sync_pm_due_executions(p_horizon_days integer default 45)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  insert into public.maintenance_executions (maintenance_plan_id, asset_id, due_date, checklist_results)
  select
    p.id,
    p.asset_id,
    p.next_due_date,
    coalesce(p.checklist, '[]'::jsonb)
  from public.maintenance_plans p
  join public.assets a on a.id = p.asset_id
  join public.asset_types at on at.id = a.asset_type_id
  where p.active = true
    and p.plan_kind = 'pm'
    and p.asset_id is not null
    and p.next_due_date is not null
    and at.requires_maintenance = true
    and p.next_due_date <= current_date + greatest(0, p_horizon_days)
  on conflict (maintenance_plan_id, due_date) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.start_maintenance_execution(p_execution_id uuid)
returns setof public.maintenance_executions
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select auth.uid()) is null then raise exception 'authentication required'; end if;

  return query
  update public.maintenance_executions e
     set status = 'in_progress',
         started_at = coalesce(e.started_at, now()),
         started_by = coalesce(e.started_by, (select auth.uid())),
         updated_at = now()
   where e.id = p_execution_id
     and e.status in ('pending','in_progress')
   returning e.*;
end;
$$;

create or replace function public.complete_maintenance_execution(
  p_execution_id uuid,
  p_checklist_results jsonb,
  p_result text,
  p_notes text default null,
  p_create_work_order boolean default false
)
returns setof public.maintenance_executions
language plpgsql
security invoker
set search_path = public
as $$
declare
  exec_row public.maintenance_executions%rowtype;
  plan_row public.maintenance_plans%rowtype;
  generated_work_order_id uuid;
  generated_code text;
begin
  if (select auth.uid()) is null then raise exception 'authentication required'; end if;
  if p_result not in ('pass','fail','na') then raise exception 'invalid result'; end if;

  select * into exec_row from public.maintenance_executions where id = p_execution_id for update;
  if exec_row.id is null then raise exception 'maintenance execution not found'; end if;
  if exec_row.status = 'completed' then raise exception 'maintenance execution is already completed'; end if;

  select * into plan_row from public.maintenance_plans where id = exec_row.maintenance_plan_id;

  if p_create_work_order and p_result = 'fail' then
    generated_code := 'WO-PM-' || to_char(clock_timestamp(), 'YYMMDDHH24MISSMS');
    insert into public.work_orders (
      code, title, work_type, priority, status, asset_id, maintenance_plan_id,
      description, requested_by, requested_at, due_at
    ) values (
      generated_code,
      'PM finding - ' || plan_row.name,
      'corrective',
      'high',
      'open',
      exec_row.asset_id,
      exec_row.maintenance_plan_id,
      nullif(p_notes, ''),
      (select auth.uid()),
      now(),
      now()
    ) returning id into generated_work_order_id;
  end if;

  update public.maintenance_executions e
     set status = 'completed',
         result = p_result,
         checklist_results = coalesce(p_checklist_results, '[]'::jsonb),
         notes = nullif(p_notes, ''),
         started_at = coalesce(e.started_at, now()),
         started_by = coalesce(e.started_by, (select auth.uid())),
         completed_at = now(),
         completed_by = (select auth.uid()),
         work_order_id = coalesce(e.work_order_id, generated_work_order_id),
         updated_at = now()
   where e.id = p_execution_id
   returning * into exec_row;

  insert into public.maintenance_history (
    work_order_id, asset_id, action, details, performed_by, performed_at
  ) values (
    exec_row.work_order_id,
    exec_row.asset_id,
    'preventive_maintenance',
    jsonb_build_object(
      'maintenance_execution_id', exec_row.id,
      'maintenance_plan_id', exec_row.maintenance_plan_id,
      'result', exec_row.result,
      'notes', exec_row.notes
    )::text,
    (select auth.uid()),
    now()
  );

  update public.maintenance_plans p
     set last_performed_at = now(),
         next_due_date = case p.frequency_unit
           when 'day' then exec_row.due_date + greatest(1, p.frequency_value)
           when 'week' then exec_row.due_date + (greatest(1, p.frequency_value) * 7)
           when 'month' then (exec_row.due_date + make_interval(months => greatest(1, p.frequency_value)))::date
           else exec_row.due_date + greatest(1, p.frequency_value)
         end,
         updated_at = now()
   where p.id = exec_row.maintenance_plan_id;

  return next exec_row;
end;
$$;

create or replace function public.submit_daily_checkin(
  p_asset_id uuid,
  p_plan_id uuid,
  p_checklist_results jsonb,
  p_result text,
  p_note text default null,
  p_create_work_order boolean default false
)
returns setof public.daily_checkins
language plpgsql
security invoker
set search_path = public
as $$
declare
  plan_row public.maintenance_plans%rowtype;
  eligible boolean;
  generated_work_order_id uuid;
  generated_code text;
  saved public.daily_checkins%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'authentication required'; end if;
  if p_result not in ('pass','fail','na') then raise exception 'invalid result'; end if;

  select p.* into plan_row
  from public.maintenance_plans p
  where p.id = p_plan_id and p.asset_id = p_asset_id and p.plan_kind = 'prestart' and p.active = true;
  if plan_row.id is null then raise exception 'active pre-start plan not found for asset'; end if;

  select coalesce(at.requires_prestart, false) into eligible
  from public.assets a
  join public.asset_types at on at.id = a.asset_type_id
  where a.id = p_asset_id and a.status = 'active';
  if not coalesce(eligible, false) then raise exception 'asset type does not require pre-start checks'; end if;

  if p_create_work_order and p_result = 'fail' then
    generated_code := 'WO-PRE-' || to_char(clock_timestamp(), 'YYMMDDHH24MISSMS');
    insert into public.work_orders (
      code, title, work_type, priority, status, asset_id, maintenance_plan_id,
      description, requested_by, requested_at, due_at
    ) values (
      generated_code,
      'Pre-start finding - ' || plan_row.name,
      'corrective',
      'high',
      'open',
      p_asset_id,
      p_plan_id,
      nullif(p_note, ''),
      (select auth.uid()),
      now(),
      now()
    ) returning id into generated_work_order_id;
  end if;

  insert into public.daily_checkins (
    asset_id, maintenance_plan_id, work_order_id, check_date,
    checklist_results, overall_result, note, checked_by, checked_at
  ) values (
    p_asset_id, p_plan_id, generated_work_order_id, current_date,
    coalesce(p_checklist_results, '[]'::jsonb), p_result, nullif(p_note, ''),
    (select auth.uid()), now()
  )
  on conflict (asset_id, check_date) do update
    set maintenance_plan_id = excluded.maintenance_plan_id,
        work_order_id = coalesce(public.daily_checkins.work_order_id, excluded.work_order_id),
        checklist_results = excluded.checklist_results,
        overall_result = excluded.overall_result,
        note = excluded.note,
        checked_by = excluded.checked_by,
        checked_at = now()
  returning * into saved;

  insert into public.maintenance_history (
    work_order_id, asset_id, action, details, performed_by, performed_at
  ) values (
    saved.work_order_id,
    saved.asset_id,
    'prestart_check',
    jsonb_build_object(
      'daily_checkin_id', saved.id,
      'maintenance_plan_id', saved.maintenance_plan_id,
      'result', saved.overall_result,
      'note', saved.note
    )::text,
    (select auth.uid()),
    now()
  );

  return next saved;
end;
$$;

grant select, insert, update on public.maintenance_executions to authenticated;
grant select, insert on public.daily_checkins to authenticated;
grant execute on function public.sync_pm_due_executions(integer) to authenticated;
grant execute on function public.start_maintenance_execution(uuid) to authenticated;
grant execute on function public.complete_maintenance_execution(uuid,jsonb,text,text,boolean) to authenticated;
grant execute on function public.submit_daily_checkin(uuid,uuid,jsonb,text,text,boolean) to authenticated;
