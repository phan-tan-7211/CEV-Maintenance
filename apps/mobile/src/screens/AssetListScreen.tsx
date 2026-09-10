import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  onCreateGroup: () => void;
  onCreateType: () => void;
  onCreateAsset: () => void;
};

type AddAction = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  note: string;
  step: string;
  onPress: () => void;
};

export function AssetListScreen({
  messages,
  onBack,
  onOpenRecord,
  onCreateGroup,
  onCreateType,
  onCreateAsset,
}: Props) {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [groups, setGroups] = useState<AssetGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [assets, assetGroups] = await Promise.all([
        listMasterRecords('assets'),
        listAssetGroups(),
      ]);
      setRecords(assets);
      setGroups(assetGroups);
    } catch (error: any) {
      Alert.alert(messages.common.loadError ?? 'Không thể tải dữ liệu', error?.message ?? String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((item) => {
      if (selectedGroupId !== 'all' && item.groupId !== selectedGroupId) return false;
      if (!q) return true;
      return `${item.code} ${item.name} ${item.secondary} ${item.location ?? ''} ${item.group ?? ''} ${item.type ?? ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, records, selectedGroupId]);

  const currentGroupName = selectedGroupId === 'all'
    ? 'Tất cả nhóm'
    : groups.find((item) => item.id === selectedGroupId)?.name ?? 'Tất cả nhóm';

  const closeThen = (action: () => void) => {
    setShowAddMenu(false);
    setTimeout(action, 120);
  };

  const actions: AddAction[] = [
    {
      icon: 'layers-outline',
      title: 'Thêm nhóm tài sản',
      note: 'Tạo nhóm cấp cao trước, ví dụ Thiết bị sản xuất, Jig / khuôn, Thiết bị đo.',
      step: 'BƯỚC 1',
      onPress: () => closeThen(onCreateGroup),
    },
    {
      icon: 'git-branch-outline',
      title: 'Thêm loại tài sản',
      note: 'Tạo loại nằm trong một nhóm và đặt quy tắc QR, bảo trì, hiệu chuẩn, downtime.',
      step: 'BƯỚC 2',
      onPress: () => closeThen(onCreateType),
    },
    {
      icon: 'cube-outline',
      title: 'Thêm thiết bị / tài sản',
      note: 'Đăng ký thiết bị thật. Hệ thống tự cấp mã TS-#### khi lưu.',
      step: 'BƯỚC 3',
      onPress: () => closeThen(onCreateAsset),
    },
  ];

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backText}>{messages.nav.catalog}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowAddMenu(true)} style={styles.headerAdd} activeOpacity={0.75}>
          <Ionicons name="add" size={21} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Thiết bị & tài sản</Text>
            <TouchableOpacity style={styles.teamScope} onPress={() => setShowFilters((value) => !value)} activeOpacity={0.7}>
              <Text style={styles.teamScopeText}>{currentGroupName}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm thiết bị..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.squareButton} activeOpacity={0.7} onPress={() => setShowFilters((value) => !value)}>
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.squareButton, selectedGroupId !== 'all' && styles.squareButtonActive]}
            activeOpacity={0.7}
            onPress={() => setShowFilters((value) => !value)}
          >
            <Ionicons name="funnel-outline" size={20} color={selectedGroupId !== 'all' ? colors.primary : colors.text} />
          </TouchableOpacity>
        </View>

        {showFilters ? (
          <View style={styles.filterPanel}>
            <Text style={styles.filterTitle}>Lọc theo nhóm tài sản</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              <TouchableOpacity
                style={[styles.filterChip, selectedGroupId === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedGroupId('all')}
              >
                <Text style={[styles.filterChipText, selectedGroupId === 'all' && styles.filterChipTextActive]}>Tất cả</Text>
              </TouchableOpacity>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.filterChip, selectedGroupId === group.id && styles.filterChipActive]}
                  onPress={() => setSelectedGroupId(group.id)}
                >
                  <Text style={[styles.filterChipText, selectedGroupId === group.id && styles.filterChipTextActive]}>{group.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>Đang tải thiết bị...</Text>
          </View>
        ) : null}

        {!loading && rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="construct-outline" size={40} color={colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>{records.length === 0 ? 'Chưa có thiết bị' : 'Không tìm thấy thiết bị'}</Text>
            <Text style={styles.emptyText}>
              {records.length === 0
                ? 'Thiết lập nhóm và loại tài sản trước, sau đó đăng ký thiết bị đầu tiên.'
                : 'Thử thay đổi từ khóa hoặc bộ lọc nhóm tài sản.'}
            </Text>
            {records.length === 0 ? (
              <TouchableOpacity style={styles.emptyAction} activeOpacity={0.75} onPress={() => setShowAddMenu(true)}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyActionText}>Bắt đầu thiết lập</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {!loading && rows.length > 0 ? (
          <View style={styles.list}>
            <View style={styles.listSummary}>
              <Text style={styles.summaryText}>{rows.length} thiết bị</Text>
              <Text style={styles.summaryText}>Chạm để xem hồ sơ</Text>
            </View>
            {rows.map((item) => (
              <TouchableOpacity key={item.id} style={styles.assetCard} activeOpacity={0.72} onPress={() => onOpenRecord(item)}>
                <View style={styles.assetIcon}>
                  <Ionicons name="cube-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.assetBody}>
                  <View style={styles.assetTopRow}>
                    <Text style={styles.assetCode}>{item.code}</Text>
                    <View style={styles.statusDotRow}>
                      <View style={[styles.statusDot, item.status === 'warning' && { backgroundColor: colors.warning }, item.status === 'inactive' && { backgroundColor: colors.muted }]} />
                      <Text style={styles.statusText}>{item.status === 'active' ? 'Đang sử dụng' : item.status === 'warning' ? 'Cần chú ý' : 'Ngừng sử dụng'}</Text>
                    </View>
                  </View>
                  <Text style={styles.assetName}>{item.name}</Text>
                  <Text style={styles.assetClass}>{[item.group, item.type].filter(Boolean).join(' › ') || 'Chưa phân loại'}</Text>
                  {item.location ? <Text style={styles.assetMeta}><Ionicons name="location-outline" size={12} /> {item.location}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.78} onPress={() => setShowAddMenu(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showAddMenu} transparent animationType="fade" onRequestClose={() => setShowAddMenu(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAddMenu(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Thêm vào danh mục thiết bị</Text>
                <Text style={styles.sheetSubtitle}>Luồng chuẩn: Nhóm → Loại → Thiết bị</Text>
              </View>
              <TouchableOpacity style={styles.sheetClose} onPress={() => setShowAddMenu(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.actionList}>
              {actions.map((action) => (
                <TouchableOpacity key={action.step} style={styles.actionRow} activeOpacity={0.72} onPress={action.onPress}>
                  <View style={styles.actionIcon}><Ionicons name={action.icon} size={23} color={colors.primary} /></View>
                  <View style={styles.actionBody}>
                    <Text style={styles.actionStep}>{action.step}</Text>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionNote}>{action.note}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  backText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  headerAdd: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 130 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  teamScope: { flexDirection: 'row', gap: 4, alignItems: 'center', alignSelf: 'flex-start', marginTop: 5, paddingVertical: 3 },
  teamScopeText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 18 },
  searchBox: { flex: 1, height: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  squareButton: { width: 46, height: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  squareButtonActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterPanel: { marginTop: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 12 },
  filterTitle: { color: colors.text, fontSize: 12, fontWeight: '800', paddingHorizontal: 12, marginBottom: 9 },
  filterChips: { paddingHorizontal: 12, gap: 8 },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: colors.background },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterChipText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  filterChipTextActive: { color: colors.primary, fontWeight: '900' },
  loading: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.muted, fontSize: 13 },
  emptyCard: { minHeight: 280, marginTop: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyIcon: { width: 66, height: 66, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 280, marginTop: 7 },
  emptyAction: { marginTop: 18, height: 44, paddingHorizontal: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  emptyActionText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  list: { marginTop: 16, gap: 10 },
  listSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  summaryText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  assetCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  assetIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  assetBody: { flex: 1 },
  assetTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  assetCode: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  statusDotRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  statusText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  assetName: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 3 },
  assetClass: { color: colors.muted, fontSize: 11, marginTop: 3 },
  assetMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  fab: { position: 'absolute', right: 18, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,24,40,0.42)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30, borderWidth: 1, borderColor: colors.border },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 3, backgroundColor: colors.border, marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sheetSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  actionList: { marginTop: 16, gap: 9 },
  actionRow: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  actionIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actionBody: { flex: 1 },
  actionStep: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  actionTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 2 },
  actionNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
});
