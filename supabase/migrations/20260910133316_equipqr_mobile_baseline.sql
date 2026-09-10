-- Clean baseline after resetting public schema on 2026-09-10.
-- UX/source-of-truth reference: Columbia-Cloudworks-LLC/EquipQR.
-- CEV keeps its own business data model and IATF-specific fields; no proprietary source copied.
-- Sample business data is intentionally NOT seeded.

create schema if not exists public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.asset_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.asset_types (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.asset_groups(id) on delete set null,
  name text not null,
  description text,
  requires_qr boolean not null default true,
  requires_maintenance boolean not null default false,
  requires_prestart boolean not null default false,
  requires_calibration boolean not null default false,
  tracks_downtime boolean not null default false,
  uses_spare_parts boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id,name)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  description text,
  parent_id uuid references public.locations(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'active' check(status in ('active','warning','inactive','retired')),
  asset_group_id uuid references public.asset_groups(id) on delete set null,
  asset_type_id uuid references public.asset_types(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  parent_asset_id uuid references public.assets(id) on delete set null,
  manufacturer text,
  model text,
  serial_number text,
  criticality text,
  next_control_date date,
  qr_payload text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key(team_id,user_id)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  contact_name text,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  contact_name text,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spare_parts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  specification text,
  unit text not null default 'EA',
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.part_inventory (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.spare_parts(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  quantity numeric not null default 0,
  min_quantity numeric not null default 0,
  max_quantity numeric,
  updated_at timestamptz not null default now(),
  unique(part_id,location_id)
);
create table public.asset_parts (
  asset_id uuid not null references public.assets(id) on delete cascade,
  part_id uuid not null references public.spare_parts(id) on delete cascade,
  critical boolean not null default false,
  preferred_quantity numeric,
  notes text,
  primary key(asset_id,part_id)
);
create table public.part_transactions (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.spare_parts(id) on delete restrict,
  location_id uuid references public.locations(id) on delete set null,
  transaction_type text not null check(transaction_type in ('receive','issue','adjust')),
  quantity numeric not null,
  reference text,
  performed_by uuid references auth.users(id) on delete set null,
  performed_at timestamptz not null default now()
);

create table public.maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  name text not null,
  description text,
  plan_kind text not null default 'pm' check(plan_kind in ('pm','prestart')),
  frequency_value integer not null default 1 check(frequency_value > 0),
  frequency_unit text not null default 'month' check(frequency_unit in ('day','week','month')),
  checklist jsonb not null default '[]'::jsonb,
  next_due_date date,
  last_performed_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  asset_id uuid references public.assets(id) on delete set null,
  maintenance_plan_id uuid references public.maintenance_plans(id) on delete set null,
  work_type text not null default 'corrective',
  priority text not null default 'medium',
  status text not null default 'open' check(status in ('open','in_progress','on_hold','completed','cancelled')),
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  downtime_minutes integer not null default 0,
  root_cause text,
  corrective_action text,
  post_repair_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_executions (
  id uuid primary key default gen_random_uuid(),
  maintenance_plan_id uuid not null references public.maintenance_plans(id) on delete restrict,
  asset_id uuid not null references public.assets(id) on delete restrict,
  work_order_id uuid references public.work_orders(id) on delete set null,
  due_date date not null,
  status text not null default 'pending' check(status in ('pending','in_progress','completed')),
  result text check(result in ('pass','fail','na')),
  checklist_results jsonb not null default '[]'::jsonb,
  notes text,
  started_at timestamptz,
  started_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(maintenance_plan_id,due_date)
);
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete restrict,
  maintenance_plan_id uuid not null references public.maintenance_plans(id) on delete restrict,
  work_order_id uuid references public.work_orders(id) on delete set null,
  check_date date not null default current_date,
  checklist_results jsonb not null default '[]'::jsonb,
  overall_result text not null check(overall_result in ('pass','fail','na')),
  note text,
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz not null default now(),
  unique(asset_id,check_date)
);
create table public.maintenance_history (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid references public.work_orders(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  action text not null,
  details text,
  performed_by uuid references auth.users(id) on delete set null,
  performed_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);
create table public.scan_history (
  id uuid primary key default gen_random_uuid(),
  raw_value text not null,
  asset_id uuid references public.assets(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  part_id uuid references public.spare_parts(id) on delete set null,
  scanned_by uuid references auth.users(id) on delete set null,
  scanned_at timestamptz not null default now()
);
create table public.mobile_business_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  payload_version integer not null default 1,
  device_timestamp timestamptz,
  actor_id uuid references auth.users(id) on delete set null,
  status text not null default 'applied',
  server_timestamp timestamptz not null default now(),
  result jsonb,
  created_at timestamptz not null default now()
);

create table public.management_code_counters (
  code_type text primary key,
  prefix text not null,
  digits integer not null default 4,
  current_value integer not null default 0,
  description text,
  updated_at timestamptz not null default now()
);
insert into public.management_code_counters(code_type,prefix,digits,description) values
('asset','TS',4,'Tài sản'),('location','KV',3,'Vị trí'),('spare_part','PT',4,'Phụ tùng'),('team','NH',3,'Nhóm'),('supplier','NCC',4,'Nhà cung cấp'),('customer','KH',4,'Khách hàng'),('work_order','WO',6,'Lệnh công việc');

create or replace function public.next_management_code(p_code_type text)
returns text language plpgsql security definer set search_path=public as $$
declare r public.management_code_counters%rowtype;
begin
  update public.management_code_counters set current_value=current_value+1,updated_at=now() where code_type=p_code_type returning * into r;
  if r.code_type is null then raise exception 'unknown code type: %',p_code_type; end if;
  return r.prefix||'-'||lpad(r.current_value::text,r.digits,'0');
end;$$;
grant execute on function public.next_management_code(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',new.email)) on conflict(id) do nothing;
  return new;
end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.apply_mobile_business_event(
  p_client_event_id text,p_event_type text,p_payload jsonb,p_payload_version integer,p_device_timestamp timestamptz
) returns jsonb language plpgsql security definer set search_path=public as $$
declare existing_result jsonb; v_result jsonb:='{}'::jsonb; v_work_order_id uuid; v_code text;
begin
  select result into existing_result from public.mobile_business_events where client_event_id=p_client_event_id;
  if found then return coalesce(existing_result,jsonb_build_object('deduplicated',true)); end if;
  if p_event_type='asset.scan' then
    v_result:=jsonb_build_object('asset_id',p_payload->>'asset_id');
  elsif p_event_type='work_order.create' then
    v_code:=public.next_management_code('work_order');
    insert into public.work_orders(code,title,description,asset_id,priority,work_type,requested_by,status)
    values(v_code,trim(p_payload->>'title'),nullif(trim(p_payload->>'description'),''),nullif(p_payload->>'assetId','')::uuid,coalesce(nullif(p_payload->>'priority',''),'medium'),coalesce(nullif(p_payload->>'workType',''),'corrective'),auth.uid(),'open')
    returning id into v_work_order_id;
    v_result:=jsonb_build_object('work_order_id',v_work_order_id,'code',v_code);
  elsif p_event_type in ('work_order.start','work_order.hold','work_order.complete') then
    v_work_order_id:=(p_payload->>'work_order_id')::uuid;
    update public.work_orders set status=case p_event_type when 'work_order.start' then 'in_progress' when 'work_order.hold' then 'on_hold' else 'completed' end,
      started_at=case when p_event_type='work_order.start' and started_at is null then now() else started_at end,
      completed_at=case when p_event_type='work_order.complete' then now() else completed_at end,updated_at=now() where id=v_work_order_id;
    if not found then raise exception 'work order not found'; end if;
    v_result:=jsonb_build_object('work_order_id',v_work_order_id);
  else raise exception 'unsupported mobile event type: %',p_event_type;
  end if;
  insert into public.mobile_business_events(client_event_id,event_type,payload,payload_version,device_timestamp,actor_id,status,result)
  values(p_client_event_id,p_event_type,p_payload,p_payload_version,p_device_timestamp,auth.uid(),'applied',v_result);
  return v_result||jsonb_build_object('server_timestamp',now());
end;$$;
grant execute on function public.apply_mobile_business_event(text,text,jsonb,integer,timestamptz) to authenticated;

create or replace function public.sync_pm_due_executions(p_horizon_days integer default 45)
returns integer language plpgsql security definer set search_path=public as $$
declare c integer;
begin
  insert into public.maintenance_executions(maintenance_plan_id,asset_id,due_date,checklist_results)
  select p.id,p.asset_id,p.next_due_date,p.checklist from public.maintenance_plans p
  join public.assets a on a.id=p.asset_id left join public.asset_types t on t.id=a.asset_type_id
  where p.active and p.plan_kind='pm' and p.next_due_date is not null and coalesce(t.requires_maintenance,true)=true
    and p.next_due_date<=current_date+greatest(0,p_horizon_days)
  on conflict(maintenance_plan_id,due_date) do nothing;
  get diagnostics c=row_count; return c;
end;$$;
grant execute on function public.sync_pm_due_executions(integer) to authenticated;

create index idx_assets_group on public.assets(asset_group_id);
create index idx_assets_type on public.assets(asset_type_id);
create index idx_assets_location on public.assets(location_id);
create index idx_work_orders_asset on public.work_orders(asset_id);
create index idx_work_orders_status on public.work_orders(status,due_at);
create index idx_pm_asset on public.maintenance_plans(asset_id);
create index idx_exec_due on public.maintenance_executions(status,due_date);
create index idx_inventory_part on public.part_inventory(part_id);
create index idx_scan_asset on public.scan_history(asset_id,scanned_at desc);

alter table public.profiles enable row level security;
create policy profiles_read_self on public.profiles for select to authenticated using(id=auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

-- Current CEV project is single-site; detailed role RLS will be tightened after mobile parity refactor.
do $$ declare t text; begin
  foreach t in array array['asset_groups','asset_types','locations','assets','teams','team_members','suppliers','customers','spare_parts','part_inventory','asset_parts','part_transactions','maintenance_plans','work_orders','maintenance_executions','daily_checkins','maintenance_history','documents','scan_history','mobile_business_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I on public.%I for select to authenticated using (true)',t||'_read',t);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)',t||'_insert',t);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)',t||'_update',t);
    execute format('create policy %I on public.%I for delete to authenticated using (true)',t||'_delete',t);
  end loop;
end $$;

grant select,insert,update,delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to service_role;
