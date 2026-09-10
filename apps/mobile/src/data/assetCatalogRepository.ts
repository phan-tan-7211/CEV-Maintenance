import { supabase } from '../lib/supabase';
import type { AssetControlFlags } from './masterData';
import { createAssetGroup, createAssetType, type AssetGroupDraft, type AssetTypeDraft } from './assetGroupRepository';

export type AssetGroupAdminRecord = { id:string; systemKey:string; name:string; description:string; sortOrder:number; active:boolean; typeCount:number; assetCount:number };
export type AssetTypeAdminRecord = { id:string; groupId:string; name:string; description:string; sortOrder:number; active:boolean; assetCount:number; flags:AssetControlFlags };
const flagsFromRow=(r:any):AssetControlFlags=>({requiresQr:Boolean(r.requires_qr),requiresMaintenance:Boolean(r.requires_maintenance),requiresPrestart:Boolean(r.requires_prestart),requiresCalibration:Boolean(r.requires_calibration),tracksDowntime:Boolean(r.tracks_downtime),usesSpareParts:Boolean(r.uses_spare_parts)});
export { createAssetGroup, createAssetType };

export async function listAssetGroupsAdmin(search=''):Promise<AssetGroupAdminRecord[]> {
  let q:any=supabase.from('asset_groups').select('id,system_key,name,description,sort_order,active').order('sort_order').order('name');
  if(search.trim()) q=q.ilike('name',`%${search.trim()}%`);
  const {data,error}=await q; if(error) throw error;
  return Promise.all((data??[]).map(async(r:any)=>{
    const [t,a]=await Promise.all([
      supabase.from('asset_types').select('id',{count:'exact',head:true}).eq('group_id',r.id),
      supabase.from('assets').select('id',{count:'exact',head:true}).eq('asset_group_id',r.id),
    ]);
    if(t.error) throw t.error; if(a.error) throw a.error;
    return {id:r.id,systemKey:r.system_key,name:r.name,description:r.description??'',sortOrder:r.sort_order??0,active:Boolean(r.active),typeCount:t.count??0,assetCount:a.count??0};
  }));
}

export async function listAssetTypesAdmin(groupId:string,search=''):Promise<AssetTypeAdminRecord[]> {
  let q:any=supabase.from('asset_types').select('id,group_id,name,description,sort_order,active,requires_qr,requires_maintenance,requires_prestart,requires_calibration,tracks_downtime,uses_spare_parts').eq('group_id',groupId).order('sort_order').order('name');
  if(search.trim()) q=q.ilike('name',`%${search.trim()}%`);
  const {data,error}=await q; if(error) throw error;
  return Promise.all((data??[]).map(async(r:any)=>{
    const a=await supabase.from('assets').select('id',{count:'exact',head:true}).eq('asset_type_id',r.id); if(a.error) throw a.error;
    return {id:r.id,groupId:r.group_id,name:r.name,description:r.description??'',sortOrder:r.sort_order??0,active:Boolean(r.active),assetCount:a.count??0,flags:flagsFromRow(r)};
  }));
}

export async function updateAssetGroup(id:string,draft:AssetGroupDraft&{active?:boolean}) {
  const name=draft.name.trim(); if(!name) throw new Error('Group name is required.');
  const {error}=await supabase.from('asset_groups').update({name,description:draft.description?.trim()||null,...(draft.active===undefined?{}:{active:draft.active}),updated_at:new Date().toISOString()}).eq('id',id); if(error) throw error;
}
export async function updateAssetType(id:string,draft:AssetTypeDraft&{active?:boolean}) {
  const f=draft.flags??{};
  const {error}=await supabase.from('asset_types').update({group_id:draft.groupId,name:draft.name.trim(),description:draft.description?.trim()||null,requires_qr:f.requiresQr??true,requires_maintenance:Boolean(f.requiresMaintenance),requires_prestart:Boolean(f.requiresPrestart),requires_calibration:Boolean(f.requiresCalibration),tracks_downtime:Boolean(f.tracksDowntime),uses_spare_parts:Boolean(f.usesSpareParts),...(draft.active===undefined?{}:{active:draft.active}),updated_at:new Date().toISOString()}).eq('id',id); if(error) throw error;
}
export async function setAssetGroupActive(id:string,active:boolean){const {error}=await supabase.from('asset_groups').update({active,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;}
export async function setAssetTypeActive(id:string,active:boolean){const {error}=await supabase.from('asset_types').update({active,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;}
async function applyOrder(table:'asset_groups'|'asset_types',ids:string[]){for(let i=0;i<ids.length;i+=1){const {error}=await supabase.from(table).update({sort_order:(i+1)*10,updated_at:new Date().toISOString()}).eq('id',ids[i]);if(error)throw error;}}
export const reorderAssetGroups=(ids:string[])=>applyOrder('asset_groups',ids);
export const reorderAssetTypes=(ids:string[])=>applyOrder('asset_types',ids);
export async function deleteAssetGroupSafely(id:string){const[t,a]=await Promise.all([supabase.from('asset_types').select('id',{count:'exact',head:true}).eq('group_id',id),supabase.from('assets').select('id',{count:'exact',head:true}).eq('asset_group_id',id)]);if(t.error)throw t.error;if(a.error)throw a.error;const references=(t.count??0)+(a.count??0);if(references)return{deleted:false,references};const{error}=await supabase.from('asset_groups').delete().eq('id',id);if(error)throw error;return{deleted:true,references:0};}
export async function deleteAssetTypeSafely(id:string){const a=await supabase.from('assets').select('id',{count:'exact',head:true}).eq('asset_type_id',id);if(a.error)throw a.error;const references=a.count??0;if(references)return{deleted:false,references};const{error}=await supabase.from('asset_types').delete().eq('id',id);if(error)throw error;return{deleted:true,references:0};}
