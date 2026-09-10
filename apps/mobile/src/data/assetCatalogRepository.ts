import type { AssetControlFlags } from './masterData';
import {
  createAssetGroup,
  createAssetType,
  deleteAssetGroup,
  deleteAssetType,
  listAssetCatalog,
  reorderAssetGroups,
  reorderAssetTypes as reorderAssetTypesInGroup,
  setAssetGroupActive,
  setAssetTypeActive,
  updateAssetGroup,
  updateAssetType,
  type AssetGroupDraft,
  type AssetGroupRecord,
  type AssetTypeDraft,
  type AssetTypeRecord,
} from './assetGroupRepository';

export type AssetGroupAdminRecord = AssetGroupRecord & { description: string };
export type AssetTypeAdminRecord = AssetTypeRecord & { description: string; flags: AssetControlFlags };

export { createAssetGroup, createAssetType, reorderAssetGroups, setAssetGroupActive, setAssetTypeActive, updateAssetGroup, updateAssetType };
export type { AssetGroupDraft, AssetTypeDraft };

export async function listAssetGroupsAdmin(search = ''): Promise<AssetGroupAdminRecord[]> {
  const snapshot = await listAssetCatalog();
  const needle = search.trim().toLocaleLowerCase();
  return snapshot.groups
    .filter((row) => !needle || `${row.name} ${row.description ?? ''}`.toLocaleLowerCase().includes(needle))
    .map((row) => ({ ...row, description: row.description ?? '' }));
}

export async function listAssetTypesAdmin(groupId: string, search = ''): Promise<AssetTypeAdminRecord[]> {
  const snapshot = await listAssetCatalog();
  const needle = search.trim().toLocaleLowerCase();
  return snapshot.types
    .filter((row) => row.groupId === groupId)
    .filter((row) => !needle || `${row.name} ${row.description ?? ''}`.toLocaleLowerCase().includes(needle))
    .map((row) => ({ ...row, description: row.description ?? '' }));
}

export async function reorderAssetTypes(orderedIds: string[]) {
  if (!orderedIds.length) return;
  const snapshot = await listAssetCatalog();
  const groupId = snapshot.types.find((row) => row.id === orderedIds[0])?.groupId;
  if (!groupId) return;
  await reorderAssetTypesInGroup(groupId, orderedIds);
}

export async function deleteAssetGroupSafely(id: string) {
  const result = await deleteAssetGroup(id);
  return { deleted: result.deleted, references: result.assetCount + (result.typeCount ?? 0) };
}

export async function deleteAssetTypeSafely(id: string) {
  const result = await deleteAssetType(id);
  return { deleted: result.deleted, references: result.assetCount };
}
