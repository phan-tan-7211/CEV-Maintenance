-- CEV Maintenance - Kiến trúc danh mục V2 theo mô hình CMMS gọn:
-- Tài sản là kho gốc duy nhất; nhóm/loại tài sản là dữ liệu cấu hình.
-- Các bảng tooling / measuring_equipment / safety_equipment cũ được giữ lại
-- để bảo toàn nghiệp vụ chuyên biệt và liên kết về asset master.

create table if not exists public.asset_groups (
  id uuid primary key default gen_random_uuid(),
  system_key text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_types (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.asset_groups(id),
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
  updated_at timestamptz not null default now()
);

create unique index if not exists asset_types_group_name_uq
  on public.asset_types (group_id, lower(name));

alter table public.assets
  add column if not exists asset_group_id uuid references public.asset_groups(id),
  add column if not exists asset_type_id uuid references public.asset_types(id),
  add column if not exists parent_asset_id uuid references public.assets(id),
  add column if not exists next_control_date date,
  add column if not exists legacy_source text,
  add column if not exists legacy_source_id uuid,
  add column if not exists legacy_code text;

create unique index if not exists assets_legacy_source_uq
  on public.assets (legacy_source, legacy_source_id)
  where legacy_source is not null and legacy_source_id is not null;

insert into public.asset_groups (system_key, name, description, sort_order)
values
  ('production', 'Thiết bị sản xuất', 'Máy, dây chuyền và thiết bị trực tiếp phục vụ sản xuất.', 10),
  ('support', 'Phụ trợ / hạ tầng', 'Thiết bị tiện ích, hạ tầng và cơ sở vật chất cần kiểm soát.', 20),
  ('tooling', 'Jig / khuôn / dụng cụ', 'Jig, gá, khuôn và dụng cụ chuyên dùng.', 30),
  ('measuring', 'Thiết bị đo / kiểm tra', 'Thiết bị dùng đo, kiểm tra, thử nghiệm hoặc quyết định đạt/không đạt.', 40),
  ('it', 'CNTT / mạng / văn phòng', 'Máy tính, máy in, switch, hub, Wi-Fi và thiết bị văn phòng.', 50),
  ('logistics', 'Kho vận / phương tiện', 'Xe nâng, xe nâng tay, xe đẩy và phương tiện nội bộ.', 60),
  ('safety', 'Thiết bị an toàn', 'Thiết bị an toàn độc lập hoặc cần theo dõi riêng.', 70),
  ('other', 'Khác', 'Tài sản chưa phù hợp với các nhóm chuẩn.', 90)
on conflict (system_key) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    updated_at = now();

with seed(group_key, name, rq, rm, rp, rc, rd, rs, ord) as (
  values
    ('production','Dây chuyền',true,true,true,false,true,true,10),
    ('production','Máy cuốn',true,true,true,false,true,true,20),
    ('production','Máy ép / dập',true,true,true,false,true,true,30),
    ('production','Máy hàn / solder',true,true,true,false,true,true,40),
    ('production','Băng chuyền',true,true,false,false,true,true,50),
    ('production','Lò / tủ sấy',true,true,true,false,true,true,60),
    ('production','Máy phủ / coating',true,true,true,false,true,true,70),
    ('production','Robot công nghiệp',true,true,true,false,true,true,80),
    ('production','Thiết bị sản xuất khác',true,true,false,false,true,true,90),
    ('support','Máy nén khí',true,true,true,false,false,true,10),
    ('support','Chiller / làm mát',true,true,true,false,false,true,20),
    ('support','Hệ thống chiếu sáng',false,true,false,false,false,false,30),
    ('support','Thông gió / hút khói',true,true,false,false,false,true,40),
    ('support','Tủ điện / hệ thống điện',true,true,false,false,false,true,50),
    ('support','Bàn / kệ cần kiểm soát',true,false,false,false,false,false,60),
    ('support','Phụ trợ khác',true,true,false,false,false,true,90),
    ('tooling','Jig',true,true,false,false,false,false,10),
    ('tooling','Gá / fixture',true,true,false,false,false,false,20),
    ('tooling','Khuôn',true,true,false,false,false,true,30),
    ('tooling','Dụng cụ chuyên dùng',true,false,false,false,false,false,40),
    ('measuring','Thước cặp',true,false,false,true,false,false,10),
    ('measuring','Panme',true,false,false,true,false,false,20),
    ('measuring','LCR Meter',true,false,false,true,false,false,30),
    ('measuring','Cân',true,false,false,true,false,false,40),
    ('measuring','Máy đo lực / mô-men',true,false,false,true,false,false,50),
    ('measuring','Kính / đèn lúp kiểm tra',true,false,false,true,false,false,60),
    ('measuring','Thiết bị đo khác',true,false,false,true,false,false,90),
    ('it','Máy tính để bàn',true,false,false,false,false,false,10),
    ('it','Laptop',true,false,false,false,false,false,20),
    ('it','Màn hình',true,false,false,false,false,false,30),
    ('it','Máy in',true,false,false,false,false,false,40),
    ('it','Switch / Hub mạng',true,false,false,false,false,false,50),
    ('it','Wi-Fi / Access Point',true,false,false,false,false,false,60),
    ('it','Thiết bị CNTT khác',true,false,false,false,false,false,90),
    ('logistics','Xe nâng',true,true,true,false,true,true,10),
    ('logistics','Xe nâng tay',true,true,true,false,false,true,20),
    ('logistics','Xe đẩy',true,false,false,false,false,false,30),
    ('logistics','Phương tiện khác',true,true,false,false,false,true,90),
    ('safety','Rèm quang',true,true,true,false,false,true,10),
    ('safety','Thiết bị dừng khẩn',true,true,true,false,false,true,20),
    ('safety','Thiết bị an toàn khác',true,true,true,false,false,true,90),
    ('other','Tài sản khác',true,false,false,false,false,false,10)
)
insert into public.asset_types (
  group_id, name, requires_qr, requires_maintenance, requires_prestart,
  requires_calibration, tracks_downtime, uses_spare_parts, sort_order
)
select g.id, s.name, s.rq, s.rm, s.rp, s.rc, s.rd, s.rs, s.ord
from seed s
join public.asset_groups g on g.system_key = s.group_key
on conflict (group_id, lower(name)) do update
set requires_qr = excluded.requires_qr,
    requires_maintenance = excluded.requires_maintenance,
    requires_prestart = excluded.requires_prestart,
    requires_calibration = excluded.requires_calibration,
    tracks_downtime = excluded.tracks_downtime,
    uses_spare_parts = excluded.uses_spare_parts,
    sort_order = excluded.sort_order,
    updated_at = now();

update public.assets a
set asset_group_id = g.id,
    next_control_date = coalesce(a.next_control_date, a.next_maintenance_date)
from public.asset_groups g
where a.asset_group_id is null
  and g.system_key = case when a.asset_type = 'utility' then 'support' else 'production' end;

update public.assets a
set asset_type_id = t.id
from public.asset_types t
join public.asset_groups g on g.id = t.group_id
where a.asset_type_id is null
  and a.asset_group_id = g.id
  and (
    (g.system_key = 'production' and t.name = 'Thiết bị sản xuất khác')
    or (g.system_key = 'support' and t.name = 'Phụ trợ khác')
  );

alter table public.tooling add column if not exists asset_id uuid references public.assets(id);
alter table public.measuring_equipment add column if not exists asset_id uuid references public.assets(id);
alter table public.safety_equipment add column if not exists asset_id uuid references public.assets(id);

insert into public.assets (
  code, name, asset_type, location_id, status, next_control_date, qr_code, notes,
  asset_group_id, asset_type_id, legacy_source, legacy_source_id, legacy_code,
  created_at, updated_at
)
select
  t.code, t.name, 'asset', t.location_id, t.status, t.next_maintenance_date,
  'ASSET:' || t.code, t.notes,
  g.id,
  coalesce(
    (select at.id from public.asset_types at where at.group_id = g.id and lower(at.name) = lower(
      case
        when lower(coalesce(t.tooling_type,'')) like '%mold%' then 'Khuôn'
        when lower(coalesce(t.tooling_type,'')) like '%fixture%' then 'Gá / fixture'
        when lower(coalesce(t.tooling_type,'')) like '%tool%' then 'Dụng cụ chuyên dùng'
        else 'Jig'
      end
    ) limit 1),
    (select at.id from public.asset_types at where at.group_id = g.id order by at.sort_order limit 1)
  ),
  'tooling', t.id, t.code, t.created_at, t.updated_at
from public.tooling t
join public.asset_groups g on g.system_key = 'tooling'
where t.asset_id is null
  and not exists (select 1 from public.assets a where a.code = t.code);

update public.tooling t
set asset_id = a.id
from public.assets a
where t.asset_id is null
  and ((a.legacy_source = 'tooling' and a.legacy_source_id = t.id) or a.code = t.code);

insert into public.assets (
  code, name, asset_type, location_id, manufacturer, model, serial_number, status,
  next_control_date, qr_code, notes, asset_group_id, asset_type_id,
  legacy_source, legacy_source_id, legacy_code, created_at, updated_at
)
select
  m.code, m.name, 'asset', m.location_id, m.manufacturer, m.model, m.serial_number, m.status,
  m.next_calibration_date, 'ASSET:' || m.code, m.notes, g.id,
  (select at.id from public.asset_types at where at.group_id = g.id and at.name = 'Thiết bị đo khác' limit 1),
  'measuring_equipment', m.id, m.code, m.created_at, m.updated_at
from public.measuring_equipment m
join public.asset_groups g on g.system_key = 'measuring'
where m.asset_id is null
  and not exists (select 1 from public.assets a where a.code = m.code);

update public.measuring_equipment m
set asset_id = a.id
from public.assets a
where m.asset_id is null
  and ((a.legacy_source = 'measuring_equipment' and a.legacy_source_id = m.id) or a.code = m.code);

insert into public.assets (
  code, name, asset_type, location_id, status, next_control_date, notes,
  asset_group_id, asset_type_id, legacy_source, legacy_source_id, legacy_code,
  created_at, updated_at
)
select
  s.code, s.name, 'asset', s.location_id, s.status, s.next_inspection_date, s.notes,
  g.id,
  (select at.id from public.asset_types at where at.group_id = g.id and at.name = 'Thiết bị an toàn khác' limit 1),
  'safety_equipment', s.id, s.code, s.created_at, s.updated_at
from public.safety_equipment s
join public.asset_groups g on g.system_key = 'safety'
where s.asset_id is null
  and not exists (select 1 from public.assets a where a.code = s.code);

update public.safety_equipment s
set asset_id = a.id
from public.assets a
where s.asset_id is null
  and ((a.legacy_source = 'safety_equipment' and a.legacy_source_id = s.id) or a.code = s.code);

create unique index if not exists tooling_asset_id_uq on public.tooling(asset_id) where asset_id is not null;
create unique index if not exists measuring_equipment_asset_id_uq on public.measuring_equipment(asset_id) where asset_id is not null;
create unique index if not exists safety_equipment_asset_id_uq on public.safety_equipment(asset_id) where asset_id is not null;

create table if not exists public.part_inventory (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.spare_parts(id),
  location_id uuid not null references public.locations(id),
  quantity numeric not null default 0,
  min_quantity numeric not null default 0,
  max_quantity numeric,
  updated_at timestamptz not null default now(),
  unique(part_id, location_id)
);

insert into public.part_inventory (part_id, location_id, quantity, min_quantity, max_quantity)
select id, location_id, quantity, min_quantity, max_quantity
from public.spare_parts
where location_id is not null
on conflict (part_id, location_id) do nothing;

create table if not exists public.asset_parts (
  asset_id uuid not null references public.assets(id),
  part_id uuid not null references public.spare_parts(id),
  critical boolean not null default false,
  preferred_quantity numeric,
  notes text,
  primary key(asset_id, part_id)
);

create table if not exists public.meters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  asset_id uuid references public.assets(id),
  name text not null,
  meter_type text,
  unit text not null default 'unit',
  current_value numeric not null default 0,
  last_reading_at timestamptz,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meter_readings (
  id uuid primary key default gen_random_uuid(),
  meter_id uuid not null references public.meters(id),
  reading_value numeric not null,
  read_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id),
  user_id uuid not null references auth.users(id),
  role_in_team text,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key(team_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  customer_type text,
  contact_person text,
  phone text,
  email text,
  address text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cycle_counts (
  id uuid primary key default gen_random_uuid(),
  count_no text not null unique,
  location_id uuid references public.locations(id),
  status text not null default 'draft',
  planned_date date,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cycle_count_items (
  id uuid primary key default gen_random_uuid(),
  cycle_count_id uuid not null references public.cycle_counts(id) on delete cascade,
  part_id uuid not null references public.spare_parts(id),
  expected_quantity numeric not null default 0,
  counted_quantity numeric,
  variance numeric generated always as (coalesce(counted_quantity,0) - expected_quantity) stored,
  counted_by uuid references auth.users(id),
  counted_at timestamptz,
  note text,
  unique(cycle_count_id, part_id)
);

insert into public.management_code_counters (code_type, prefix, digits, description)
values
  ('asset', 'TS', 4, 'Tài sản / thiết bị'),
  ('customer', 'KH', 4, 'Khách hàng'),
  ('meter', 'DH', 4, 'Đồng hồ theo dõi'),
  ('team', 'NH', 3, 'Nhóm người dùng')
on conflict (code_type) do update
set prefix = excluded.prefix,
    digits = excluded.digits,
    description = excluded.description,
    updated_at = now();

create or replace function public.next_management_code(p_code_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_digits smallint;
  v_value bigint;
  v_code text;
  v_exists boolean;
begin
  loop
    update public.management_code_counters
       set current_value = current_value + 1,
           updated_at = now()
     where code_type = p_code_type
     returning prefix, digits, current_value into v_prefix, v_digits, v_value;

    if not found then
      raise exception 'Loại mã quản lý không hợp lệ: %', p_code_type;
    end if;

    v_code := v_prefix || '-' || lpad(v_value::text, v_digits, '0');

    case p_code_type
      when 'asset' then select exists(select 1 from public.assets where code = v_code) into v_exists;
      when 'production_asset' then select exists(select 1 from public.assets where code = v_code) into v_exists;
      when 'utility_asset' then select exists(select 1 from public.assets where code = v_code) into v_exists;
      when 'tooling_jig' then select exists(select 1 from public.tooling where code = v_code) into v_exists;
      when 'production_tool' then select exists(select 1 from public.tooling where code = v_code) into v_exists;
      when 'measuring_equipment' then select exists(select 1 from public.measuring_equipment where code = v_code) into v_exists;
      when 'spare_part' then select exists(select 1 from public.spare_parts where code = v_code) into v_exists;
      when 'maintenance_consumable' then select exists(select 1 from public.maintenance_consumables where code = v_code) into v_exists;
      when 'safety_equipment' then select exists(select 1 from public.safety_equipment where code = v_code) into v_exists;
      when 'service_supplier' then select exists(select 1 from public.service_suppliers where code = v_code) into v_exists;
      when 'customer' then select exists(select 1 from public.customers where code = v_code) into v_exists;
      when 'meter' then select exists(select 1 from public.meters where code = v_code) into v_exists;
      when 'team' then select exists(select 1 from public.teams where code = v_code) into v_exists;
      when 'location' then select exists(select 1 from public.locations where code = v_code) into v_exists;
      else raise exception 'Loại mã quản lý không hợp lệ: %', p_code_type;
    end case;

    if not v_exists then return v_code; end if;
  end loop;
end;
$$;

revoke all on function public.next_management_code(text) from public;
grant execute on function public.next_management_code(text) to authenticated;

do $$
declare
  v_table text;
  v_trigger text;
begin
  foreach v_table in array array['meters', 'teams', 'customers']
  loop
    v_trigger := 'trg_' || v_table || '_code_immutable';
    execute format('drop trigger if exists %I on public.%I', v_trigger, v_table);
    execute format('create trigger %I before update of code on public.%I for each row execute function public.prevent_management_code_change()', v_trigger, v_table);
  end loop;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'asset_groups','asset_types','part_inventory','asset_parts','meters','meter_readings',
    'teams','team_members','customers','cycle_counts','cycle_count_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('drop policy if exists authenticated_read_%I on public.%I', v_table, v_table);
    execute format('create policy authenticated_read_%I on public.%I for select to authenticated using (true)', v_table, v_table);
    execute format('drop policy if exists authenticated_insert_%I on public.%I', v_table, v_table);
    execute format('create policy authenticated_insert_%I on public.%I for insert to authenticated with check (true)', v_table, v_table);
    execute format('drop policy if exists authenticated_update_%I on public.%I', v_table, v_table);
    execute format('create policy authenticated_update_%I on public.%I for update to authenticated using (true) with check (true)', v_table, v_table);
  end loop;
end;
$$;

create index if not exists assets_group_idx on public.assets(asset_group_id);
create index if not exists assets_type_idx on public.assets(asset_type_id);
create index if not exists assets_parent_idx on public.assets(parent_asset_id);
create index if not exists meters_asset_idx on public.meters(asset_id);
create index if not exists meter_readings_meter_time_idx on public.meter_readings(meter_id, read_at desc);
create index if not exists part_inventory_location_idx on public.part_inventory(location_id);
create index if not exists cycle_counts_location_idx on public.cycle_counts(location_id);

comment on table public.asset_groups is 'Nhóm tài sản cấp cao ổn định; không tạo thêm module mỗi khi xuất hiện loại tài sản mới.';
comment on table public.asset_types is 'Loại tài sản cấu hình động. Có thể thêm, đổi tên hoặc ngừng sử dụng; không cần sửa code ứng dụng.';
comment on column public.assets.parent_asset_id is 'Quan hệ tài sản cha/con, ví dụ dây chuyền -> máy -> cụm.';
comment on table public.meters is 'Đồng hồ theo dõi giờ chạy, chu kỳ, km, nhiệt độ...; không phải thiết bị đo hiệu chuẩn QC.';
comment on table public.part_inventory is 'Tồn kho phụ tùng theo từng vị trí.';
comment on table public.cycle_counts is 'Đợt kiểm kê chu kỳ của kho phụ tùng.';
