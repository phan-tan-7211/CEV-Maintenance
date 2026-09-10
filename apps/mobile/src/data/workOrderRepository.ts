import { supabase } from '../lib/supabase';

export type WorkFilter = 'repair' | 'open' | 'mine' | 'overdue' | 'completed';
export type WorkOrderRow = {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  workType: string;
  description?: string;
  dueAt?: string;
  requestedAt?: string;
  startedAt?: string;
  completedAt?: string;
  downtimeMinutes: number;
  rootCause?: string;
  correctiveAction?: string;
  postRepairVerified: boolean;
  assetId?: string;
  asset?: string;
};

const SELECT = 'id,code,title,status,priority,work_type,description,due_at,requested_at,started_at,completed_at,downtime_minutes,root_cause,corrective_action,post_repair_verified,asset_id,assigned_to,assets(name,code)';

function mapRow(row: any): WorkOrderRow {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    status: row.status,
    priority: row.priority,
    workType: row.work_type,
    description: row.description ?? undefined,
    dueAt: row.due_at ?? undefined,
    requestedAt: row.requested_at ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    downtimeMinutes: row.downtime_minutes ?? 0,
    rootCause: row.root_cause ?? undefined,
    correctiveAction: row.corrective_action ?? undefined,
    postRepairVerified: Boolean(row.post_repair_verified),
    assetId: row.asset_id ?? undefined,
    asset: row.assets ? `${row.assets.name} ${row.assets.code}` : undefined,
  };
}

export async function listWorkOrders(filter: WorkFilter): Promise<WorkOrderRow[]> {
  let query: any = supabase.from('work_orders').select(SELECT).order('requested_at', { ascending: false });
  if (filter === 'repair') query = query.eq('work_type', 'corrective').neq('status', 'completed');
  if (filter === 'open') query = query.neq('status', 'completed');
  if (filter === 'overdue') query = query.neq('status', 'completed').lt('due_at', new Date().toISOString());
  if (filter === 'completed') query = query.eq('status', 'completed');
  if (filter === 'mine') {
    const { data } = await supabase.auth.getUser();
    query = query.eq('assigned_to', data.user?.id ?? '00000000-0000-0000-0000-000000000000');
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getWorkOrder(id: string): Promise<WorkOrderRow> {
  const { data, error } = await supabase.from('work_orders').select(SELECT).eq('id', id).single();
  if (error) throw error;
  return mapRow(data);
}

export async function createWorkOrder(input: {
  title: string;
  description?: string;
  assetId?: string;
  priority?: string;
  workType?: string;
  dueAt?: string;
}): Promise<WorkOrderRow> {
  const { data: auth } = await supabase.auth.getUser();
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(2, 14);
  const code = `WO-${stamp}`;
  const payload = {
    code,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    asset_id: input.assetId || null,
    priority: input.priority ?? 'medium',
    work_type: input.workType ?? 'corrective',
    due_at: input.dueAt || null,
    requested_by: auth.user?.id ?? null,
    status: 'open',
  };
  const { data, error } = await supabase.from('work_orders').insert(payload).select(SELECT).single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateWorkOrderStatus(id: string, status: string): Promise<WorkOrderRow> {
  const now = new Date().toISOString();
  const patch: Record<string, any> = { status, updated_at: now };
  if (status === 'in_progress') patch.started_at = now;
  if (status === 'completed') patch.completed_at = now;
  const { data, error } = await supabase.from('work_orders').update(patch).eq('id', id).select(SELECT).single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateWorkOrderCloseout(id: string, input: { rootCause?: string; correctiveAction?: string; downtimeMinutes?: number; postRepairVerified?: boolean }): Promise<WorkOrderRow> {
  const { data, error } = await supabase.from('work_orders').update({
    root_cause: input.rootCause?.trim() || null,
    corrective_action: input.correctiveAction?.trim() || null,
    downtime_minutes: Math.max(0, Number(input.downtimeMinutes ?? 0)),
    post_repair_verified: Boolean(input.postRepairVerified),
    updated_at: new Date().toISOString(),
  }).eq('id', id).select(SELECT).single();
  if (error) throw error;
  return mapRow(data);
}
