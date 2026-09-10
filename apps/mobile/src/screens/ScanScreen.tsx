import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { listRecentScans } from '../offline/store';
import { pendingEvents } from '../offline/queue';
import { resolveQr, suggestedAssetActions, type QrResolution } from '../data/qrRepository';
import { scanUi, type ScanLocale } from '../i18n/scanUi';
import { SyncStatusBadge } from '../components/SyncStatusBadge';

export type ScanScreenProps = {
  locale?: ScanLocale;
  role?: string;
  onOpenTarget?: (target: NonNullable<QrResolution['target']>) => void;
  onReportIssue?: (assetId: string) => void;
  onCreateWorkOrder?: (assetId: string) => void;
};

export function ScanScreen({ locale = 'vi', role, onOpenTarget, onReportIssue, onCreateWorkOrder }: ScanScreenProps) {
  const t = scanUi[locale];
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<QrResolution>();
  const [recent, setRecent] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'failed'>('synced');

  const refreshLocal = async () => {
    setRecent(await listRecentScans());
    const queued = await pendingEvents();
    setSyncStatus(queued.some((e) => e.status === 'failed') ? 'failed' : queued.length ? 'pending' : 'synced');
  };
  useEffect(() => { void refreshLocal(); }, []);

  const submit = async (raw: string) => {
    if (!raw.trim() || busy) return;
    setBusy(true);
    try { setResult(await resolveQr(raw)); } catch { setResult({ raw, normalized: raw.trim(), notFound: true }); }
    finally { setBusy(false); setLocked(true); await refreshLocal(); }
  };

  const target = result?.target;
  const actions = target?.kind === 'asset' ? suggestedAssetActions(role, target.status) : ['view'] as const;

  return <ScrollView contentContainerStyle={{ padding:16, gap:14 }}>
    <Text style={{ fontSize:24, fontWeight:'700' }}>{t.title}</Text>
    <SyncStatusBadge status={syncStatus} locale={locale} />
    {!permission?.granted ? <Pressable onPress={() => void requestPermission()} style={{ padding:16, borderWidth:1, borderRadius:12 }}><Text>{t.scanHint}</Text></Pressable> :
      <View style={{ height:280, overflow:'hidden', borderRadius:16 }}><CameraView style={{ flex:1 }} barcodeScannerSettings={{ barcodeTypes:['qr'] }} onBarcodeScanned={locked ? undefined : ({ data }) => void submit(data)} /></View>}
    <Text style={{ textAlign:'center' }}>{t.scanHint}</Text>
    <View style={{ flexDirection:'row', gap:8 }}><TextInput value={manual} onChangeText={setManual} placeholder={t.manual} autoCapitalize="characters" style={{ flex:1, borderWidth:1, borderColor:'#d1d5db', borderRadius:10, paddingHorizontal:12, paddingVertical:10 }} /><Pressable onPress={() => void submit(manual)} style={{ padding:12, borderWidth:1, borderRadius:10 }}><Text>{t.open}</Text></Pressable></View>
    {result?.notFound && <View style={{ gap:8 }}><Text>{t.notFound}</Text><Pressable onPress={() => { setLocked(false); setResult(undefined); }}><Text>{t.retry}</Text></Pressable></View>}
    {target && <View style={{ padding:14, borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, gap:8 }}><Text style={{ fontWeight:'700' }}>{target.kind === 'work_order' ? target.title : target.name}</Text><Text>{target.code}</Text><View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>{actions.includes('view') && <Pressable onPress={() => onOpenTarget?.(target)}><Text>{t.open}</Text></Pressable>}{target.kind === 'asset' && actions.includes('report_issue') && <Pressable onPress={() => onReportIssue?.(target.id)}><Text>{t.issue}</Text></Pressable>}{target.kind === 'asset' && actions.includes('create_work_order') && <Pressable onPress={() => onCreateWorkOrder?.(target.id)}><Text>{t.createWo}</Text></Pressable>}</View></View>}
    {recent.length > 0 && <View style={{ gap:8 }}><Text style={{ fontWeight:'700' }}>{t.recent}</Text>{recent.map((code) => <Pressable key={code} onPress={() => { setLocked(false); void submit(code); }}><Text>{code}</Text></Pressable>)}</View>}
  </ScrollView>;
}
