import { supabase } from '../lib/supabase';

export type DashboardData = {
  openWork: number;
  overdue: number;
  pmToday: number;
  stoppedEquipment: number;
  attention: { code: string; title: string; asset: string }[];
};

export async function loadDashboard(): Promise<DashboardData> {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const [openWorkRes, overdueRes, pmRes, stoppedRes, attentionRes] = await Promise.all([
    supabase.from('work_orders').select('*', { count: 'exact', head: true }).not('status', 'in', '(completed,cancelled)'),
    supabase.from('work_orders').select('*', { count: 'exact', head: true }).not('status', 'in', '(completed,cancelled)').lt('due_at', now),
    supabase.from('maintenance_plans').select('*', { count: 'exact', head: true }).eq('active', true).eq('next_due_date', today),
    supabase.from('assets').select('*', { count: 'exact', head: true }).in('status', ['inactive', 'retired']),
    supabase.from('work_orders').select('code,title,priority,due_at,assets(name,code)').not('status', 'in', '(completed,cancelled)').order('due_at', { ascending: true, nullsFirst: false }).limit(5),
  ]);

  for (const result of [openWorkRes, overdueRes, pmRes, stoppedRes, attentionRes]) if (result.error) throw result.error;
  return {
    openWork: openWorkRes.count ?? 0,
    overdue: overdueRes.count ?? 0,
    pmToday: pmRes.count ?? 0,
    stoppedEquipment: stoppedRes.count ?? 0,
    attention: (attentionRes.data ?? []).map((row: any) => ({ code: row.code, title: row.title, asset: row.assets ? `${row.assets.name} ${row.assets.code}` : '-' })),
  };
}
