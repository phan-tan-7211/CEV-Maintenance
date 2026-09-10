alter table public.spare_parts add column if not exists unit_cost numeric;

create table if not exists public.meters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  meter_type text,
  unit text not null default 'unit',
  current_value numeric not null default 0,
  asset_id uuid references public.assets(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meter_readings (
  id uuid primary key default gen_random_uuid(),
  meter_id uuid not null references public.meters(id) on delete cascade,
  reading numeric not null,
  read_by uuid references auth.users(id) on delete set null,
  read_at timestamptz not null default now(),
  note text
);

insert into public.management_code_counters(code_type,prefix,digits,current_value,description)
values('meter','DH',4,0,'Đồng hồ theo dõi')
on conflict(code_type) do update set prefix=excluded.prefix,digits=excluded.digits,description=excluded.description;

alter table public.meters enable row level security;
alter table public.meter_readings enable row level security;

drop policy if exists meters_read on public.meters;
drop policy if exists meters_insert on public.meters;
drop policy if exists meters_update on public.meters;
drop policy if exists meters_delete on public.meters;
create policy meters_read on public.meters for select to authenticated using(true);
create policy meters_insert on public.meters for insert to authenticated with check(true);
create policy meters_update on public.meters for update to authenticated using(true) with check(true);
create policy meters_delete on public.meters for delete to authenticated using(true);

drop policy if exists meter_readings_read on public.meter_readings;
drop policy if exists meter_readings_insert on public.meter_readings;
drop policy if exists meter_readings_update on public.meter_readings;
drop policy if exists meter_readings_delete on public.meter_readings;
create policy meter_readings_read on public.meter_readings for select to authenticated using(true);
create policy meter_readings_insert on public.meter_readings for insert to authenticated with check(true);
create policy meter_readings_update on public.meter_readings for update to authenticated using(true) with check(true);
create policy meter_readings_delete on public.meter_readings for delete to authenticated using(true);

grant select,insert,update,delete on public.meters,public.meter_readings to authenticated;

create or replace function public.adjust_part_stock(
  p_part_id uuid,
  p_location_id uuid,
  p_delta numeric,
  p_min_quantity numeric default null,
  p_max_quantity numeric default null,
  p_reference text default null
) returns public.part_inventory
language plpgsql security definer set search_path=public as $$
declare
  v_row public.part_inventory%rowtype;
  v_type text;
begin
  if p_delta = 0 then raise exception 'delta must not be zero'; end if;

  select * into v_row
  from public.part_inventory
  where part_id=p_part_id and location_id=p_location_id
  for update;

  if not found then
    if p_delta < 0 then raise exception 'insufficient stock'; end if;
    insert into public.part_inventory(part_id,location_id,quantity,min_quantity,max_quantity)
    values(p_part_id,p_location_id,p_delta,coalesce(p_min_quantity,0),p_max_quantity)
    returning * into v_row;
  else
    if v_row.quantity + p_delta < 0 then raise exception 'insufficient stock'; end if;
    update public.part_inventory
    set quantity=quantity+p_delta,
        min_quantity=coalesce(p_min_quantity,min_quantity),
        max_quantity=coalesce(p_max_quantity,max_quantity),
        updated_at=now()
    where id=v_row.id
    returning * into v_row;
  end if;

  v_type:=case when p_delta>0 then 'receive' else 'issue' end;
  insert into public.part_transactions(part_id,location_id,transaction_type,quantity,reference,performed_by)
  values(p_part_id,p_location_id,v_type,abs(p_delta),p_reference,auth.uid());

  return v_row;
end;$$;

grant execute on function public.adjust_part_stock(uuid,uuid,numeric,numeric,numeric,text) to authenticated;
