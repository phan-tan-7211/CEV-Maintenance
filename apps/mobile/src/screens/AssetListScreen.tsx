import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import type { AssetGroupOption, MasterRecord } from '../data/masterData';
import { listAssetGroups, listMasterRecords } from '../data/masterRepository';

type Props = {
  messages: any;
  onBack: () => void;
  onOpenRecord: (record: MasterRecord) => void;
  onCreateAsset: () => void;
};

export function AssetListScreen({ messages, onBack, onOpenRecord, onCreateAsset }: Props) {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [groups, setGroups] = useState<AssetGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [assets, assetGroups] = await Promise.all([listMasterRecords('assets'), listAssetGroups()]);
      setRecords(assets);
      setGroups(assetGroups);
    } catch (error: any) {
      Alert.alert(messages.common.loadError ?? 'Không thể tải dữ liệu', error?.message ?? String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((item) => {
      if (selectedGroupId !== 'all' && item.groupId !== selectedGroupId) return false;
      if (!q) return true;
      return `${item.code} ${item.name} ${item.secondary} ${item.location ?? ''} ${item.group ?? ''} ${item.type ?? ''}`.toLowerCase().includes(q);
    });
  }, [query, records, selectedGroupId]);

  const currentGroupName = selectedGroupId === 'all'
    ? 'Tất cả nhóm'
    : groups.find((item) => item.id === selectedGroupId)?.name ?? 'Tất cả nhóm';

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backText}>{messages.nav.catalog}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCreateAsset} style={styles.headerAdd} activeOpacity={0.75}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Thiết bị</Text>
        <TouchableOpacity style={styles.scope} onPress={() => setShowFilters((value) => !value)} activeOpacity={0.7}>
          <Text style={styles.scopeText}>{currentGroupName}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Tìm thiết bị..." placeholderTextColor={colors.muted} style={styles.searchInput} />
          </View>
          <TouchableOpacity style={[styles.filterButton, selectedGroupId !== 'all' && styles.filterButtonActive]} onPress={() => setShowFilters((value) => !value)}>
            <Ionicons name="funnel-outline" size={20} color={selectedGroupId !== 'all' ? colors.primary : colors.text} />
          </TouchableOpacity>
        </View>

        {showFilters ? (
          <View style={styles.filterPanel}>
            <TouchableOpacity style={[styles.filterChip, selectedGroupId === 'all' && styles.filterChipActive]} onPress={() => setSelectedGroupId('all')}>
              <Text style={[styles.filterText, selectedGroupId === 'all' && styles.filterTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            {groups.map((group) => (
              <TouchableOpacity key={group.id} style={[styles.filterChip, selectedGroupId === group.id && styles.filterChipActive]} onPress={() => setSelectedGroupId(group.id)}>
                <Text style={[styles.filterText, selectedGroupId === group.id && styles.filterTextActive]}>{group.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Đang tải thiết bị...</Text></View>
        ) : null}

        {!loading && rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="construct-outline" size={40} color={colors.muted} /></View>
            <Text style={styles.emptyTitle}>{records.length === 0 ? 'Chưa có thiết bị' : 'Không tìm thấy thiết bị'}</Text>
            <Text style={styles.emptyText}>{records.length === 0 ? 'Thêm thiết bị đầu tiên. Bạn có thể chọn nhóm có sẵn hoặc tạo nhóm mới ngay trong form.' : 'Thử thay đổi từ khóa hoặc bộ lọc.'}</Text>
            {records.length === 0 ? (
              <TouchableOpacity style={styles.emptyAction} activeOpacity={0.75} onPress={onCreateAsset}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyActionText}>Thêm thiết bị</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {!loading && rows.length > 0 ? (
          <View style={styles.list}>
            <Text style={styles.summary}>{rows.length} thiết bị</Text>
            {rows.map((item) => (
              <TouchableOpacity key={item.id} style={styles.assetCard} activeOpacity={0.72} onPress={() => onOpenRecord(item)}>
                <View style={styles.assetIcon}><Ionicons name="cube-outline" size={22} color={colors.primary} /></View>
                <View style={styles.assetBody}>
                  <Text style={styles.assetCode}>{item.code}</Text>
                  <Text style={styles.assetName}>{item.name}</Text>
                  <Text style={styles.assetClass}>{[item.group, item.type].filter(Boolean).join(' › ') || 'Chưa phân loại'}</Text>
                  {item.location ? <Text style={styles.assetMeta}>{item.location}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.78} onPress={onCreateAsset}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  backText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  headerAdd: { width: 38, height: 38, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 130 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  scope: { flexDirection: 'row', gap: 4, alignItems: 'center', alignSelf: 'flex-start', marginTop: 5, paddingVertical: 3 },
  scopeText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 18 },
  searchBox: { flex: 1, height: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  filterButton: { width: 46, height: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterPanel: { marginTop: 10, gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10 },
  filterChip: { minHeight: 38, paddingHorizontal: 12, justifyContent: 'center' },
  filterChipActive: { backgroundColor: colors.primarySoft },
  filterText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.primary, fontWeight: '900' },
  loading: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.muted, fontSize: 13 },
  emptyCard: { minHeight: 280, marginTop: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyIcon: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 280, marginTop: 7 },
  emptyAction: { marginTop: 18, height: 46, paddingHorizontal: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 7 },
  emptyActionText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  list: { gap: 10, marginTop: 14 },
  summary: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  assetCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  assetIcon: { width: 42, height: 42, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  assetBody: { flex: 1 },
  assetCode: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  assetName: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 2 },
  assetClass: { color: colors.muted, fontSize: 11, marginTop: 3 },
  assetMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  fab: { position: 'absolute', right: 18, bottom: 92, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
});
