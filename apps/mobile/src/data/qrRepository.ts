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

export async function resolveQr(raw: string): Promise<QrResolution> {
  const parsed = parse(raw);
  if (!parsed.normalized) return { raw, normalized: '', notFound: true };
  await rememberScan(parsed.normalized);

  const asset = await supabase.from('assets').select('id,code,name,status').or(`code.eq.${parsed.code},id.eq.${parsed.code}`).maybeSingle();
  if (!asset.error && asset.data) {
    await enqueueBusinessEvent('asset.scan', { asset_id: asset.data.id, code: asset.data.code });
    return { raw, normalized: parsed.normalized, legacyType: parsed.legacyType, target: { kind: 'asset', id: asset.data.id, code: asset.data.code, name: asset.data.name, status: asset.data.status ?? undefined } };
  }

  const workOrder = await supabase.from('work_orders').select('id,code,title,status,asset_id').or(`code.eq.${parsed.code},id.eq.${parsed.code}`).maybeSingle();
  if (!workOrder.error && workOrder.data) return { raw, normalized: parsed.normalized, legacyType: parsed.legacyType, target: { kind: 'work_order', id: workOrder.data.id, code: workOrder.data.code, title: workOrder.data.title, status: workOrder.data.status, assetId: workOrder.data.asset_id ?? undefined } };

  const part = await supabase.from('spare_parts').select('id,code,name,status').or(`code.eq.${parsed.code},id.eq.${parsed.code}`).maybeSingle();
  if (!part.error && part.data) return { raw, normalized: parsed.normalized, legacyType: parsed.legacyType, target: { kind: 'part', id: part.data.id, code: part.data.code, name: part.data.name, status: part.data.status ?? undefined } };

  return { raw, normalized: parsed.normalized, legacyType: parsed.legacyType, notFound: true };
}

export function suggestedAssetActions(role: string | undefined, status: string | undefined) {
  const actions: Array<'view' | 'report_issue' | 'create_work_order'> = ['view'];
  if (status !== 'retired') actions.push('report_issue');
  if (role !== 'requestor' && role !== 'viewer' && status !== 'retired') actions.push('create_work_order');
  return actions;
}
