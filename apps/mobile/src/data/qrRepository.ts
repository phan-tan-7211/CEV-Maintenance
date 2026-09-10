import { supabase } from '../lib/supabase';
import { rememberScan } from '../offline/store';
import { enqueueBusinessEvent } from '../offline/queue';

export type QrTarget =
  | { kind: 'asset'; id: string; code: string; name: string; status?: string }
  | { kind: 'work_order'; id: string; code: string; title: string; status: string; assetId?: string }
  | { kind: 'part'; id: string; code: string; name: string; status?: string };

export type QrResolution = { raw: string; normalized: string; target?: QrTarget; legacyType?: 'ASSET' | 'TOOL' | 'MEASURE'; notFound?: boolean };

function parse(raw: string) {
  const normalized = raw.trim();
  const legacy = normalized.match(/^(ASSET|TOOL|MEASURE):(.+)$/i);
  return { normalized, legacyType: legacy?.[1].toUpperCase() as QrResolution['legacyType'], code: (legacy?.[2] ?? normalized).trim() };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function findAsset(value: string) {
  const byCode = await supabase.from('assets').select('id,code,name,status').eq('code', value).maybeSingle();
  if (!byCode.error && byCode.data) return byCode.data;
  if (!isUuid(value)) return null;
  const byId = await supabase.from('assets').select('id,code,name,status').eq('id', value).maybeSingle();
  return byId.error ? null : byId.data;
}

async function findWorkOrder(value: string) {
  const byCode = await supabase.from('work_orders').select('id,code,title,status,asset_id').eq('code', value).maybeSingle();
  if (!byCode.error && byCode.data) return byCode.data;
  if (!isUuid(value)) return null;
  const byId = await supabase.from('work_orders').select('id,code,title,status,asset_id').eq('id', value).maybeSingle();
  return byId.error ? null : byId.data;
}

async function findPart(value: string) {
  const byCode = await supabase.from('spare_parts').select('id,code,name,status').eq('code', value).maybeSingle();
  if (!byCode.error && byCode.data) return byCode.data;
  if (!isUuid(value)) return null;
  const byId = await supabase.from('spare_parts').select('id,code,name,status').eq('id', value).maybeSingle();
  return byId.error ? null : byId.data;
}

export async function resolveQr(raw: string): Promise<QrResolution> {
  const parsed = parse(raw);
  if (!parsed.normalized) return { raw, normalized: '', notFound: true };
  await rememberScan(parsed.normalized);

  const asset = await findAsset(parsed.code);
  if (asset) {
    await enqueueBusinessEvent('asset.scan', { asset_id: asset.id, code: asset.code });
    return { raw, normalized: parsed.normalized, legacyType: parsed.legacyType, target: { kind: 'asset', id: asset.id, code: asset.code, name: asset.name, status: asset.status ?? undefined } };
  }

  const workOrder = await findWorkOrder(parsed.code);
  if (workOrder) return { raw, normalized: parsed.normalized, legacyType: parsed.legacyType, target: { kind: 'work_order', id: workOrder.id, code: workOrder.code, title: workOrder.title, status: workOrder.status, assetId: workOrder.asset_id ?? undefined } };

  const part = await findPart(parsed.code);
  if (part) return { raw, normalized: parsed.normalized, legacyType: parsed.legacyType, target: { kind: 'part', id: part.id, code: part.code, name: part.name, status: part.status ?? undefined } };

  return { raw, normalized: parsed.normalized, legacyType: parsed.legacyType, notFound: true };
}

export function suggestedAssetActions(role: string | undefined, status: string | undefined) {
  const actions: Array<'view' | 'report_issue' | 'create_work_order'> = ['view'];
  if (status !== 'retired') actions.push('report_issue');
  if (role !== 'requestor' && role !== 'viewer' && status !== 'retired') actions.push('create_work_order');
  return actions;
}
