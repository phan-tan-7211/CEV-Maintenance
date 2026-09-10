import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Locale } from '../i18n';
import { getEquipmentUi } from '../i18n/equipmentUi';
import type { MasterRecord } from '../data/masterData';

type TabKey = 'details' | 'work' | 'parts' | 'history';

type Props = {
  record: MasterRecord;
  locale: Locale;
  onBack: () => void;
  onEdit: () => void;
  onCreateWork: () => void;
};

export function AssetDetailScreen({ record, locale, onBack, onEdit, onCreateWork }: Props) {
  const copy = useMemo(() => getEquipmentUi(locale).detail, [locale]);
  const [tab, setTab] = useState<TabKey>('details');
  const [qrOpen, setQrOpen] = useState(false);

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'details', label: copy.details, icon: 'information-circle-outline' },
    { key: 'work', label: copy.work, icon: 'clipboard-outline' },
    { key: 'parts', label: copy.parts, icon: 'cube-outline' },
    { key: 'history', label: copy.history, icon: 'time-outline' },
  ];

  const infoRows = [
    [copy.assetCode, record.code],
    [copy.group, record.group ?? '-'],
    [copy.type, record.type ?? '-'],
    [copy.location, record.location ?? '-'],
    [copy.parent, record.parentCode ?? '-'],
    [copy.specification, record.specification ?? record.secondary ?? '-'],
    [copy.nextDue, record.nextDue ?? '-'],
  ];

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>{copy.title}</Text>
        <TouchableOpacity onPress={onEdit} style={styles.headerButton} accessibilityLabel={copy.edit}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.assetIcon}><Ionicons name="construct-outline" size={27} color={colors.primary} /></View>
            <View style={styles.heroText}>
              <Text style={styles.assetCode}>{record.code}</Text>
              <Text style={styles.assetName}>{record.name}</Text>
              <Text style={styles.assetSub}>{[record.group, record.type].filter(Boolean).join(' · ') || record.secondary}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}><View style={styles.statusDot} /><Text style={styles.statusText}>{copy.active}</Text></View>
            {record.location ? <View style={styles.locationBadge}><Ionicons name="location-outline" size={14} color={colors.muted} /><Text numberOfLines={1} style={styles.locationText}>{record.location}</Text></View> : null}
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickButton} onPress={() => setQrOpen(true)}>
              <Ionicons name="qr-code-outline" size={20} color={colors.primary} /><Text style={styles.quickText}>{copy.qr}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={onCreateWork}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} /><Text style={styles.quickText}>{copy.createWork}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={onEdit}>
              <Ionicons name="create-outline" size={20} color={colors.primary} /><Text style={styles.quickText}>{copy.edit}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <TouchableOpacity key={item.key} onPress={() => setTab(item.key)} style={[styles.tab, active && styles.tabActive]}>
                <Ionicons name={item.icon} size={17} color={active ? colors.primary : colors.muted} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {tab === 'details' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy.overview}</Text>
              {infoRows.map(([label, value], index) => (
                <View key={String(label)} style={[styles.infoRow, index === infoRows.length - 1 && styles.noBorder]}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.gridRow}>
              <TouchableOpacity style={styles.metricCard} onPress={onCreateWork}>
                <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
                <Text style={styles.metricValue}>0</Text><Text style={styles.metricLabel}>{copy.workOrders}</Text>
              </TouchableOpacity>
              <View style={styles.metricCard}>
                <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                <Text style={styles.metricValue}>{record.nextDue ?? '—'}</Text><Text style={styles.metricLabel}>{copy.maintenance}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy.documents}</Text>
              <View style={styles.emptyBlock}><Ionicons name="document-text-outline" size={26} color={colors.muted} /><Text style={styles.emptyText}>{copy.noData}</Text></View>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{tabs.find((item) => item.key === tab)?.label}</Text>
            <View style={styles.emptyBlock}><Ionicons name="layers-outline" size={30} color={colors.muted} /><Text style={styles.emptyText}>{copy.noData}</Text></View>
          </View>
        )}
      </ScrollView>

      <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} onPress={() => setQrOpen(false)} />
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}><Text style={styles.qrTitle}>{copy.qr}</Text><TouchableOpacity onPress={() => setQrOpen(false)}><Ionicons name="close" size={23} color={colors.text} /></TouchableOpacity></View>
            <View style={styles.qrVisual}><Ionicons name="qr-code" size={128} color={colors.text} /></View>
            <Text style={styles.qrCode}>{record.code}</Text>
            <Text style={styles.qrName}>{record.name}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 6 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 15, fontWeight: '900' },
  content: { padding: 14, paddingBottom: 120, gap: 12 },
  hero: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 15 },
  heroTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  assetIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 }, assetCode: { fontSize: 11, fontWeight: '900', color: colors.primary }, assetName: { marginTop: 3, fontSize: 20, lineHeight: 24, fontWeight: '900', color: colors.text }, assetSub: { marginTop: 4, fontSize: 12, color: colors.muted },
  statusRow: { marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: '#ECFDF3' }, statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }, statusText: { fontSize: 11, fontWeight: '800', color: colors.success }, locationBadge: { maxWidth: '70%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.background }, locationText: { flexShrink: 1, fontSize: 11, color: colors.muted },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 14 }, quickButton: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 3 }, quickText: { fontSize: 10, fontWeight: '800', color: colors.text },
  tabs: { gap: 8 }, tab: { minHeight: 40, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }, tabActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, tabText: { fontSize: 12, color: colors.muted, fontWeight: '700' }, tabTextActive: { color: colors.primary, fontWeight: '900' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }, cardTitle: { padding: 14, fontSize: 14, fontWeight: '900', color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border }, infoRow: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', gap: 14, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }, noBorder: { borderBottomWidth: 0 }, infoLabel: { width: 112, fontSize: 12, color: colors.muted }, infoValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '800', color: colors.text },
  gridRow: { flexDirection: 'row', gap: 10 }, metricCard: { flex: 1, minHeight: 112, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, justifyContent: 'center' }, metricValue: { marginTop: 8, fontSize: 16, fontWeight: '900', color: colors.text }, metricLabel: { marginTop: 2, fontSize: 11, color: colors.muted }, emptyBlock: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18 }, emptyText: { fontSize: 12, color: colors.muted },
  modalRoot: { flex: 1, justifyContent: 'center', padding: 20 }, scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' }, qrCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16 }, qrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, qrTitle: { fontSize: 16, fontWeight: '900', color: colors.text }, qrVisual: { marginTop: 18, width: 190, height: 190, alignSelf: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, qrCode: { textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '900', color: colors.primary }, qrName: { textAlign: 'center', marginTop: 4, fontSize: 12, color: colors.muted },
});
