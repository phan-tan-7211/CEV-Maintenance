import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { listRecentScans } from '../offline/store';
import { pendingEvents } from '../offline/queue';
import { resolveQr, suggestedAssetActions, type QrResolution } from '../data/qrRepository';
import { scanUi, type ScanLocale } from '../i18n/scanUi';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import type { OfflineEvent } from '../offline/types';
import { colors } from '../theme/colors';

type AssetAction = 'view' | 'report_issue' | 'create_work_order';

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
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<QrResolution>();
  const [recent, setRecent] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'failed'>('synced');

  const refreshLocal = async () => {
    setRecent(await listRecentScans());
    const queued = await pendingEvents();
    setSyncStatus(queued.some((e: OfflineEvent) => e.status === 'failed') ? 'failed' : queued.length ? 'pending' : 'synced');
  };

  useEffect(() => { void refreshLocal(); }, []);

  const submit = async (raw: string) => {
    if (!raw.trim() || busy) return;
    setBusy(true);
    setImageError('');
    try {
      setResult(await resolveQr(raw));
    } catch {
      setResult({ raw, normalized: raw.trim(), notFound: true });
    } finally {
      setBusy(false);
      setLocked(true);
      await refreshLocal();
    }
  };

  const chooseQrImage = async () => {
    if (imageBusy || busy) return;
    setImageError('');
    setImageBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (picked.canceled) return;
      const uri = picked.assets[0]?.uri;
      if (!uri) {
        setImageError(t.imageReadError);
        return;
      }
      const codes = await Camera.scanFromURLAsync(uri, ['qr']);
      const decoded = codes.find((item) => item.data?.trim());
      if (!decoded?.data) {
        setImageError(t.imageNoQr);
        setResult(undefined);
        setLocked(false);
        return;
      }
      setLocked(true);
      await submit(decoded.data);
    } catch {
      setImageError(t.imageReadError);
      setResult(undefined);
      setLocked(false);
    } finally {
      setImageBusy(false);
    }
  };

  const resetScan = () => {
    setLocked(false);
    setResult(undefined);
    setImageError('');
  };

  const target = result?.target;
  const actions: readonly AssetAction[] = target?.kind === 'asset' ? suggestedAssetActions(role, target.status) : ['view'];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      <SyncStatusBadge status={syncStatus} locale={locale} />

      <View style={styles.card}>
        {!permission?.granted ? (
          <Pressable onPress={() => void requestPermission()} style={styles.permissionButton}>
            <Ionicons name="camera-outline" size={22} color={colors.primary} />
            <Text style={styles.permissionText}>{t.cameraPermission}</Text>
          </Pressable>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={locked ? undefined : ({ data }) => void submit(data)}
            />
            <View pointerEvents="none" style={styles.scanFrame} />
          </View>
        )}
        <Text style={styles.hint}>{t.scanHint}</Text>

        <Pressable onPress={() => void chooseQrImage()} disabled={imageBusy || busy} style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed, (imageBusy || busy) && styles.disabled]}>
          {imageBusy ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="image-outline" size={20} color={colors.primary} />}
          <View style={styles.uploadTextWrap}>
            <Text style={styles.uploadTitle}>{imageBusy ? t.uploading : t.upload}</Text>
            <Text style={styles.uploadHint}>{t.uploadHint}</Text>
          </View>
        </Pressable>

        {imageError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{imageError}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.manualRow}>
        <TextInput
          value={manual}
          onChangeText={setManual}
          placeholder={t.manual}
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          style={styles.manualInput}
          onSubmitEditing={() => void submit(manual)}
        />
        <Pressable onPress={() => void submit(manual)} disabled={busy} style={({ pressed }) => [styles.openButton, pressed && styles.pressed, busy && styles.disabled]}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.openButtonText}>{t.open}</Text>}
        </Pressable>
      </View>

      {result?.notFound ? (
        <View style={styles.errorBox}>
          <Ionicons name="search-outline" size={18} color={colors.danger} />
          <Text style={[styles.errorText, { flex: 1 }]}>{t.notFound}</Text>
          <Pressable onPress={resetScan}><Text style={styles.linkText}>{t.retry}</Text></Pressable>
        </View>
      ) : null}

      {target ? (
        <View style={styles.resultCard}>
          <View style={styles.resultIcon}><Ionicons name={target.kind === 'asset' ? 'cube-outline' : target.kind === 'work_order' ? 'clipboard-outline' : 'construct-outline'} size={22} color={colors.primary} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.resultTitle}>{target.kind === 'work_order' ? target.title : target.name}</Text>
            <Text style={styles.resultCode}>{target.code}</Text>
            <View style={styles.actions}>
              {actions.includes('view') && <Pressable onPress={() => onOpenTarget?.(target)}><Text style={styles.linkText}>{t.open}</Text></Pressable>}
              {target.kind === 'asset' && actions.includes('report_issue') && <Pressable onPress={() => onReportIssue?.(target.id)}><Text style={styles.linkText}>{t.issue}</Text></Pressable>}
              {target.kind === 'asset' && actions.includes('create_work_order') && <Pressable onPress={() => onCreateWorkOrder?.(target.id)}><Text style={styles.linkText}>{t.createWo}</Text></Pressable>}
              <Pressable onPress={resetScan}><Text style={styles.linkText}>{t.retry}</Text></Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.recentCard}>
          <Text style={styles.recentTitle}>{t.recent}</Text>
          {recent.map((code) => (
            <Pressable key={code} onPress={() => { setLocked(false); void submit(code); }} style={styles.recentRow}>
              <Ionicons name="time-outline" size={17} color={colors.muted} />
              <Text style={styles.recentCode}>{code}</Text>
              <Ionicons name="chevron-forward" size={17} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 110, gap: 14 },
  header: { gap: 5 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, lineHeight: 19, color: colors.muted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, gap: 12 },
  permissionButton: { minHeight: 220, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 20 },
  permissionText: { color: colors.primary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  cameraWrap: { height: 280, overflow: 'hidden', borderRadius: 14, backgroundColor: '#000' },
  camera: { flex: 1 },
  scanFrame: { position: 'absolute', width: 180, height: 180, borderRadius: 18, borderWidth: 2, borderColor: '#fff', alignSelf: 'center', top: 50 },
  hint: { textAlign: 'center', fontSize: 12, color: colors.muted },
  uploadButton: { minHeight: 62, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background },
  uploadTextWrap: { flex: 1 },
  uploadTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  uploadHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  manualRow: { flexDirection: 'row', gap: 8 },
  manualInput: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 11, paddingHorizontal: 12, color: colors.text },
  openButton: { minWidth: 70, minHeight: 44, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  openButtonText: { color: '#fff', fontWeight: '800' },
  errorBox: { borderRadius: 11, padding: 11, backgroundColor: '#FEF2F2', flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 17 },
  resultCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13, flexDirection: 'row', gap: 10 },
  resultIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  resultCode: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 7 },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  recentCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' },
  recentTitle: { paddingHorizontal: 13, paddingTop: 13, paddingBottom: 8, fontSize: 14, fontWeight: '800', color: colors.text },
  recentRow: { minHeight: 42, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentCode: { flex: 1, fontSize: 12, color: colors.text },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
});
