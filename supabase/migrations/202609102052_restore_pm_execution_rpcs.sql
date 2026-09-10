create or replace function public.start_maintenance_execution(p_execution_id uuid)
returns public.maintenance_executions
language plpgsql security definer set search_path=public as $$
declare v public.maintenance_executions%rowtype;
begin
  update public.maintenance_executions
  set status='in_progress', started_at=coalesce(started_at,now()), started_by=coalesce(started_by,auth.uid()), updated_at=now()
  where id=p_execution_id and status in ('pending','in_progress')
  returning * into v;
  if v.id is null then raise exception 'maintenance execution not found or already completed'; end if;
  return v;
end;$$;

grant execute on function public.start_maintenance_execution(uuid) to authenticated;

create or replace function public.complete_maintenance_execution(
  p_execution_id uuid,
  p_checklist_results jsonb,
  p_result text,
  p_notes text default null,
  p_create_work_order boolean default false
) returns public.maintenance_executions
language plpgsql security definer set search_path=public as $$
declare
  v public.maintenance_executions%rowtype;
  p public.maintenance_plans%rowtype;
  v_wo_id uuid;
  v_wo_code text;
begin
  if p_result not in ('pass','fail','na') then raise exception 'invalid result'; end if;
  select * into v from public.maintenance_executions where id=p_execution_id for update;
  if v.id is null then raise exception 'maintenance execution not found'; end if;
  if v.status='completed' then return v; end if;

  if p_create_work_order and p_result='fail' then
    v_wo_code:=public.next_management_code('work_order');
    insert into public.work_orders(code,title,description,asset_id,maintenance_plan_id,work_type,priority,status,requested_by)
    values(v_wo_code,'PM follow-up','Created from failed PM execution',v.asset_id,v.maintenance_plan_id,'corrective','high','open',auth.uid())
    returning id into v_wo_id;
  end if;

  update public.maintenance_executions
  set status='completed', result=p_result, checklist_results=coalesce(p_checklist_results,'[]'::jsonb), notes=nullif(trim(p_notes),''),
      work_order_id=coalesce(v_wo_id,work_order_id), completed_at=now(), completed_by=auth.uid(), updated_at=now()
  where id=p_execution_id returning * into v;

  select * into p from public.maintenance_plans where id=v.maintenance_plan_id for update;
  if p.id is not null then
    update public.maintenance_plans
    set last_performed_at=now(),
        next_due_date=case p.frequency_unit
          when 'day' then v.due_date + p.frequency_value
          when 'week' then v.due_date + (p.frequency_value*7)
          when 'month' then (v.due_date + make_interval(months=>p.frequency_value))::date
        end,
        updated_at=now()
    where id=p.id;
  end if;

  insert into public.maintenance_history(work_order_id,asset_id,action,details,performed_by)
  values(v.work_order_id,v.asset_id,'pm_completed',jsonb_build_object('execution_id',v.id,'result',p_result)::text,auth.uid());
  return v;
end;$$;

grant execute on function public.complete_maintenance_execution(uuid,jsonb,text,text,boolean) to authenticated;

create or replace function public.submit_daily_checkin(
  p_asset_id uuid,
  p_plan_id uuid,
  p_checklist_results jsonb,
  p_result text,
  p_note text default null,
  p_create_work_order boolean default false
) returns public.daily_checkins
language plpgsql security definer set search_path=public as $$
declare v public.daily_checkins%rowtype; v_wo_id uuid; v_code text;
begin
  if p_result not in ('pass','fail','na') then raise exception 'invalid result'; end if;
  if p_create_work_order and p_result='fail' then
    v_code:=public.next_management_code('work_order');
    insert into public.work_orders(code,title,description,asset_id,maintenance_plan_id,work_type,priority,status,requested_by)
    values(v_code,'Pre-start follow-up','Created from failed pre-start check',p_asset_id,p_plan_id,'corrective','high','open',auth.uid())
    returning id into v_wo_id;
  end if;

  insert into public.daily_checkins(asset_id,maintenance_plan_id,work_order_id,check_date,checklist_results,overall_result,note,checked_by,checked_at)
  values(p_asset_id,p_plan_id,v_wo_id,current_date,coalesce(p_checklist_results,'[]'::jsonb),p_result,nullif(trim(p_note),''),auth.uid(),now())
  on conflict(asset_id,check_date) do update
  set maintenance_plan_id=excluded.maintenance_plan_id, work_order_id=coalesce(excluded.work_order_id,public.daily_checkins.work_order_id),
      checklist_results=excluded.checklist_results, overall_result=excluded.overall_result, note=excluded.note,
      checked_by=auth.uid(), checked_at=now()
  returning * into v;

  insert into public.maintenance_history(work_order_id,asset_id,action,details,performed_by)
  values(v.work_order_id,p_asset_id,'prestart_check',jsonb_build_object('daily_checkin_id',v.id,'result',p_result)::text,auth.uid());
  return v;
end;$$;

grant execute on function public.submit_daily_checkin(uuid,uuid,jsonb,text,text,boolean) to authenticated;
