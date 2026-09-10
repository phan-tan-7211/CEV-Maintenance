export type CatalogKey =
  | 'assets'
  | 'locations'
  | 'spareParts'
  | 'consumables'
  | 'suppliers'
  | 'customers'
  | 'meters'
  | 'teams'
  | 'assetTypes';

export type CatalogHubKey = 'inventory' | 'people' | 'partners';

export type AssetControlFlags = {
  requiresQr?: boolean;
  requiresMaintenance?: boolean;
  requiresPrestart?: boolean;
  requiresCalibration?: boolean;
  tracksDowntime?: boolean;
  usesSpareParts?: boolean;
};

export type MasterRecord = {
  id: string;
  code: string;
  name: string;
  secondary: string;
  specification?: string;
  status: 'active' | 'warning' | 'inactive' | 'retired';
  location?: string;
  nextDue?: string;
  quantity?: number;
  unit?: string;
  currentValue?: number;
  groupId?: string;
  group?: string;
  typeId?: string;
  type?: string;
  parentCode?: string;
  linkedAssetCode?: string;
  flags?: AssetControlFlags;
};

export type AssetGroupOption = {
  id: string;
  systemKey: string;
  name: string;
};

export type AssetTypeOption = {
  id: string;
  groupId: string;
  name: string;
  flags: AssetControlFlags;
};