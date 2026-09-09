import { supabase } from '../lib/supabase';

export type WorkFilter = 'repair' | 'open' | 'mine' | 'overdue' | 'completed';
export type WorkOrderRow = { id: string; code: string; title: string; status: string; priority: string; dueAt?: string; asset?: string; };

export async function listWorkOrders(filter: WorkFilter): Promise<WorkOrderRow[]> {
  let query: any = supabase.from('work_orders').select('id,code,title,status,priority,due_at,assigned_to,assets(name,code)').order('due_at', { ascending: true, nullsFirst: false });
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
  return (data ?? []).map((row: any) => ({ id: row.id, code: row.code, title: row.title, status: row.status, priority: row.priority, dueAt: row.due_at ?? undefined, asset: row.assets ? `${row.assets.name} ${row.assets.code}` : undefined }));
}
