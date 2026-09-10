import { supabase } from '../lib/supabase';
import type { AssetGroupOption } from './masterData';

export type AssetGroupDraft = {
  name: string;
  description?: string;
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
