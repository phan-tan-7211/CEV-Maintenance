import { supabase } from '../lib/supabase';
import type { CatalogKey } from './masterData';

export const managementCodeRules = {
  assets: { codeType: 'production_asset', prefix: 'TB', digits: 4, label: 'Thiết bị sản xuất' },
  utilities: { codeType: 'utility_asset', prefix: 'PTB', digits: 4, label: 'Thiết bị phụ trợ' },
  tooling: { codeType: 'tooling_jig', prefix: 'JIG', digits: 4, label: 'Jig / gá / khuôn' },
  measuring: { codeType: 'measuring_equipment', prefix: 'TBD', digits: 4, label: 'Thiết bị đo / kiểm tra' },
  spareParts: { codeType: 'spare_part', prefix: 'PT', digits: 4, label: 'Phụ tùng thay thế' },
  consumables: { codeType: 'maintenance_consumable', prefix: 'VT', digits: 4, label: 'Vật tư bảo trì' },
  safety: { codeType: 'safety_equipment', prefix: 'AT', digits: 4, label: 'Thiết bị an toàn' },
  suppliers: { codeType: 'service_supplier', prefix: 'NCC', digits: 4, label: 'Nhà cung cấp dịch vụ' },
} as const satisfies Record<CatalogKey, { codeType: string; prefix: string; digits: number; label: string }>;

export const reservedManagementCodeRules = {
  productionTool: { codeType: 'production_tool', prefix: 'DC', digits: 4, label: 'Dụng cụ sản xuất' },
  location: { codeType: 'location', prefix: 'KV', digits: 3, label: 'Khu vực / vị trí' },
} as const;

export function managementCodeExample(category: CatalogKey) {
  const rule = managementCodeRules[category];
  return `${rule.prefix}-${'0'.repeat(Math.max(0, rule.digits - 1))}1`;
}

async function requestNextCode(codeType: string) {
  const { data, error } = await supabase.rpc('next_management_code', { p_code_type: codeType });
  if (error) throw error;
  if (!data || typeof data !== 'string') throw new Error('Không thể cấp mã quản lý tự động.');
  return data;
}

export async function getNextManagementCode(category: CatalogKey) {
  return requestNextCode(managementCodeRules[category].codeType);
}

export async function getNextLocationCode() {
  return requestNextCode(reservedManagementCodeRules.location.codeType);
}
