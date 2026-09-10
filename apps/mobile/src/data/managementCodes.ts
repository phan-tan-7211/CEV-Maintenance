import { supabase } from '../lib/supabase';
import type { CatalogKey } from './masterData';

type Rule = { codeType: string; prefix: string; digits: number; label: string };

export const managementCodeRules: Partial<Record<CatalogKey, Rule>> = {
  assets: { codeType: 'asset', prefix: 'TS', digits: 4, label: 'Tài sản' },
  locations: { codeType: 'location', prefix: 'KV', digits: 3, label: 'Vị trí' },
  spareParts: { codeType: 'spare_part', prefix: 'PT', digits: 4, label: 'Phụ tùng' },
  suppliers: { codeType: 'supplier', prefix: 'NCC', digits: 4, label: 'Nhà cung cấp' },
  customers: { codeType: 'customer', prefix: 'KH', digits: 4, label: 'Khách hàng' },
  meters: { codeType: 'meter', prefix: 'DH', digits: 4, label: 'Đồng hồ theo dõi' },
  teams: { codeType: 'team', prefix: 'NH', digits: 3, label: 'Nhóm' },
};

export function hasAutomaticManagementCode(category: CatalogKey) {
  return Boolean(managementCodeRules[category]);
}

export function managementCodeExample(category: CatalogKey) {
  const rule = managementCodeRules[category];
  if (!rule) return '';
  return `${rule.prefix}-${'0'.repeat(Math.max(0, rule.digits - 1))}1`;
}

async function requestNextCode(codeType: string) {
  const { data, error } = await supabase.rpc('next_management_code', { p_code_type: codeType });
  if (error) throw error;
  if (!data || typeof data !== 'string') throw new Error('Không thể cấp mã quản lý tự động.');
  return data;
}

export async function getNextManagementCode(category: CatalogKey) {
  const rule = managementCodeRules[category];
  if (!rule) throw new Error('Danh mục này không sử dụng mã quản lý tự động.');
  return requestNextCode(rule.codeType);
}
