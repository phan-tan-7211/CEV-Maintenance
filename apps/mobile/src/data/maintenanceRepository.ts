import { supabase } from '../lib/supabase';

export type MaintenanceFilter = 'today' | 'week' | 'upcoming' | 'history';
export type MaintenanceStatusFilter = 'due' | 'upcoming' | 'overdue' | 'completed';
export type MaintenanceKind = 'pm' | 'prestart';
export type ChecklistResult = 'pass' | 'fail' | 'na';
export type FrequencyUnit = 'day' | 'week' | 'month';

export type ChecklistItem = {
  id: string;
  label: string;
  required?: boolean;
};

export type ChecklistAnswer = ChecklistItem & {
  result?: ChecklistResult;
  note?: string;
};

export type MaintenanceAsset = {
  id: string;
  code: string;
  name: string;
  type?: string;
  requiresMaintenance: boolean;
  requiresPrestart: boolean;
};

export type MaintenancePlan = {
  id: string;
  code: string;
  name: string;
  description?: string;
  kind: MaintenanceKind;
  assetId?: string;
  asset?: string;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  checklist: ChecklistItem[];
  lastPerformedAt?: string;
  nextDueDate?: string;
  active: boolean;
};

export type MaintenanceExecution = {
  id: string;
  planId: string;
  planCode: string;
  planName: string;
  assetId: string;
  asset: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  result?: ChecklistResult;
  checklist: ChecklistAnswer[];
  notes?: string;
  workOrderId?: string;
  startedAt?: string;
  startedBy?: string;
  completedAt?: string;
  completedBy?: string;
};

export type DailyCheck = {
  id: string;
  assetId: string;
  asset: string;
  checkDate: string;
  checkedAt: string;
  checkedBy?: string;
  result: ChecklistResult;
  checklist: ChecklistAnswer[];
  note?: string;
  workOrderId?: string;
};

// Backward-compatible shape for the existing App.tsx route contract.
export type MaintenanceRow = {
  id: string;
  code: string;
  name: string;
  due?: string;
  asset?: string;
  frequency?: string;
};

const PLAN_SELECT = 'id,code,name,description,plan_kind,asset_id,frequency_value,frequency_unit,checklist,last_performed_at,next_due_date,active,assets(name,code)';
const EXECUTION_SELECT = 'id,maintenance_plan_id,asset_id,due_date,status,result,checklist_results,notes,work_order_id,started_at,started_by,completed_at,completed_by,maintenance_plans(code,name),assets(name,code)';

function normalizeChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any, index) => {
    if (typeof item === 'string') return { id: `item-${index + 1}`, label: item, required: true };
    return {
      id: String(item?.id ?? `item-${index + 1}`),
      label: String(item?.label ?? item?.name ?? item?.text ?? ''),
      required: item?.required !== false,
    };
  }).filter((item) => item.label.trim().length > 0);
}

function normalizeAnswers(value: unknown): ChecklistAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any, index) => ({
    id: String(item?.id ?? `item-${index + 1}`),
    label: String(item?.label ?? item?.name ?? item?.text ?? ''),
    required: item?.required !== false,
    result: item?.result === 'pass' || item?.result === 'fail' || item?.result === 'na' ? item.result : undefined,
    note: item?.note ? String(item.note) : undefined,
  })).filter((item) => item.label.trim().length > 0);
}

function mapPlan(row: any): MaintenancePlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    kind: row.plan_kind === 'prestart' ? 'prestart' : 'pm',
    assetId: row.asset_id ?? undefined,
    asset: row.assets ? `${row.assets.name} ${row.assets.code}` : undefined,
    frequencyValue: Number(row.frequency_value ?? 1),
    frequencyUnit: row.frequency_unit === 'day' || row.frequency_unit === 'week' ? row.frequency_unit : 'month',
    checklist: normalizeChecklist(row.checklist),
    lastPerformedAt: row.last_performed_at ?? undefined,
    nextDueDate: row.next_due_date ?? undefined,
    active: Boolean(row.active),
  };
}

function mapExecution(row: any): MaintenanceExecution {
  const plan = Array.isArray(row.maintenance_plans) ? row.maintenance_plans[0] : row.maintenance_plans;
  const asset = Array.isArray(row.assets) ? row.assets[0] : row.assets;
  return {
    id: row.id,
    planId: row.maintenance_plan_id,
    planCode: plan?.code ?? 'PM',
    planName: plan?.name ?? 'Preventive maintenance',
    assetId: row.asset_id,
    asset: asset ? `${asset.name} ${asset.code}` : '-',
    dueDate: row.due_date,
    status: row.status === 'completed' ? 'completed' : row.status === 'in_progress' ? 'in_progress' : 'pending',
    result: row.result === 'pass' || row.result === 'fail' || row.result === 'na' ? row.result : undefined,
    checklist: normalizeAnswers(row.checklist_results),
    notes: row.notes ?? undefined,
    workOrderId: row.work_order_id ?? undefined,
    startedAt: row.started_at ?? undefined,
    startedBy: row.started_by ?? undefined,
    completedAt: row.completed_at ?? undefined,
    completedBy: row.completed_by ?? undefined,
  };
}

export async function listMaintenanceAssets(kind: MaintenanceKind): Promise<MaintenanceAsset[]> {
  const flag = kind === 'prestart' ? 'requires_prestart' : 'requires_maintenance';
  const { data, error } = await supabase
    .from('assets')
    .select('id,code,name,asset_types(name,requires_maintenance,requires_prestart)')
    .eq('status', 'active')
    .eq(`asset_types.${flag}`, true)
    .order('code', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => {
    const type = Array.isArray(row.asset_types) ? row.asset_types[0] : row.asset_types;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: type?.name ?? undefined,
      requiresMaintenance: Boolean(type?.requires_maintenance),
      requiresPrestart: Boolean(type?.requires_prestart),
    };
  }).filter((asset) => kind === 'prestart' ? asset.requiresPrestart : asset.requiresMaintenance);
}

export async function listMaintenancePlans(kind?: MaintenanceKind): Promise<MaintenancePlan[]> {
  let query: any = supabase.from('maintenance_plans').select(PLAN_SELECT).order('active', { ascending: false }).order('next_due_date', { ascending: true });
  if (kind) query = query.eq('plan_kind', kind);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapPlan);
}

export async function saveMaintenancePlan(input: {
  id?: string;
  name: string;
  description?: string;
  kind: MaintenanceKind;
  assetId: string;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  nextDueDate?: string;
  active: boolean;
  checklist: ChecklistItem[];
}): Promise<MaintenancePlan> {
  if (!input.name.trim()) throw new Error('Plan name is required.');
  if (!input.assetId) throw new Error('Asset is required.');
  if (!input.checklist.some((item) => item.label.trim())) throw new Error('At least one checklist item is required.');

  const eligible = await listMaintenanceAssets(input.kind);
  if (!eligible.some((asset) => asset.id === input.assetId)) {
    throw new Error(input.kind === 'prestart' ? 'This asset type does not require pre-start checks.' : 'This asset type does not require maintenance.');
  }

  const cleanChecklist = input.checklist.map((item, index) => ({
    id: item.id || `item-${index + 1}`,
    label: item.label.trim(),
    required: item.required !== false,
  })).filter((item) => item.label.length > 0);

  const payload: Record<string, any> = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    plan_kind: input.kind,
    asset_id: input.assetId,
    frequency_value: Math.max(1, Math.floor(Number(input.frequencyValue) || 1)),
    frequency_unit: input.frequencyUnit,
    next_due_date: input.nextDueDate || null,
    active: input.active,
    checklist: cleanChecklist,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase.from('maintenance_plans').update(payload).eq('id', input.id).select(PLAN_SELECT).single();
    if (error) throw error;
    return mapPlan(data);
  }

  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(2, 12);
  payload.code = `${input.kind === 'prestart' ? 'PRE' : 'PM'}-${stamp}`;
  const { data, error } = await supabase.from('maintenance_plans').insert(payload).select(PLAN_SELECT).single();
  if (error) throw error;
  return mapPlan(data);
}

export async function setMaintenancePlanActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('maintenance_plans').update({ active, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function syncMaintenanceSchedule(horizonDays = 45): Promise<void> {
  const { error } = await supabase.rpc('sync_pm_due_executions', { p_horizon_days: horizonDays });
  if (error) throw error;
}

export async function listMaintenanceExecutions(filter: MaintenanceStatusFilter): Promise<MaintenanceExecution[]> {
  await syncMaintenanceSchedule();
  const today = new Date().toISOString().slice(0, 10);
  const upcomingEnd = new Date();
  upcomingEnd.setDate(upcomingEnd.getDate() + 30);
  let query: any = supabase.from('maintenance_executions').select(EXECUTION_SELECT).order('due_date', { ascending: true });
  if (filter === 'completed') query = query.eq('status', 'completed').order('completed_at', { ascending: false });
  if (filter === 'overdue') query = query.neq('status', 'completed').lt('due_date', today);
  if (filter === 'due') query = query.neq('status', 'completed').eq('due_date', today);
  if (filter === 'upcoming') query = query.neq('status', 'completed').gt('due_date', today).lte('due_date', upcomingEnd.toISOString().slice(0, 10));
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapExecution);
}

export async function startMaintenanceExecution(id: string): Promise<MaintenanceExecution> {
  const { data, error } = await supabase.rpc('start_maintenance_execution', { p_execution_id: id });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error('Unable to start maintenance execution.');
  const { data: full, error: fetchError } = await supabase.from('maintenance_executions').select(EXECUTION_SELECT).eq('id', row.id).single();
  if (fetchError) throw fetchError;
  return mapExecution(full);
}

export async function completeMaintenanceExecution(id: string, input: {
  checklist: ChecklistAnswer[];
  notes?: string;
  createWorkOrderOnFail?: boolean;
}): Promise<MaintenanceExecution> {
  const missing = input.checklist.filter((item) => item.required !== false && !item.result);
  if (missing.length) throw new Error('Complete every required checklist item before finishing.');
  const result: ChecklistResult = input.checklist.some((item) => item.result === 'fail') ? 'fail' : input.checklist.every((item) => item.result === 'na') ? 'na' : 'pass';
  const { data, error } = await supabase.rpc('complete_maintenance_execution', {
    p_execution_id: id,
    p_checklist_results: input.checklist,
    p_result: result,
    p_notes: input.notes?.trim() || null,
    p_create_work_order: Boolean(input.createWorkOrderOnFail && result === 'fail'),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error('Unable to complete maintenance execution.');
  const { data: full, error: fetchError } = await supabase.from('maintenance_executions').select(EXECUTION_SELECT).eq('id', row.id).single();
  if (fetchError) throw fetchError;
  return mapExecution(full);
}

export async function listPrestartPlans(): Promise<MaintenancePlan[]> {
  return listMaintenancePlans('prestart');
}

export async function listDailyChecks(assetId?: string, limit = 30): Promise<DailyCheck[]> {
  let query: any = supabase.from('daily_checkins').select('id,asset_id,check_date,checked_at,checked_by,overall_result,checklist_results,note,work_order_id,assets(name,code)').order('checked_at', { ascending: false }).limit(limit);
  if (assetId) query = query.eq('asset_id', assetId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    assetId: row.asset_id,
    asset: row.assets ? `${row.assets.name} ${row.assets.code}` : '-',
    checkDate: row.check_date,
    checkedAt: row.checked_at,
    checkedBy: row.checked_by ?? undefined,
    result: row.overall_result === 'fail' || row.overall_result === 'na' ? row.overall_result : 'pass',
    checklist: normalizeAnswers(row.checklist_results),
    note: row.note ?? undefined,
    workOrderId: row.work_order_id ?? undefined,
  }));
}

export async function submitDailyCheck(input: {
  assetId: string;
  planId: string;
  checklist: ChecklistAnswer[];
  note?: string;
  createWorkOrderOnFail?: boolean;
}): Promise<DailyCheck> {
  const eligible = await listMaintenanceAssets('prestart');
  if (!eligible.some((asset) => asset.id === input.assetId)) throw new Error('This asset does not require a pre-start check.');
  const missing = input.checklist.filter((item) => item.required !== false && !item.result);
  if (missing.length) throw new Error('Complete every required checklist item.');
  const result: ChecklistResult = input.checklist.some((item) => item.result === 'fail') ? 'fail' : input.checklist.every((item) => item.result === 'na') ? 'na' : 'pass';
  const { data, error } = await supabase.rpc('submit_daily_checkin', {
    p_asset_id: input.assetId,
    p_plan_id: input.planId,
    p_checklist_results: input.checklist,
    p_result: result,
    p_note: input.note?.trim() || null,
    p_create_work_order: Boolean(input.createWorkOrderOnFail && result === 'fail'),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error('Unable to save daily check.');
  const history = await listDailyChecks(input.assetId, 10);
  const saved = history.find((item) => item.id === row.id);
  if (!saved) throw new Error('Daily check saved but could not be reloaded.');
  return saved;
}

export async function getTodayPrestartState(): Promise<Array<{ asset: MaintenanceAsset; plan?: MaintenancePlan; completed?: DailyCheck }>> {
  const [assets, plans, history] = await Promise.all([listMaintenanceAssets('prestart'), listPrestartPlans(), listDailyChecks(undefined, 100)]);
  const today = new Date().toISOString().slice(0, 10);
  return assets.map((asset) => ({
    asset,
    plan: plans.find((plan) => plan.active && plan.assetId === asset.id),
    completed: history.find((item) => item.assetId === asset.id && item.checkDate === today),
  }));
}

export async function listMaintenance(filter: MaintenanceFilter): Promise<MaintenanceRow[]> {
  if (filter === 'history') {
    const completed = await listMaintenanceExecutions('completed');
    return completed.map((row) => ({ id: row.id, code: row.planCode, name: row.planName, due: row.completedAt, asset: row.asset }));
  }
  const status: MaintenanceStatusFilter = filter === 'today' ? 'due' : 'upcoming';
  const rows = await listMaintenanceExecutions(status);
  return rows.map((row) => ({ id: row.id, code: row.planCode, name: row.planName, due: row.dueDate, asset: row.asset }));
}
