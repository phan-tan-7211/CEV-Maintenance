alter table public.maintenance_plans add column if not exists code text unique;

insert into public.management_code_counters(code_type,prefix,digits,current_value,description)
values
  ('pm_plan','PM',5,0,'Kế hoạch bảo trì định kỳ'),
  ('prestart_plan','PRE',5,0,'Kiểm tra trước vận hành')
on conflict(code_type) do update
set prefix=excluded.prefix,digits=excluded.digits,description=excluded.description;
