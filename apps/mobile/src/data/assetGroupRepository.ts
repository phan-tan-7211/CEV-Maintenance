import { supabase } from '../lib/supabase';
import type { AssetControlFlags, AssetGroupOption, AssetTypeOption } from './masterData';

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

export async function createAssetGroup(draft: AssetGroupDraft): Promise<AssetGroupOption> {
  const name = draft.name.trim();
  if (!name) throw new Error('Tên nhóm là thông tin bắt buộc.');

  const duplicate = await supabase
    .from('asset_groups')
    .select('id,name')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (duplicate.error) throw duplicate.error;
  if (duplicate.data?.id) throw new Error(`Nhóm "${duplicate.data.name}" đã tồn tại.`);

  const orderResult = await supabase
    .from('asset_groups')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderResult.error) throw orderResult.error;

  let systemKey = toSystemKey(name);
  const keyResult = await supabase.from('asset_groups').select('id').eq('system_key', systemKey).limit(1).maybeSingle();
  if (keyResult.error) throw keyResult.error;
  if (keyResult.data?.id) systemKey = `${systemKey}_${Date.now().toString(36).slice(-5)}`;

  const { data, error } = await supabase
    .from('asset_groups')
    .insert({
      system_key: systemKey,
      name,
      description: draft.description?.trim() || null,
      sort_order: Number(orderResult.data?.sort_order ?? 0) + 10,
      active: true,
      updated_at: new Date().toISOString(),
    })
    .select('id,system_key,name')
    .single();

  if (error) throw error;
  return { id: data.id, systemKey: data.system_key, name: data.name };
}

export async function createAssetType(draft: AssetTypeDraft): Promise<AssetTypeOption> {
  const name = draft.name.trim();
  if (!draft.groupId) throw new Error('Phải chọn nhóm tài sản.');
  if (!name) throw new Error('Tên loại là thông tin bắt buộc.');

  const duplicate = await supabase
    .from('asset_types')
    .select('id,name')
    .eq('group_id', draft.groupId)
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (duplicate.error) throw duplicate.error;
  if (duplicate.data?.id) throw new Error(`Loại "${duplicate.data.name}" đã tồn tại trong nhóm này.`);

  const orderResult = await supabase
    .from('asset_types')
    .select('sort_order')
    .eq('group_id', draft.groupId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderResult.error) throw orderResult.error;

  const flags = draft.flags ?? {};
  const { data, error } = await supabase
    .from('asset_types')
    .insert({
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
    })
    .select('id,group_id,name,requires_qr,requires_maintenance,requires_prestart,requires_calibration,tracks_downtime,uses_spare_parts')
    .single();

  if (error) throw error;
  return {
    id: data.id,
    groupId: data.group_id,
    name: data.name,
    flags: {
      requiresQr: Boolean(data.requires_qr),
      requiresMaintenance: Boolean(data.requires_maintenance),
      requiresPrestart: Boolean(data.requires_prestart),
      requiresCalibration: Boolean(data.requires_calibration),
      tracksDowntime: Boolean(data.tracks_downtime),
      usesSpareParts: Boolean(data.uses_spare_parts),
    },
  };
}
