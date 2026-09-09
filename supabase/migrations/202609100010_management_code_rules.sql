create table if not exists public.management_code_counters (
  code_type text primary key,
  prefix text not null unique,
  digits smallint not null check (digits between 2 and 8),
  current_value bigint not null default 0,
  description text not null,
  updated_at timestamptz not null default now()
);

insert into public.management_code_counters (code_type, prefix, digits, description)
values
  ('production_asset', 'TB', 4, 'Thiết bị sản xuất'),
  ('utility_asset', 'PTB', 4, 'Thiết bị phụ trợ'),
  ('tooling_jig', 'JIG', 4, 'Jig, gá, khuôn'),
  ('production_tool', 'DC', 4, 'Dụng cụ sản xuất'),
  ('measuring_equipment', 'TBD', 4, 'Thiết bị đo/kiểm tra'),
  ('spare_part', 'PT', 4, 'Phụ tùng thay thế'),
  ('maintenance_consumable', 'VT', 4, 'Vật tư bảo trì'),
  ('safety_equipment', 'AT', 4, 'Thiết bị an toàn'),
  ('service_supplier', 'NCC', 4, 'Nhà cung cấp dịch vụ'),
  ('location', 'KV', 3, 'Khu vực/vị trí')
on conflict (code_type) do update
set prefix = excluded.prefix,
    digits = excluded.digits,
    description = excluded.description,
    updated_at = now();

alter table public.management_code_counters enable row level security;
revoke all on public.management_code_counters from anon, authenticated;

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
     returning prefix, digits, current_value
          into v_prefix, v_digits, v_value;

    if not found then
      raise exception 'Loại mã quản lý không hợp lệ: %', p_code_type;
    end if;

    v_code := v_prefix || '-' || lpad(v_value::text, v_digits, '0');

    case p_code_type
      when 'production_asset' then
        select exists(select 1 from public.assets where code = v_code) into v_exists;
      when 'utility_asset' then
        select exists(select 1 from public.assets where code = v_code) into v_exists;
      when 'tooling_jig' then
        select exists(select 1 from public.tooling where code = v_code) into v_exists;
      when 'production_tool' then
        select exists(select 1 from public.tooling where code = v_code) into v_exists;
      when 'measuring_equipment' then
        select exists(select 1 from public.measuring_equipment where code = v_code) into v_exists;
      when 'spare_part' then
        select exists(select 1 from public.spare_parts where code = v_code) into v_exists;
      when 'maintenance_consumable' then
        select exists(select 1 from public.maintenance_consumables where code = v_code) into v_exists;
      when 'safety_equipment' then
        select exists(select 1 from public.safety_equipment where code = v_code) into v_exists;
      when 'service_supplier' then
        select exists(select 1 from public.service_suppliers where code = v_code) into v_exists;
      when 'location' then
        select exists(select 1 from public.locations where code = v_code) into v_exists;
      else
        raise exception 'Loại mã quản lý không hợp lệ: %', p_code_type;
    end case;

    if not v_exists then
      return v_code;
    end if;
  end loop;
end;
$$;

revoke all on function public.next_management_code(text) from public;
grant execute on function public.next_management_code(text) to authenticated;

create or replace function public.prevent_management_code_change()
returns trigger
language plpgsql
as $$
begin
  if new.code is distinct from old.code then
    raise exception 'Mã quản lý đã cấp không được thay đổi.';
  end if;
  return new;
end;
$$;

do $$
declare
  v_table text;
  v_trigger text;
begin
  foreach v_table in array array[
    'assets',
    'tooling',
    'measuring_equipment',
    'spare_parts',
    'maintenance_consumables',
    'safety_equipment',
    'service_suppliers',
    'locations'
  ]
  loop
    v_trigger := 'trg_' || v_table || '_code_immutable';
    execute format('drop trigger if exists %I on public.%I', v_trigger, v_table);
    execute format(
      'create trigger %I before update of code on public.%I for each row execute function public.prevent_management_code_change()',
      v_trigger,
      v_table
    );
  end loop;
end;
$$;

comment on table public.management_code_counters is 'Bộ đếm mã quản lý theo quy định CEV-QT-TBSX Rev.02.';
comment on function public.next_management_code(text) is 'Tự động cấp mã quản lý duy nhất; mã đã cấp không tái sử dụng.';
