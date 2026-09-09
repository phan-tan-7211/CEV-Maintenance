import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../theme/colors';
import type { CatalogKey, MasterRecord } from '../data/masterData';
import { listMaintenanceDocuments, uploadMaintenanceDocument } from '../data/documentRepository';

type Props = {
  category: CatalogKey;
  title: string;
  record: MasterRecord;
  messages: any;
  onBack: () => void;
  onEdit: () => void;
};

export function RecordDetailScreen({ category, title, record, messages, onBack, onEdit }: Props) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const rows = [
    [messages.common.code, record.code],
    [messages.common.name, record.name],
    [messages.common.specification, record.secondary],
    [messages.common.location, record.location ?? '-'],
    [messages.common.nextDue, record.nextDue ?? '-'],
    [messages.common.stock, typeof record.quantity === 'number' ? `${record.quantity} ${record.unit ?? ''}` : '-'],
  ];

  const loadDocuments = async () => {
    try { setDocuments(await listMaintenanceDocuments(category, record.id)); }
    catch { setDocuments([]); }
  };
  useEffect(() => { void loadDocuments(); }, [category, record.id]);

  const upload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setUploading(true);
    try {
      await uploadMaintenanceDocument({ entityType: category, entityId: record.id, fileName: file.name, uri: file.uri, mimeType: file.mimeType });
      await loadDocuments();
    } catch (error: any) { Alert.alert(messages.common.saveError ?? 'Upload failed', error?.message ?? String(error)); }
    finally { setUploading(false); }
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /><Text style={styles.backText}>{title}</Text></TouchableOpacity>
        <TouchableOpacity onPress={onEdit} style={styles.edit}><Ionicons name="create-outline" size={20} color={colors.primary} /><Text style={styles.editText}>{messages.common.edit}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="cube-outline" size={30} color={colors.primary} /></View><Text style={styles.code}>{record.code}</Text><Text style={styles.name}>{record.name}</Text><Text style={styles.secondary}>{record.secondary}</Text><View style={styles.live}><View style={styles.dot} /><Text style={styles.liveText}>SUPABASE</Text></View></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>{messages.common.basicInfo}</Text>{rows.map(([label, value], index) => <View key={label} style={[styles.row, index === rows.length - 1 && styles.lastRow]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>)}</View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}><Text style={styles.sectionTitleFlat}>{messages.common.documents} ({documents.length})</Text><TouchableOpacity onPress={() => void upload()} disabled={uploading} style={styles.uploadButton}>{uploading ? <ActivityIndicator size="small" color={colors.primary} /> : <><Ionicons name="cloud-upload-outline" size={18} color={colors.primary} /><Text style={styles.uploadText}>Upload</Text></>}</TouchableOpacity></View>
          {documents.length === 0 ? <Text style={styles.emptyDocs}>Chưa có tài liệu / No documents</Text> : documents.map((doc) => <View key={doc.id} style={styles.docRow}><Ionicons name="document-text-outline" size={19} color={colors.primary} /><Text style={styles.docName}>{doc.file_name}</Text><Text style={styles.docDate}>{String(doc.created_at).slice(0,10)}</Text></View>)}
        </View>
        <View style={styles.section}><Text style={styles.sectionTitle}>{messages.common.relatedManagement}</Text>{[[messages.common.history, 'time-outline'],[messages.common.maintenancePlan, 'calendar-outline'],[messages.common.workOrders, 'clipboard-outline']].map(([label, icon]) => <TouchableOpacity key={label} style={styles.actionRow} activeOpacity={0.7}><Ionicons name={icon as any} size={20} color={colors.primary} /><Text style={styles.actionText}>{label}</Text><Ionicons name="chevron-forward" size={19} color={colors.muted} /></TouchableOpacity>)}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { minHeight: 54, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { flexDirection: 'row', alignItems: 'center', flex: 1 }, backText: { color: colors.text, fontSize: 14, fontWeight: '700', maxWidth: 220 }, edit: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 38, paddingHorizontal: 12 }, editText: { color: colors.primary, fontWeight: '800', fontSize: 13 }, content: { padding: 18, paddingTop: 4, paddingBottom: 110 }, hero: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 22 }, heroIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, code: { color: colors.primary, fontSize: 12, fontWeight: '900', marginTop: 12 }, name: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 4 }, secondary: { color: colors.muted, fontSize: 13, marginTop: 5 }, live: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }, liveText: { fontSize: 9, color: colors.success, fontWeight: '900' }, section: { marginTop: 14, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border }, sectionHeaderRow: { minHeight: 54, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }, sectionTitleFlat: { color: colors.text, fontSize: 15, fontWeight: '900' }, uploadButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, minHeight: 36 }, uploadText: { color: colors.primary, fontSize: 12, fontWeight: '800' }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border }, lastRow: { borderBottomWidth: 0 }, label: { color: colors.muted, fontSize: 13 }, value: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1 }, actionRow: { minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, actionText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' }, docRow: { minHeight: 48, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: colors.border }, docName: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' }, docDate: { color: colors.muted, fontSize: 10 }, emptyDocs: { padding: 16, color: colors.muted, fontSize: 12 },
});
