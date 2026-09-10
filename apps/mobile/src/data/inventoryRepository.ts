import { supabase } from '../lib/supabase';
import { getNextManagementCode } from './managementCodes';

export type InventoryLocation = { id: string; code: string; name: string };
export type InventoryStockRow = { id: string; locationId: string; locationName: string; quantity: number; minQuantity: number; maxQuantity?: number };
export type InventoryPart = {
  id: string; code: string; name: string; specification?: string; unit: string; unitCost?: number; status: string; notes?: string;
  totalQuantity: number; totalMinQuantity: number; lowStock: boolean; outOfStock: boolean; stocks: InventoryStockRow[];
};

export async function listInventoryLocations(): Promise<InventoryLocation[]> {
  const { data, error } = await supabase.from('locations').select('id,code,name').eq('active', true).order('name');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id, code: row.code ?? '', name: row.name }));
}

export async function listInventoryParts(): Promise<InventoryPart[]> {
  const { data, error } = await supabase.from('spare_parts').select('id,code,name,specification,unit,unit_cost,status,notes,part_inventory(id,location_id,quantity,min_quantity,max_quantity,locations(name))').order('name');
  if (error) throw error;
  return (data ?? []).map((row: any) => {
    const stocks: InventoryStockRow[] = (row.part_inventory ?? []).map((stock: any) => ({
      id: stock.id, locationId: stock.location_id, locationName: stock.locations?.name ?? '-', quantity: Number(stock.quantity ?? 0),
      minQuantity: Number(stock.min_quantity ?? 0), maxQuantity: stock.max_quantity == null ? undefined : Number(stock.max_quantity),
    }));
    const totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const totalMinQuantity = stocks.reduce((sum, stock) => sum + stock.minQuantity, 0);
    return {
      id: row.id, code: row.code, name: row.name, specification: row.specification ?? undefined, unit: row.unit ?? 'EA',
      unitCost: row.unit_cost == null ? undefined : Number(row.unit_cost), status: row.status ?? 'active', notes: row.notes ?? undefined,
      totalQuantity, totalMinQuantity, lowStock: totalMinQuantity > 0 && totalQuantity <= totalMinQuantity, outOfStock: totalQuantity <= 0, stocks,
    };
  });
}

export async function createInventoryPart(input: { name: string; specification?: string; unit?: string; unitCost?: number; notes?: string; locationId?: string; quantity?: number; minQuantity?: number; maxQuantity?: number }) {
  const name = input.name.trim();
  if (!name) throw new Error('Tên phụ tùng là bắt buộc.');
  const code = await getNextManagementCode('spareParts');
  const { data, error } = await supabase.from('spare_parts').insert({
    code, name, specification: input.specification?.trim() || null, unit: input.unit?.trim() || 'EA', unit_cost: input.unitCost ?? null,
    notes: input.notes?.trim() || null, status: 'active',
  }).select('id').single();
  if (error) throw error;
  if (input.locationId && Number(input.quantity ?? 0) !== 0) {
    await adjustInventoryStock({ partId: data.id, locationId: input.locationId, delta: Number(input.quantity ?? 0), minQuantity: input.minQuantity, maxQuantity: input.maxQuantity, reference: 'initial_stock' });
  } else if (input.locationId) {
    const { error: stockError } = await supabase.from('part_inventory').insert({ part_id: data.id, location_id: input.locationId, quantity: 0, min_quantity: input.minQuantity ?? 0, max_quantity: input.maxQuantity ?? null });
    if (stockError) throw stockError;
  }
  return data.id as string;
}

export async function adjustInventoryStock(input: { partId: string; locationId: string; delta: number; minQuantity?: number; maxQuantity?: number; reference?: string }) {
  if (!input.locationId) throw new Error('Phải chọn vị trí kho.');
  if (!Number.isFinite(input.delta) || input.delta === 0) throw new Error('Số lượng điều chỉnh phải khác 0.');
  const { error } = await supabase.rpc('adjust_part_stock', {
    p_part_id: input.partId,
    p_location_id: input.locationId,
    p_delta: input.delta,
    p_min_quantity: input.minQuantity ?? null,
    p_max_quantity: input.maxQuantity ?? null,
    p_reference: input.reference ?? null,
  });
  if (error) throw error;
}

export async function listCompatibleAssets(partId: string): Promise<{ id: string; code: string; name: string; critical: boolean; preferredQuantity?: number }[]> {
  const { data, error } = await supabase.from('asset_parts').select('critical,preferred_quantity,assets(id,code,name)').eq('part_id', partId);
  if (error) throw error;
  return (data ?? []).filter((row: any) => row.assets).map((row: any) => ({ id: row.assets.id, code: row.assets.code, name: row.assets.name, critical: Boolean(row.critical), preferredQuantity: row.preferred_quantity == null ? undefined : Number(row.preferred_quantity) }));
}
