import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Locale } from '../i18n';
import { getEquipmentUi } from '../i18n/equipmentUi';
import type { AssetGroupOption, MasterRecord } from '../data/masterData';
import { listAssetGroups, listMasterRecords } from '../data/masterRepository';

type Props = { messages: any; locale?: Locale; onBack: () => void; onOpenRecord: (record: MasterRecord) => void; onCreateAsset: () => void };
type SortField = 'name' | 'code' | 'group';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'warning' | 'inactive';

export function AssetListScreen({ messages, locale, onOpenRecord, onCreateAsset }: Props) {
  const resolvedLocale: Locale = locale ?? (messages.nav.home === 'Home' ? 'en' : messages.nav.home === '홈' ? 'ko' : 'vi');
  const copy = useMemo(() => getEquipmentUi(resolvedLocale), [resolvedLocale]);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [groups, setGroups] = useState<AssetGroupOption[]>([]);
  const [groupId, setGroupId] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [location, setLocation] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [assets, assetGroups] = await Promise.all([listMasterRecords('assets'), listAssetGroups()]);
      setRecords(assets); setGroups(assetGroups);
    } catch (error: any) {
      Alert.alert(messages.common.loadError, error?.message ?? String(error));
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void load(); }, []);

  const locations = useMemo(() => Array.from(new Set(records.map((r) => r.location).filter((v): v is string => Boolean(v)))).sort(), [records]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = records.filter((item) => {
      if (groupId !== 'all' && item.groupId !== groupId) return false;
      if (status !== 'all' && item.status !== status) return false;
      if (location !== 'all' && item.location !== location) return false;
      if (!q) return true;
      return `${item.code} ${item.name} ${item.secondary} ${item.location ?? ''} ${item.group ?? ''} ${item.type ?? ''}`.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      const av = sortField === 'name' ? a.name : sortField === 'code' ? a.code : a.group ?? '';
      const bv = sortField === 'name' ? b.name : sortField === 'code' ? b.code : b.group ?? '';
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [records, query, groupId, status, location, sortField, sortDirection]);

  const activeCount = Number(groupId !== 'all') + Number(status !== 'all') + Number(location !== 'all');
  const clearFilters = () => { setGroupId('all'); setStatus('all'); setLocation('all'); };
  const statuses: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: copy.all }, { value: 'active', label: messages.common.active }, { value: 'warning', label: messages.common.warning }, { value: 'inactive', label: messages.common.inactive },
  ];
  const selectSort = (field: SortField) => {
    if (field === sortField) setSortDirection((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  return <View style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{copy.title}</Text>
      <View style={styles.toolbar}>
        <View style={styles.search}><Ionicons name="search-outline" size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={copy.search} placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setSortOpen(true)}><Ionicons name="options-outline" size={19} color={colors.text} /></TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, activeCount > 0 && styles.iconButtonActive]} onPress={() => setFilterOpen(true)}>
          <Ionicons name="funnel-outline" size={19} color={activeCount > 0 ? colors.primary : colors.text} />
          {activeCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{activeCount}</Text></View> : null}
        </TouchableOpacity>
      </View>

      {activeCount > 0 ? <View style={styles.activeRow}>
        <Text style={styles.muted}>{copy.active}:</Text>
        {groupId !== 'all' ? <TouchableOpacity style={styles.activeChip} onPress={() => setGroupId('all')}><Text style={styles.activeChipText}>{groups.find((g) => g.id === groupId)?.name}</Text><Ionicons name="close" size={13} /></TouchableOpacity> : null}
        {status !== 'all' ? <TouchableOpacity style={styles.activeChip} onPress={() => setStatus('all')}><Text style={styles.activeChipText}>{statuses.find((s) => s.value === status)?.label}</Text><Ionicons name="close" size={13} /></TouchableOpacity> : null}
        {location !== 'all' ? <TouchableOpacity style={styles.activeChip} onPress={() => setLocation('all')}><Text numberOfLines={1} style={styles.activeChipText}>{location}</Text><Ionicons name="close" size={13} /></TouchableOpacity> : null}
        <TouchableOpacity onPress={clearFilters}><Text style={styles.clearInline}>{copy.clearAll}</Text></TouchableOpacity>
      </View> : null}

      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{messages.common.loading}</Text></View> : null}
      {!loading && rows.length === 0 ? <View style={styles.empty}>
        <View style={styles.emptyIcon}><Ionicons name="construct-outline" size={36} color={colors.muted} /></View>
        <Text style={styles.emptyTitle}>{records.length === 0 ? copy.noEquipment : copy.noResults}</Text>
        <Text style={styles.emptyText}>{records.length === 0 ? copy.noEquipmentHint : copy.noResultsHint}</Text>
        {records.length === 0 ? <TouchableOpacity style={styles.primary} onPress={onCreateAsset}><Ionicons name="add" size={19} color="#fff" /><Text style={styles.primaryText}>{copy.add}</Text></TouchableOpacity> : null}
      </View> : null}

      {!loading && rows.length > 0 ? <View style={styles.list}><Text style={styles.summary}>{rows.length} {copy.results}</Text>{rows.map((item) => <TouchableOpacity key={item.id} style={styles.card} onPress={() => onOpenRecord(item)} activeOpacity={0.72}>
        <View style={styles.visual}><Ionicons name="cube-outline" size={24} color={colors.primary} /></View>
        <View style={styles.body}><View style={styles.nameRow}><Text numberOfLines={1} style={styles.name}>{item.name}</Text><View style={[styles.statusDot, item.status === 'warning' && styles.warningDot, item.status === 'inactive' && styles.inactiveDot]} /></View>
          <Text style={styles.code}>{item.code}</Text><Text numberOfLines={1} style={styles.meta}>{[item.group, item.type].filter(Boolean).join(' · ') || copy.unclassified}</Text>
          {item.location ? <View style={styles.locationRow}><Ionicons name="location-outline" size={13} color={colors.muted} /><Text numberOfLines={1} style={styles.meta}>{item.location}</Text></View> : null}
        </View><Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </TouchableOpacity>)}</View> : null}
    </ScrollView>

    <TouchableOpacity style={styles.fab} onPress={onCreateAsset} activeOpacity={0.78}><Ionicons name="add" size={28} color="#fff" /></TouchableOpacity>

    <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}><View style={styles.modalRoot}><Pressable style={styles.scrim} onPress={() => setSortOpen(false)} /><View style={styles.sheet}><View style={styles.handle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{copy.sort}</Text><Text style={styles.sheetSub}>{sortDirection === 'asc' ? copy.ascending : copy.descending}</Text></View><TouchableOpacity onPress={() => setSortOpen(false)}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity></View>
      {([['name', copy.sortName], ['code', copy.sortCode], ['group', copy.sortGroup]] as [SortField, string][]).map(([field, label]) => <TouchableOpacity key={field} style={styles.option} onPress={() => selectSort(field)}><Text style={[styles.optionText, sortField === field && styles.optionActive]}>{label}</Text>{sortField === field ? <Ionicons name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={18} color={colors.primary} /> : null}</TouchableOpacity>)}
    </View></View></Modal>

    <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}><View style={styles.modalRoot}><Pressable style={styles.scrim} onPress={() => setFilterOpen(false)} /><View style={styles.filterSheet}><View style={styles.handle} /><View style={styles.sheetHeader}><View style={{ flex: 1 }}><Text style={styles.sheetTitle}>{copy.filters}</Text><Text style={styles.sheetSub}>{copy.filterDescription}</Text></View><TouchableOpacity onPress={() => setFilterOpen(false)}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.filterContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.filterTitle}>{copy.quickFilters}</Text><View style={styles.quickWrap}>{statuses.map((s) => <TouchableOpacity key={s.value} style={[styles.quickChip, status === s.value && styles.quickActive]} onPress={() => setStatus(s.value)}>{status === s.value ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}<Text style={[styles.quickText, status === s.value && styles.quickTextActive]}>{s.label}</Text></TouchableOpacity>)}</View>
        <Text style={styles.filterTitle}>{messages.common.assetGroup}</Text><View style={styles.choiceList}><Choice label={copy.all} active={groupId === 'all'} onPress={() => setGroupId('all')} />{groups.map((g) => <Choice key={g.id} label={g.name} active={groupId === g.id} onPress={() => setGroupId(g.id)} />)}</View>
        {locations.length ? <><Text style={styles.filterTitle}>{messages.common.location}</Text><View style={styles.choiceList}><Choice label={copy.all} active={location === 'all'} onPress={() => setLocation('all')} />{locations.map((l) => <Choice key={l} label={l} active={location === l} onPress={() => setLocation(l)} />)}</View></> : null}
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}><Text style={styles.clearText}>{copy.clearAll}</Text></TouchableOpacity>
      </ScrollView>
    </View></View></Modal>
  </View>;
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity style={styles.choice} onPress={onPress}><Text numberOfLines={1} style={styles.choiceText}>{label}</Text><Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.primary : colors.muted} /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, content: { padding: 16, paddingTop: 18, paddingBottom: 132 }, title: { fontSize: 27, fontWeight: '900', color: colors.text },
  toolbar: { flexDirection: 'row', gap: 8, marginTop: 16 }, search: { flex: 1, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11 }, searchInput: { flex: 1, fontSize: 14, color: colors.text },
  iconButton: { position: 'relative', width: 44, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, iconButtonActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, badge: { position: 'absolute', right: -5, top: -5, minWidth: 19, height: 19, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activeRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }, muted: { fontSize: 12, color: colors.muted }, activeChip: { maxWidth: 180, minHeight: 30, borderRadius: 15, paddingHorizontal: 9, backgroundColor: colors.primarySoft, flexDirection: 'row', gap: 4, alignItems: 'center' }, activeChipText: { maxWidth: 145, fontSize: 11, fontWeight: '700', color: colors.text }, clearInline: { fontSize: 11, fontWeight: '800', color: colors.primary, padding: 5 },
  loading: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 10 }, empty: { minHeight: 300, marginTop: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 28, alignItems: 'center', justifyContent: 'center' }, emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, emptyTitle: { fontSize: 16, fontWeight: '900', color: colors.text }, emptyText: { marginTop: 7, maxWidth: 280, textAlign: 'center', color: colors.muted, fontSize: 12, lineHeight: 18 }, primary: { marginTop: 18, height: 44, borderRadius: 9, paddingHorizontal: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 }, primaryText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  list: { marginTop: 16, gap: 10 }, summary: { color: colors.muted, fontSize: 12, fontWeight: '700' }, card: { minHeight: 88, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 11, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, visual: { width: 54, height: 54, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, body: { flex: 1, minWidth: 0 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, name: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' }, code: { color: colors.primary, fontSize: 11, fontWeight: '900', marginTop: 3 }, meta: { flexShrink: 1, color: colors.muted, fontSize: 11, marginTop: 3 }, locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 }, statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }, warningDot: { backgroundColor: '#F59E0B' }, inactiveDot: { backgroundColor: colors.muted }, fab: { position: 'absolute', right: 16, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.42)' }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingBottom: 84 }, filterSheet: { height: '82%', backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingBottom: 68 }, handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 9, marginBottom: 6 }, sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, sheetTitle: { fontSize: 18, fontWeight: '900', color: colors.text }, sheetSub: { marginTop: 3, fontSize: 11, lineHeight: 16, color: colors.muted }, option: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, optionText: { color: colors.text, fontSize: 14, fontWeight: '700' }, optionActive: { color: colors.primary, fontWeight: '900' }, filterContent: { paddingBottom: 28 }, filterTitle: { marginTop: 18, marginBottom: 9, color: colors.text, fontSize: 13, fontWeight: '900' }, quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, quickChip: { minHeight: 40, borderRadius: 9, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, flexDirection: 'row', gap: 5, alignItems: 'center' }, quickActive: { backgroundColor: colors.primary, borderColor: colors.primary }, quickText: { color: colors.text, fontSize: 12, fontWeight: '700' }, quickTextActive: { color: '#fff' }, choiceList: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' }, choice: { minHeight: 48, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, choiceText: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text }, clearButton: { marginTop: 20, minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, clearText: { fontSize: 13, fontWeight: '800', color: colors.text },
});
