import { supabase } from '../lib/supabase';

export type MaintenanceFilter = 'today' | 'week' | 'upcoming' | 'history';
export type MaintenanceRow = { id: string; code: string; name: string; due?: string; asset?: string; frequency?: string; };

export async function listMaintenance(filter: MaintenanceFilter): Promise<MaintenanceRow[]> {
  if (filter === 'history') {
    const { data, error } = await supabase.from('maintenance_history').select('id,action,performed_at,assets(name,code)').order('performed_at', { ascending: false }).limit(50);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ id: row.id, code: 'HISTORY', name: row.action, due: row.performed_at, asset: row.assets ? `${row.assets.name} ${row.assets.code}` : undefined }));
  }
  let query: any = supabase.from('maintenance_plans').select('id,code,name,next_due_date,frequency_value,frequency_unit,assets(name,code)').eq('active', true).order('next_due_date', { ascending: true });
  const today = new Date();
  const todayText = today.toISOString().slice(0,10);
  if (filter === 'today') query = query.eq('next_due_date', todayText);
  if (filter === 'week') {
    const end = new Date(today); end.setDate(end.getDate()+7);
    query = query.gte('next_due_date', todayText).lte('next_due_date', end.toISOString().slice(0,10));
  }
  if (filter === 'upcoming') query = query.gte('next_due_date', todayText);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id, code: row.code, name: row.name, due: row.next_due_date ?? undefined, asset: row.assets ? `${row.assets.name} ${row.assets.code}` : undefined, frequency: `${row.frequency_value} ${row.frequency_unit}` }));
}
