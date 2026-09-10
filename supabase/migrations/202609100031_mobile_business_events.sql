create table if not exists public.mobile_business_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  payload_version integer not null default 1,
  device_timestamp timestamptz,
  actor_id uuid,
  status text not null default 'applied',
  server_timestamp timestamptz not null default now(),
  result jsonb,
  created_at timestamptz not null default now()
);

alter table public.mobile_business_events enable row level security;
create policy "mobile events readable by authenticated" on public.mobile_business_events for select to authenticated using (true);

create or replace function public.apply_mobile_business_event(
  p_client_event_id text,
  p_event_type text,
  p_payload jsonb,
  p_payload_version integer,
  p_device_timestamp timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_result jsonb;
  v_result jsonb := '{}'::jsonb;
  v_work_order_id uuid;
  v_code text;
begin
  select result into existing_result from mobile_business_events where client_event_id = p_client_event_id;
  if found then return coalesce(existing_result, jsonb_build_object('deduplicated', true)); end if;

  if p_event_type = 'asset.scan' then
    v_result := jsonb_build_object('asset_id', p_payload->>'asset_id');
  elsif p_event_type = 'work_order.create' then
    v_code := 'WO-' || to_char(clock_timestamp(), 'YYMMDDHH24MISSMS');
    insert into work_orders(code,title,description,asset_id,priority,work_type,requested_by,status)
    values(v_code, trim(p_payload->>'title'), nullif(trim(p_payload->>'description'), ''), nullif(p_payload->>'assetId','')::uuid,
      coalesce(nullif(p_payload->>'priority',''),'medium'), coalesce(nullif(p_payload->>'workType',''),'corrective'), auth.uid(), 'open')
    returning id into v_work_order_id;
    v_result := jsonb_build_object('work_order_id', v_work_order_id, 'code', v_code, 'photo_local_paths', coalesce(p_payload->'photo_local_paths','[]'::jsonb));
  elsif p_event_type in ('work_order.start','work_order.hold','work_order.complete') then
    v_work_order_id := (p_payload->>'work_order_id')::uuid;
    update work_orders set
      status = case p_event_type when 'work_order.start' then 'in_progress' when 'work_order.hold' then 'on_hold' else 'completed' end,
      started_at = case when p_event_type = 'work_order.start' and started_at is null then now() else started_at end,
      completed_at = case when p_event_type = 'work_order.complete' then now() else completed_at end,
      updated_at = now()
    where id = v_work_order_id;
    if not found then raise exception 'work order not found'; end if;
    v_result := jsonb_build_object('work_order_id', v_work_order_id);
  else
    raise exception 'unsupported mobile event type: %', p_event_type;
  end if;

  insert into mobile_business_events(client_event_id,event_type,payload,payload_version,device_timestamp,actor_id,status,result)
  values(p_client_event_id,p_event_type,p_payload,p_payload_version,p_device_timestamp,auth.uid(),'applied',v_result);

  return v_result || jsonb_build_object('server_timestamp', now());
exception when unique_violation then
  select result into existing_result from mobile_business_events where client_event_id = p_client_event_id;
  return coalesce(existing_result, jsonb_build_object('deduplicated', true));
end;
$$;

grant execute on function public.apply_mobile_business_event(text,text,jsonb,integer,timestamptz) to authenticated;
