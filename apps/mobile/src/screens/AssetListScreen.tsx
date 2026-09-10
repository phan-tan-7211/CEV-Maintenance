import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Locale } from '../i18n';
import { getEquipmentUi } from '../i18n/equipmentUi';
import type { AssetGroupOption, MasterRecord } from '../data/masterData';
import { listAssetGroups, listMasterRecords } from '../data/masterRepository';

type Props = {
  locale: Locale;
  messages: any;
  onBack: () => void;
  onOpenRecord: (record: MasterRecord) => void;
  onCreateAsset: () => void;
};

type SortField = 'name' | 'code' | 'group';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'warning' | 'inactive';

export function AssetListScreen({ locale, messages, onBack, onOpenRecord, onCreateAsset }: Props) {
  const copy = useMemo(() => getEquipmentUi(locale), [locale]);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [groups, setGroups] = useState<AssetGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [assets, assetGroups] = await Promise.all([listMasterRecords('assets'), listAssetGroups()]);
      setRecords(assets);
      setGroups(assetGroups);
    } catch (error: any) {
      Alert.alert(messages.common.loadError ?? 'Unable to load data', error?.message ?? String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const locations = useMemo(() => {
    return Array.from(new Set(records.map((item) => item.location).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = records.filter((item) => {
      if (selectedGroupId !== 'all' && item.groupId !== selectedGroupId) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (selectedLocation !== 'all' && item.location !== selectedLocation) return false;
      if (!q) return true;
      return `${item.code} ${item.name} ${item.secondary} ${item.location ?? ''} ${item.group ?? ''} ${item.type ?? ''}`.toLowerCase().includes(q);
    });

    return [...filtered].sort((a, b) => {
      const aValue = sortField === 'name' ? a.name : sortField === 'code' ? a.code : (a.group ?? '');
      const bValue = sortField === 'name' ? b.name : sortField === 'code' ? b.code : (b.group ?? '');
      const result = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? result : -result;
    });
  }, [query, records, selectedGroupId, selectedStatus, selectedLocation, sortField, sortDirection]);

  const activeFilterCount = Number(selectedGroupId !== 'all') + Number(selectedStatus !== 'all') + Number(selectedLocation !== 'all');
  const clearFilters = () => {
    setSelectedGroupId('all');
    setSelectedStatus('all');
    setSelectedLocation('all');
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: copy.all },
    { value: 'active', label: messages.common.active },
    { value: 'warning', label: messages.common.warning },
    { value: 'inactive', label: messages.common.inactive },
  ];

  const selectSortField = (field: SortField) => {
    if (sortField === field) setSortDirection((value) => value === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.title}>{copy.title}</Text>
          <TouchableOpacity onPress={onCreateAsset} style={styles.desktopLikeAdd} activeOpacity={0.75} accessibilityLabel={copy.add}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.desktopLikeAddText}>{copy.add}</Text>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={copy.search}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={() => setShowSort(true)} accessibilityLabel={copy.sort}>
            <Ionicons name="options-outline" size={19} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, activeFilterCount > 0 && styles.iconButtonActive]}
            onPress={() => setShowFilters(true)}
            accessibilityLabel={copy.filters}
          >
            <Ionicons name="funnel-outline" size={19} color={activeFilterCount > 0 ? colors.primary : colors.text} />
            {activeFilterCount > 0 ? <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View> : null}
          </TouchableOpacity>
        </View>

        {activeFilterCount > 0 ? (
          <View style={styles.activeFilters}>
            <Text style={styles.activeLabel}>{copy.active}:</Text>
            {selectedGroupId !== 'all' ? (
              <TouchableOpacity style={styles.activeChip} onPress={() => setSelectedGroupId('all')}>
                <Text style={styles.activeChipText}>{groups.find((group) => group.id === selectedGroupId)?.name ?? copy.all}</Text>
                <Ionicons name="close" size={13} color={colors.text} />
              </TouchableOpacity>
            ) : null}
            {selectedStatus !== 'all' ? (
              <TouchableOpacity style={styles.activeChip} onPress={() => setSelectedStatus('all')}>
                <Text style={styles.activeChipText}>{statusOptions.find((item) => item.value === selectedStatus)?.label}</Text>
                <Ionicons name="close" size={13} color={colors.text} />
              </TouchableOpacity>
            ) : null}
            {selectedLocation !== 'all' ? (
              <TouchableOpacity style={styles.activeChip} onPress={() => setSelectedLocation('all')}>
                <Text numberOfLines={1} style={styles.activeChipText}>{selectedLocation}</Text>
                <Ionicons name="close" size={13} color={colors.text} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={clearFilters}><Text style={styles.clearInline}>{copy.clearAll}</Text></TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{messages.common.loading}</Text></View>
        ) : null}

        {!loading && rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="construct-outline" size={36} color={colors.muted} /></View>
            <Text style={styles.emptyTitle}>{records.length === 0 ? copy.noEquipment : copy.noResults}</Text>
            <Text style={styles.emptyText}>{records.length === 0 ? copy.noEquipmentHint : copy.noResultsHint}</Text>
            {records.length === 0 ? (
              <TouchableOpacity style={styles.emptyAction} activeOpacity={0.75} onPress={onCreateAsset}>
                <Ionicons name="add" size={19} color="#fff" />
                <Text style={styles.emptyActionText}>{copy.add}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {!loading && rows.length > 0 ? (
          <View style={styles.list}>
            <Text style={styles.summary}>{rows.length} {copy.results}</Text>
            {rows.map((item) => (
              <TouchableOpacity key={item.id} style={styles.assetCard} activeOpacity={0.72} onPress={() => onOpenRecord(item)}>
                <View style={styles.assetVisual}>
                  <Ionicons name="cube-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.assetBody}>
                  <View style={styles.assetTopLine}>
                    <Text numberOfLines={1} style={styles.assetName}>{item.name}</Text>
                    <View style={[styles.statusDot, item.status === 'warning' && styles.statusWarning, item.status === 'inactive' && styles.statusInactive]} />
                  </View>
                  <Text style={styles.assetCode}>{item.code}</Text>
                  <Text numberOfLines={1} style={styles.assetClass}>{[item.group, item.type].filter(Boolean).join(' · ') || copy.unclassified}</Text>
                  {item.location ? (
                    <View style={styles.metaRow}><Ionicons name="location-outline" size={13} color={colors.muted} /><Text numberOfLines={1} style={styles.assetMeta}>{item.location}</Text></View>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.78} onPress={onCreateAsset} accessibilityLabel={copy.add}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showSort} transparent animationType="fade" onRequestClose={() => setShowSort(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} onPress={() => setShowSort(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View><Text style={styles.sheetTitle}>{copy.sort}</Text><Text style={styles.sheetSubtitle}>{sortDirection === 'asc' ? copy.ascending : copy.descending}</Text></View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowSort(false)}><Ionicons name="close" size={21} color={colors.text} /></TouchableOpacity>
            </View>
            {([
              ['name', copy.sortName],
              ['code', copy.sortCode],
              ['group', copy.sortGroup],
            ] as [SortField, string][]).map(([field, label]) => (
              <TouchableOpacity key={field} style={styles.sheetOption} onPress={() => selectSortField(field)}>
                <Text style={[styles.sheetOptionText, sortField === field && styles.sheetOptionTextActive]}>{label}</Text>
                {sortField === field ? <Ionicons name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showFilters} transparent animationType="fade" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} onPress={() => setShowFilters(false)} />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}><Text style={styles.sheetTitle}>{copy.filters}</Text><Text style={styles.sheetSubtitle}>{copy.filterDescription}</Text></View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowFilters(false)}><Ionicons name="close" size={21} color={colors.text} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.filterSheetContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>{copy.quickFilters}</Text>
              <View style={styles.quickWrap}>
                <TouchableOpacity style={[styles.quickChip, selectedStatus === 'all' && styles.quickChipActive]} onPress={() => setSelectedStatus('all')}><Text style={[styles.quickText, selectedStatus === 'all' && styles.quickTextActive]}>{copy.all}</Text></TouchableOpacity>
                {statusOptions.slice(1).map((item) => (
                  <TouchableOpacity key={item.value} style={[styles.quickChip, selectedStatus === item.value && styles.quickChipActive]} onPress={() => setSelectedStatus(item.value)}>
                    {selectedStatus === item.value ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    <Text style={[styles.quickText, selectedStatus === item.value && styles.quickTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>{messages.common.assetGroup}</Text>
              <View style={styles.choiceList}>
                <TouchableOpacity style={styles.choiceRow} onPress={() => setSelectedGroupId('all')}>
                  <Text style={styles.choiceText}>{copy.all}</Text>
                  <Ionicons name={selectedGroupId === 'all' ? 'radio-button-on' : 'radio-button-off'} size={20} color={selectedGroupId === 'all' ? colors.primary : colors.muted} />
                </TouchableOpacity>
                {groups.map((group) => (
                  <TouchableOpacity key={group.id} style={styles.choiceRow} onPress={() => setSelectedGroupId(group.id)}>
                    <Text style={styles.choiceText}>{group.name}</Text>
                    <Ionicons name={selectedGroupId === group.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={selectedGroupId === group.id ? colors.primary : colors.muted} />
                  </TouchableOpacity>
                ))}
              </View>

              {locations.length > 0 ? <>
                <Text style={styles.filterSectionTitle}>{messages.common.location}</Text>
                <View style={styles.choiceList}>
                  <TouchableOpacity style={styles.choiceRow} onPress={() => setSelectedLocation('all')}>
                    <Text style={styles.choiceText}>{copy.all}</Text>
                    <Ionicons name={selectedLocation === 'all' ? 'radio-button-on' : 'radio-button-off'} size={20} color={selectedLocation === 'all' ? colors.primary : colors.muted} />
                  </TouchableOpacity>
                  {locations.map((location) => (
                    <TouchableOpacity key={location} style={styles.choiceRow} onPress={() => setSelectedLocation(location)}>
                      <Text numberOfLines={1} style={styles.choiceText}>{location}</Text>
                      <Ionicons name={selectedLocation === location ? 'radio-button-on' : 'radio-button-off'} size={20} color={selectedLocation === location ? colors.primary : colors.muted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </> : null}

              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}><Text style={styles.clearButtonText}>{copy.clearAll}</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 132 },
  pageHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  desktopLikeAdd: { display: 'none', height: 40, paddingHorizontal: 13, borderRadius: 9, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 },
  desktopLikeAddText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  toolbar: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 16 },
  searchBox: { flex: 1, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  iconButton: { position: 'relative', width: 44, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  iconButtonActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterBadge: { position: 'absolute', right: -5, top: -5, minWidth: 19, height: 19, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  activeFilters: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  activeLabel: { fontSize: 12, color: colors.muted },
  activeChip: { maxWidth: 180, minHeight: 30, borderRadius: 15, paddingHorizontal: 9, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeChipText: { maxWidth: 145, fontSize: 11, fontWeight: '700', color: colors.text },
  clearInline: { fontSize: 11, color: colors.primary, fontWeight: '800', paddingHorizontal: 4, paddingVertical: 6 },
  loading: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.muted, fontSize: 13 },
  emptyCard: { minHeight: 300, marginTop: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 280, marginTop: 7 },
  emptyAction: { marginTop: 18, height: 44, borderRadius: 9, paddingHorizontal: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyActionText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  list: { gap: 10, marginTop: 16 },
  summary: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 1 },
  assetCard: { minHeight: 88, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 11, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  assetVisual: { width: 54, height: 54, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  assetBody: { flex: 1, minWidth: 0 },
  assetTopLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  assetName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusWarning: { backgroundColor: '#F59E0B' },
  statusInactive: { backgroundColor: colors.muted },
  assetCode: { color: colors.primary, fontSize: 11, fontWeight: '900', marginTop: 3 },
  assetClass: { color: colors.muted, fontSize: 11, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  assetMeta: { flex: 1, color: colors.muted, fontSize: 11 },
  fab: { position: 'absolute', right: 16, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.42)' },
  bottomSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingBottom: 84, maxHeight: '70%' },
  filterSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingBottom: 68, height: '82%' },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 9, marginBottom: 6 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sheetSubtitle: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  closeButton: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sheetOption: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetOptionText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  sheetOptionTextActive: { color: colors.primary, fontWeight: '900' },
  filterSheetContent: { paddingBottom: 28 },
  filterSectionTitle: { marginTop: 18, marginBottom: 9, color: colors.text, fontSize: 13, fontWeight: '900' },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { minHeight: 40, borderRadius: 9, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  quickChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  quickTextActive: { color: '#fff' },
  choiceList: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' },
  choiceRow: { minHeight: 48, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  choiceText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
  clearButton: { marginTop: 20, minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  clearButtonText: { color: colors.text, fontSize: 13, fontWeight: '800' },
});
