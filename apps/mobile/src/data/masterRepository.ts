import { supabase } from '../lib/supabase';
import type { CatalogKey, MasterRecord } from './masterData';
import { getNextLocationCode, getNextManagementCode } from './managementCodes';

type Draft = {
  code?: string;
  name: string;
  specification?: string;
  location?: string;
  nextDue?: string;
  quantity?: number;
  unit?: string;
};

const tableMap: Record<CatalogKey, string> = {
  assets: 'assets', utilities: 'assets', tooling: 'tooling', measuring: 'measuring_equipment', spareParts: 'spare_parts', consumables: 'maintenance_consumables', safety: 'safety_equipment', suppliers: 'service_suppliers',
};

async function ensureLocation(name?: string) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const existing = await supabase.from('locations').select('id').ilike('name', trimmed).limit(1).maybeSingle();
  if (existing.data?.id) return existing.data.id as string;
  const code = await getNextLocationCode();
  const created = await supabase.from('locations').insert({ code, name: trimmed }).select('id').single();
  if (created.error) throw created.error;
  return created.data.id as string;
}

function statusOf(row: any): MasterRecord['status'] {
  if (row.status === 'warning') return 'warning';
  if (row.status === 'inactive' || row.status === 'stopped') return 'inactive';
  if (typeof row.quantity === 'number' && typeof row.min_quantity === 'number' && row.quantity <= row.min_quantity) return 'warning';
  return 'active';
}

function fromRow(category: CatalogKey, row: any): MasterRecord {
  const location = row.locations?.name ?? undefined;
  if (category === 'assets' || category === 'utilities') return { id: row.id, code: row.code, name: row.name, secondary: row.model ?? row.manufacturer ?? '-', status: statusOf(row), location, nextDue: row.next_maintenance_date ?? undefined };
  if (category === 'tooling') return { id: row.id, code: row.code, name: row.name, secondary: row.specification ?? row.tooling_type ?? '-', status: statusOf(row), location, nextDue: row.next_maintenance_date ?? undefined };
  if (category === 'measuring') return { id: row.id, code: row.code, name: row.name, secondary: row.measurement_range ?? row.equipment_type ?? '-', status: statusOf(row), location, nextDue: row.next_calibration_date ?? undefined };
  if (category === 'spareParts' || category === 'consumables') return { id: row.id, code: row.code, name: row.name, secondary: row.specification ?? '-', status: statusOf(row), location, quantity: Number(row.quantity ?? 0), unit: row.unit ?? 'EA' };
  if (category === 'safety') return { id: row.id, code: row.code, name: row.name, secondary: row.equipment_type ?? '-', status: statusOf(row), location, nextDue: row.next_inspection_date ?? undefined };
  return { id: row.id, code: row.code, name: row.name, secondary: row.service_type ?? '-', status: statusOf(row), nextDue: row.next_evaluation_date ?? undefined };
}

export async function listMasterRecords(category: CatalogKey): Promise<MasterRecord[]> {
  const table = tableMap[category];
  let query: any = supabase.from(table).select(category === 'suppliers' ? '*' : '*, locations(name)').order('code');
  if (category === 'assets') query = query.eq('asset_type', 'production');
  if (category === 'utilities') query = query.eq('asset_type', 'utility');
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => fromRow(category, row));
}

async function resolveManagementCode(category: CatalogKey, id?: string, requestedCode?: string) {
  if (!id) return getNextManagementCode(category);
  if (requestedCode?.trim()) return requestedCode.trim();

  const table = tableMap[category];
  const { data, error } = await supabase.from(table).select('code').eq('id', id).single();
  if (error) throw error;
  if (!data?.code) throw new Error('Không tìm thấy mã quản lý hiện tại.');
  return data.code as string;
}

export async function saveMasterRecord(category: CatalogKey, draft: Draft, id?: string): Promise<MasterRecord> {
  if (!draft.name.trim()) throw new Error('Tên là thông tin bắt buộc.');

  const table = tableMap[category];
  const code = await resolveManagementCode(category, id, draft.code);
  const locationId = category === 'suppliers' ? null : await ensureLocation(draft.location);
  let payload: any = { code, name: draft.name.trim(), status: 'active', updated_at: new Date().toISOString() };

  if (category === 'assets' || category === 'utilities') payload = { ...payload, asset_type: category === 'assets' ? 'production' : 'utility', location_id: locationId, model: draft.specification || null, next_maintenance_date: draft.nextDue || null, qr_code: `ASSET:${code}` };
  if (category === 'tooling') payload = { ...payload, location_id: locationId, specification: draft.specification || null, next_maintenance_date: draft.nextDue || null, qr_code: `TOOL:${code}` };
  if (category === 'measuring') payload = { ...payload, location_id: locationId, measurement_range: draft.specification || null, next_calibration_date: draft.nextDue || null, qr_code: `MEASURE:${code}` };
  if (category === 'spareParts') payload = { ...payload, location_id: locationId, specification: draft.specification || null, quantity: draft.quantity ?? 0, unit: draft.unit || 'EA' };
  if (category === 'consumables') payload = { ...payload, location_id: locationId, specification: draft.specification || null, quantity: draft.quantity ?? 0, unit: draft.unit || 'EA' };
  if (category === 'safety') payload = { ...payload, location_id: locationId, equipment_type: draft.specification || null, next_inspection_date: draft.nextDue || null };
  if (category === 'suppliers') payload = { ...payload, service_type: draft.specification || null, next_evaluation_date: draft.nextDue || null, approved: true };

  const request = id ? supabase.from(table).update(payload).eq('id', id) : supabase.from(table).insert(payload);
  const { data, error } = await request.select(category === 'suppliers' ? '*' : '*, locations(name)').single();
  if (error) throw error;
  return fromRow(category, data);
}

export async function deleteMasterRecord(category: CatalogKey, id: string) {
  const { error } = await supabase.from(tableMap[category]).delete().eq('id', id);
  if (error) throw error;
}
