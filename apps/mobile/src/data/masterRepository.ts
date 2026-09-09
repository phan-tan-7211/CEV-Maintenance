import { supabase } from '../lib/supabase';
import type { AssetControlFlags, AssetGroupOption, AssetTypeOption, CatalogKey, MasterRecord } from './masterData';
import { getNextManagementCode, hasAutomaticManagementCode } from './managementCodes';

export type MasterDraft = {
  code?: string;
  name: string;
  specification?: string;
  location?: string;
  nextDue?: string;
  quantity?: number;
  unit?: string;
  currentValue?: number;
  groupId?: string;
  typeId?: string;
  parentCode?: string;
  linkedAssetCode?: string;
  meterType?: string;
  flags?: AssetControlFlags;
};

const tableMap: Record<CatalogKey, string> = {
  assets: 'assets',
  locations: 'locations',
  spareParts: 'spare_parts',
  consumables: 'maintenance_consumables',
  suppliers: 'service_suppliers',
  customers: 'customers',
  meters: 'meters',
  teams: 'teams',
  assetTypes: 'asset_types',
};

async function ensureLocation(name?: string) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const existing = await supabase.from('locations').select('id').ilike('name', trimmed).limit(1).maybeSingle();
  if (existing.data?.id) return existing.data.id as string;
  const code = await getNextManagementCode('locations');
  const created = await supabase.from('locations').insert({ code, name: trimmed }).select('id').single();
  if (created.error) throw created.error;
  return created.data.id as string;
}

async function assetIdFromCode(code?: string) {
  const value = code?.trim();
  if (!value) return null;
  const { data, error } = await supabase.from('assets').select('id').eq('code', value).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error(`Không tìm thấy tài sản ${value}.`);
  return data.id as string;
}

async function locationIdFromCode(code?: string) {
  const value = code?.trim();
  if (!value) return null;
  const { data, error } = await supabase.from('locations').select('id').eq('code', value).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error(`Không tìm thấy vị trí ${value}.`);
  return data.id as string;
}

function statusOf(row: any): MasterRecord['status'] {
  if (row.active === false) return 'inactive';
  if (row.status === 'warning') return 'warning';
  if (row.status === 'inactive' || row.status === 'stopped') return 'inactive';
  const quantity = Number(row.quantity ?? 0);
  const minimum = Number(row.min_quantity ?? 0);
  if (row.quantity != null && row.min_quantity != null && quantity <= minimum) return 'warning';
  return 'active';
}

function flagsOf(row: any): AssetControlFlags {
  return {
    requiresQr: Boolean(row.requires_qr),
    requiresMaintenance: Boolean(row.requires_maintenance),
    requiresPrestart: Boolean(row.requires_prestart),
    requiresCalibration: Boolean(row.requires_calibration),
    tracksDowntime: Boolean(row.tracks_downtime),
    usesSpareParts: Boolean(row.uses_spare_parts),
  };
}

function fromRow(category: CatalogKey, row: any): MasterRecord {
  if (category === 'assets') {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      secondary: row.model ?? row.manufacturer ?? row.asset_types?.name ?? '-',
      specification: row.model ?? row.manufacturer ?? undefined,
      status: statusOf(row),
      location: row.locations?.name ?? undefined,
      nextDue: row.next_control_date ?? row.next_maintenance_date ?? undefined,
      groupId: row.asset_groups?.id ?? row.asset_group_id ?? undefined,
      group: row.asset_groups?.name ?? undefined,
      typeId: row.asset_types?.id ?? row.asset_type_id ?? undefined,
      type: row.asset_types?.name ?? undefined,
      parentCode: row.parent_asset?.code ?? undefined,
      flags: row.asset_types ? flagsOf(row.asset_types) : undefined,
    };
  }
  if (category === 'locations') {
    return { id: row.id, code: row.code, name: row.name, secondary: row.description ?? '-', specification: row.description ?? undefined, status: 'active', parentCode: row.parent_location?.code ?? undefined };
  }
  if (category === 'spareParts' || category === 'consumables') {
    return { id: row.id, code: row.code, name: row.name, secondary: row.specification ?? '-', specification: row.specification ?? undefined, status: statusOf(row), location: row.locations?.name ?? undefined, quantity: Number(row.quantity ?? 0), unit: row.unit ?? 'EA' };
  }
  if (category === 'suppliers') {
    return { id: row.id, code: row.code, name: row.name, secondary: row.service_type ?? '-', specification: row.service_type ?? undefined, status: statusOf(row), nextDue: row.next_evaluation_date ?? undefined };
  }
  if (category === 'customers') {
    return { id: row.id, code: row.code, name: row.name, secondary: row.customer_type ?? row.contact_person ?? '-', specification: row.customer_type ?? undefined, status: statusOf(row) };
  }
  if (category === 'meters') {
    return { id: row.id, code: row.code, name: row.name, secondary: row.meter_type ?? row.unit ?? '-', specification: row.meter_type ?? undefined, status: statusOf(row), currentValue: Number(row.current_value ?? 0), unit: row.unit ?? 'unit', linkedAssetCode: row.assets?.code ?? undefined };
  }
  if (category === 'teams') {
    return { id: row.id, code: row.code, name: row.name, secondary: row.description ?? '-', specification: row.description ?? undefined, status: statusOf(row) };
  }
  return {
    id: row.id,
    code: '',
    name: row.name,
    secondary: row.asset_groups?.name ?? '-',
    specification: row.description ?? undefined,
    status: row.active === false ? 'inactive' : 'active',
    groupId: row.asset_groups?.id ?? row.group_id,
    group: row.asset_groups?.name ?? undefined,
    flags: flagsOf(row),
  };
}

export async function listAssetGroups(): Promise<AssetGroupOption[]> {
  const { data, error } = await supabase.from('asset_groups').select('id,system_key,name').eq('active', true).order('sort_order').order('name');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id, systemKey: row.system_key, name: row.name }));
}

export async function listAssetTypes(groupId?: string): Promise<AssetTypeOption[]> {
  let query: any = supabase.from('asset_types').select('id,group_id,name,requires_qr,requires_maintenance,requires_prestart,requires_calibration,tracks_downtime,uses_spare_parts').eq('active', true).order('sort_order').order('name');
  if (groupId) query = query.eq('group_id', groupId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id, groupId: row.group_id, name: row.name, flags: flagsOf(row) }));
}

function selectFor(category: CatalogKey) {
  if (category === 'assets') return '*, locations(name), asset_groups(id,system_key,name), asset_types(id,name,requires_qr,requires_maintenance,requires_prestart,requires_calibration,tracks_downtime,uses_spare_parts), parent_asset:assets!parent_asset_id(code,name)';
  if (category === 'locations') return '*, parent_location:locations!parent_id(code,name)';
  if (category === 'spareParts' || category === 'consumables') return '*, locations(name)';
  if (category === 'meters') return '*, assets(code,name)';
  if (category === 'assetTypes') return '*, asset_groups(id,name)';
  return '*';
}

export async function listMasterRecords(category: CatalogKey): Promise<MasterRecord[]> {
  const orderColumn = category === 'assetTypes' ? 'name' : 'code';
  const { data, error } = await supabase.from(tableMap[category]).select(selectFor(category)).order(orderColumn);
  if (error) throw error;
  return (data ?? []).map((row: any) => fromRow(category, row));
}

export async function getMasterRecord(category: CatalogKey, id: string): Promise<MasterRecord> {
  const { data, error } = await supabase.from(tableMap[category]).select(selectFor(category)).eq('id', id).single();
  if (error) throw error;
  return fromRow(category, data);
}

async function resolveManagementCode(category: CatalogKey, id?: string, requestedCode?: string) {
  if (!hasAutomaticManagementCode(category)) return '';
  if (!id) return getNextManagementCode(category);
  if (requestedCode?.trim()) return requestedCode.trim();
  const { data, error } = await supabase.from(tableMap[category]).select('code').eq('id', id).single();
  if (error) throw error;
  if (!data?.code) throw new Error('Không tìm thấy mã quản lý hiện tại.');
  return data.code as string;
}

export async function saveMasterRecord(category: CatalogKey, draft: MasterDraft, id?: string): Promise<MasterRecord> {
  if (!draft.name.trim()) throw new Error('Tên là thông tin bắt buộc.');
  const table = tableMap[category];
  const code = await resolveManagementCode(category, id, draft.code);
  let payload: any;

  if (category === 'assets') {
    if (!draft.groupId) throw new Error('Phải chọn nhóm tài sản.');
    if (!draft.typeId) throw new Error('Phải chọn loại tài sản.');
    payload = {
      ...(code ? { code } : {}), name: draft.name.trim(), asset_type: 'asset', asset_group_id: draft.groupId, asset_type_id: draft.typeId,
      parent_asset_id: await assetIdFromCode(draft.parentCode), location_id: await ensureLocation(draft.location), model: draft.specification?.trim() || null,
      next_control_date: draft.nextDue || null, qr_code: code ? `ASSET:${code}` : null, status: 'active', updated_at: new Date().toISOString(),
    };
  } else if (category === 'locations') {
    payload = { code, name: draft.name.trim(), description: draft.specification?.trim() || null, parent_id: await locationIdFromCode(draft.parentCode), updated_at: new Date().toISOString() };
  } else if (category === 'spareParts' || category === 'consumables') {
    payload = { code, name: draft.name.trim(), specification: draft.specification?.trim() || null, location_id: await ensureLocation(draft.location), quantity: draft.quantity ?? 0, unit: draft.unit || 'EA', status: 'active', updated_at: new Date().toISOString() };
  } else if (category === 'suppliers') {
    payload = { code, name: draft.name.trim(), service_type: draft.specification?.trim() || null, next_evaluation_date: draft.nextDue || null, approved: true, status: 'active', updated_at: new Date().toISOString() };
  } else if (category === 'customers') {
    payload = { code, name: draft.name.trim(), customer_type: draft.specification?.trim() || null, status: 'active', updated_at: new Date().toISOString() };
  } else if (category === 'meters') {
    payload = { code, name: draft.name.trim(), meter_type: draft.meterType?.trim() || draft.specification?.trim() || null, unit: draft.unit || 'unit', current_value: draft.currentValue ?? 0, asset_id: await assetIdFromCode(draft.linkedAssetCode), status: 'active', updated_at: new Date().toISOString() };
  } else if (category === 'teams') {
    payload = { code, name: draft.name.trim(), description: draft.specification?.trim() || null, active: true, updated_at: new Date().toISOString() };
  } else {
    if (!draft.groupId) throw new Error('Phải chọn nhóm tài sản.');
    const flags = draft.flags ?? {};
    payload = {
      name: draft.name.trim(), description: draft.specification?.trim() || null, group_id: draft.groupId, active: true,
      requires_qr: Boolean(flags.requiresQr), requires_maintenance: Boolean(flags.requiresMaintenance), requires_prestart: Boolean(flags.requiresPrestart),
      requires_calibration: Boolean(flags.requiresCalibration), tracks_downtime: Boolean(flags.tracksDowntime), uses_spare_parts: Boolean(flags.usesSpareParts), updated_at: new Date().toISOString(),
    };
  }

  const request = id ? supabase.from(table).update(payload).eq('id', id) : supabase.from(table).insert(payload);
  const { data, error } = await request.select(selectFor(category)).single();
  if (error) throw error;
  return fromRow(category, data);
}

export async function deactivateMasterRecord(category: CatalogKey, id: string) {
  if (category === 'assetTypes' || category === 'teams') {
    const { error } = await supabase.from(tableMap[category]).update({ active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(tableMap[category]).update({ status: 'inactive', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
