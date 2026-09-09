revoke execute on function public.next_management_code(text) from anon;

drop policy if exists management_code_counters_no_direct_access on public.management_code_counters;
create policy management_code_counters_no_direct_access
on public.management_code_counters
for all
to authenticated
using (false)
with check (false);

create or replace function public.prevent_management_code_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.code is distinct from old.code then
    raise exception 'Mã quản lý đã cấp không được thay đổi.';
  end if;
  return new;
end;
$$;
