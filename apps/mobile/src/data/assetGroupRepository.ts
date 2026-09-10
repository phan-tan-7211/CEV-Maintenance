import { supabase } from '../lib/supabase';
import type { AssetControlFlags, AssetGroupOption, AssetTypeOption } from './masterData';
import { getNextManagementCode } from './managementCodes';

export type AssetGroupDraft = {
  name: string;
  description?: string;
};

export type AssetTypeDraft = {
  groupId: string;
  name: string;
  description?: string;
  flags?: AssetControlFlags;
};

export type AssetGroupRecord = AssetGroupOption & {
  description?: string;
  sortOrder: number;
  active: boolean;
  typeCount: number;
  assetCount: number;
};

export type AssetTypeRecord = AssetTypeOption & {
  description?: string;
  sortOrder: number;
  active: boolean;
  assetCount: number;
};

export type AssetCatalogSnapshot = {
  groups: AssetGroupRecord[];
  types: AssetTypeRecord[];
};

export type DeleteGuardResult = {
  deleted: boolean;
  assetCount: number;
  typeCount?: number;
};

export type EquipmentDraft = {
  id?: string;
  code?: string;
  name: string;
  manufacturer?: string;
  model?: string;
  serial?: string;
  location?: string;
  groupId: string;
  typeId: string;
  parentCode?: string;
};

function toSystemKey(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || `group_${Date.now().toString(36)}`;
}

function mapFlags(row: any): AssetControlFlags {
  return {
    requiresQr: Boolean(row.requires_qr),
    requiresMaintenance: Boolean(row.requires_maintenance),
    requiresPrestart: Boolean(row.requires_prestart),
    requiresCalibration: Boolean(row.requires_calibration),
    tracksDowntime: Boolean(row.tracks_downtime),
    usesSpareParts: Boolean(row.uses_spare_parts),
  };
}

export async function listAssetCatalog(): Promise<AssetCatalogSnapshot> {
  const [groupsResult, typesResult, assetsResult] = await Promise.all([
    supabase.from('asset_groups').select('id,system_key,name,description,sort_order,active').order('sort_order').order('name'),
    supabase.from('asset_types').select('id,group_id,name,description,sort_order,active,requires_qr,requires_maintenance,requires_prestart,requires_calibration,tracks_downtime,uses_spare_parts').order('sort_order').order('name'),
    supabase.from('assets').select('asset_group_id,asset_type_id'),
  ]);

  if (groupsResult.error) throw groupsResult.error;
  if (typesResult.error) throw typesResult.error;
  if (assetsResult.error) throw assetsResult.error;

  const typeCounts = new Map<string, number>();
  for (const row of typesResult.data ?? []) typeCounts.set(row.group_id, (typeCounts.get(row.group_id) ?? 0) + 1);

  const groupAssetCounts = new Map<string, number>();
  const typeAssetCounts = new Map<string, number>();
  for (const row of assetsResult.data ?? []) {
    if (row.asset_group_id) groupAssetCounts.set(row.asset_group_id, (groupAssetCounts.get(row.asset_group_id) ?? 0) + 1);
    if (row.asset_type_id) typeAssetCounts.set(row.asset_type_id, (typeAssetCounts.get(row.asset_type_id) ?? 0) + 1);
  }

  return {
    groups: (groupsResult.data ?? []).map((row) => ({
      id: row.id,
      systemKey: row.system_key,
      name: row.name,
      description: row.description ?? undefined,
      sortOrder: Number(row.sort_order ?? 0),
      active: Boolean(row.active),
      typeCount: typeCounts.get(row.id) ?? 0,
      assetCount: groupAssetCounts.get(row.id) ?? 0,
    })),
    types: (typesResult.data ?? []).map((row) => ({
      id: row.id,
      groupId: row.group_id,
      name: row.name,
      description: row.description ?? undefined,
      sortOrder: Number(row.sort_order ?? 0),
      active: Boolean(row.active),
      assetCount: typeAssetCounts.get(row.id) ?? 0,
      flags: mapFlags(row),
    })),
  };
}

export async function createAssetGroup(draft: AssetGroupDraft): Promise<AssetGroupOption> {
  const name = draft.name.trim();
  if (!name) throw new Error('asset_group_name_required');

  const duplicate = await supabase.from('asset_groups').select('id').ilike('name', name).limit(1).maybeSingle();
  if (duplicate.error) throw duplicate.error;
  if (duplicate.data?.id) throw new Error('asset_group_duplicate');

  const orderResult = await supabase.from('asset_groups').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  if (orderResult.error) throw orderResult.error;

  let systemKey = toSystemKey(name);
  const keyResult = await supabase.from('asset_groups').select('id').eq('system_key', systemKey).limit(1).maybeSingle();
  if (keyResult.error) throw keyResult.error;
  if (keyResult.data?.id) systemKey = `${systemKey}_${Date.now().toString(36).slice(-5)}`;

  const { data, error } = await supabase.from('asset_groups').insert({
    system_key: systemKey,
    name,
    description: draft.description?.trim() || null,
    sort_order: Number(orderResult.data?.sort_order ?? 0) + 10,
    active: true,
    updated_at: new Date().toISOString(),
  }).select('id,system_key,name').single();

  if (error) throw error;
  return { id: data.id, systemKey: data.system_key, name: data.name };
}

export async function updateAssetGroup(id: string, draft: AssetGroupDraft) {
  const name = draft.name.trim();
  if (!name) throw new Error('asset_group_name_required');
  const duplicate = await supabase.from('asset_groups').select('id').ilike('name', name).neq('id', id).limit(1).maybeSingle();
  if (duplicate.error) throw duplicate.error;
  if (duplicate.data?.id) throw new Error('asset_group_duplicate');
  const result = await supabase.from('asset_groups').update({ name, description: draft.description?.trim() || null, updated_at: new Date().toISOString() }).eq('id', id);
  if (result.error) throw result.error;
}

export async function setAssetGroupActive(id: string, active: boolean) {
  const result = await supabase.from('asset_groups').update({ active, updated_at: new Date().toISOString() }).eq('id', id);
  if (result.error) throw result.error;
}

export async function reorderAssetGroups(orderedIds: string[]) {
  for (let index = 0; index < orderedIds.length; index += 1) {
    const result = await supabase.from('asset_groups').update({ sort_order: (index + 1) * 10, updated_at: new Date().toISOString() }).eq('id', orderedIds[index]);
    if (result.error) throw result.error;
  }
}

export async function deleteAssetGroup(id: string): Promise<DeleteGuardResult> {
  const [assets, types] = await Promise.all([
    supabase.from('assets').select('id', { count: 'exact', head: true }).eq('asset_group_id', id),
    supabase.from('asset_types').select('id', { count: 'exact', head: true }).eq('group_id', id),
  ]);
  if (assets.error) throw assets.error;
  if (types.error) throw types.error;
  const assetCount = assets.count ?? 0;
  const typeCount = types.count ?? 0;
  if (assetCount > 0 || typeCount > 0) return { deleted: false, assetCount, typeCount };
  const result = await supabase.from('asset_groups').delete().eq('id', id);
  if (result.error) throw result.error;
  return { deleted: true, assetCount: 0, typeCount: 0 };
}

export async function createAssetType(draft: AssetTypeDraft): Promise<AssetTypeOption> {
  const name = draft.name.trim();
  if (!draft.groupId) throw new Error('asset_type_group_required');
  if (!name) throw new Error('asset_type_name_required');

  const duplicate = await supabase.from('asset_types').select('id').eq('group_id', draft.groupId).ilike('name', name).limit(1).maybeSingle();
  if (duplicate.error) throw duplicate.error;
  if (duplicate.data?.id) throw new Error('asset_type_duplicate');

  const orderResult = await supabase.from('asset_types').select('sort_order').eq('group_id', draft.groupId).order('sort_order', { ascending: false }).limit(1).maybeSingle();
  if (orderResult.error) throw orderResult.error;

  const flags = draft.flags ?? {};
  const { data, error } = await supabase.from('asset_types').insert({
    group_id: draft.groupId,
    name,
    description: draft.description?.trim() || null,
    requires_qr: flags.requiresQr ?? true,
    requires_maintenance: Boolean(flags.requiresMaintenance),
    requires_prestart: Boolean(flags.requiresPrestart),
    requires_calibration: Boolean(flags.requiresCalibration),
    tracks_downtime: Boolean(flags.tracksDowntime),
    uses_spare_parts: Boolean(flags.usesSpareParts),
    sort_order: Number(orderResult.data?.sort_order ?? 0) + 10,
    active: true,
    updated_at: new Date().toISOString(),
  }).select('id,group_id,name,requires_qr,requires_maintenance,requires_prestart,requires_calibration,tracks_downtime,uses_spare_parts').single();

  if (error) throw error;
  return { id: data.id, groupId: data.group_id, name: data.name, flags: mapFlags(data) };
}

export async function updateAssetType(id: string, draft: AssetTypeDraft) {
  const name = draft.name.trim();
  if (!draft.groupId) throw new Error('asset_type_group_required');
  if (!name) throw new Error('asset_type_name_required');
  const duplicate = await supabase.from('asset_types').select('id').eq('group_id', draft.groupId).ilike('name', name).neq('id', id).limit(1).maybeSingle();
  if (duplicate.error) throw duplicate.error;
  if (duplicate.data?.id) throw new Error('asset_type_duplicate');
  const flags = draft.flags ?? {};
  const result = await supabase.from('asset_types').update({
    name,
    description: draft.description?.trim() || null,
    requires_qr: flags.requiresQr ?? true,
    requires_maintenance: Boolean(flags.requiresMaintenance),
    requires_prestart: Boolean(flags.requiresPrestart),
    requires_calibration: Boolean(flags.requiresCalibration),
    tracks_downtime: Boolean(flags.tracksDowntime),
    uses_spare_parts: Boolean(flags.usesSpareParts),
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (result.error) throw result.error;
}

export async function setAssetTypeActive(id: string, active: boolean) {
  const result = await supabase.from('asset_types').update({ active, updated_at: new Date().toISOString() }).eq('id', id);
  if (result.error) throw result.error;
}

export async function reorderAssetTypes(groupId: string, orderedIds: string[]) {
  for (let index = 0; index < orderedIds.length; index += 1) {
    const result = await supabase.from('asset_types').update({ sort_order: (index + 1) * 10, updated_at: new Date().toISOString() }).eq('group_id', groupId).eq('id', orderedIds[index]);
    if (result.error) throw result.error;
  }
}

export async function deleteAssetType(id: string): Promise<DeleteGuardResult> {
  const assets = await supabase.from('assets').select('id', { count: 'exact', head: true }).eq('asset_type_id', id);
  if (assets.error) throw assets.error;
  const assetCount = assets.count ?? 0;
  if (assetCount > 0) return { deleted: false, assetCount };
  const result = await supabase.from('asset_types').delete().eq('id', id);
  if (result.error) throw result.error;
  return { deleted: true, assetCount: 0 };
}

async function ensureLocation(name?: string) {
  const value = name?.trim();
  if (!value) return null;
  const existing = await supabase.from('locations').select('id').ilike('name', value).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id as string;
  const code = await getNextManagementCode('locations');
  const created = await supabase.from('locations').insert({ code, name: value, updated_at: new Date().toISOString() }).select('id').single();
  if (created.error) throw created.error;
  return created.data.id as string;
}

async function resolveParent(code?: string) {
  const value = code?.trim();
  if (!value) return null;
  const result = await supabase.from('assets').select('id').eq('code', value).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id) throw new Error('asset_parent_not_found');
  return result.data.id as string;
}

export async function saveEquipment(draft: EquipmentDraft): Promise<string> {
  const name = draft.name.trim();
  if (!name) throw new Error('equipment_name_required');
  if (!draft.groupId) throw new Error('asset_type_group_required');
  if (!draft.typeId) throw new Error('asset_type_required');

  const code = draft.id ? draft.code : await getNextManagementCode('assets');
  if (!code) throw new Error('equipment_code_unavailable');

  const payload = {
    code,
    name,
    asset_type: 'asset',
    asset_group_id: draft.groupId,
    asset_type_id: draft.typeId,
    manufacturer: draft.manufacturer?.trim() || null,
    model: draft.model?.trim() || null,
    serial_number: draft.serial?.trim() || null,
    location_id: await ensureLocation(draft.location),
    parent_asset_id: await resolveParent(draft.parentCode),
    qr_code: `ASSET:${code}`,
    status: 'active',
    updated_at: new Date().toISOString(),
  };

  if (draft.id) {
    const result = await supabase.from('assets').update(payload).eq('id', draft.id).select('id').single();
    if (result.error) throw result.error;
    return result.data.id as string;
  }

  const result = await supabase.from('assets').insert(payload).select('id').single();
  if (result.error) throw result.error;
  return result.data.id as string;
}
