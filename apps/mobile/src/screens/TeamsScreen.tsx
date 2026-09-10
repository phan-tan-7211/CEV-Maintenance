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
import { createTeam, listTeamsWithMembers, type TeamListItem } from '../data/teamRepository';

type SortBy = 'name-asc' | 'name-desc' | 'members' | 'newest';

type Props = {
  onBack: () => void;
  onOpenTeam?: (team: TeamListItem) => void;
};

function roleLabel(role: string) {
  if (role === 'manager') return 'Quản lý';
  if (role === 'technician') return 'Kỹ thuật';
  if (role === 'requestor') return 'Người yêu cầu';
  if (role === 'viewer') return 'Chỉ xem';
  return role || 'Thành viên';
}

function shortUser(userId: string) {
  return `User ${userId.slice(0, 6)}`;
}

export function TeamsScreen({ onBack, onOpenTeam }: Props) {
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name-asc');
  const [showSort, setShowSort] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      setTeams(await listTeamsWithMembers());
    } catch (error: any) {
      Alert.alert('Không thể tải nhóm', error?.message ?? String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = teams.filter((team) => {
      if (!q) return true;
      return `${team.name} ${team.description ?? ''} ${team.code}`.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'members') return b.memberCount - a.memberCount;
      if (sortBy === 'newest') return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      return a.name.localeCompare(b.name);
    });
  }, [teams, search, sortBy]);

  const submitCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Tên nhóm là bắt buộc');
      return;
    }
    setCreating(true);
    try {
      const created = await createTeam({ name, description });
      setTeams((current) => [...current, created]);
      setName('');
      setDescription('');
      setShowCreate(false);
    } catch (error: any) {
      Alert.alert('Không thể tạo nhóm', error?.message ?? String(error));
    } finally {
      setCreating(false);
    }
  };

  const sortLabel = sortBy === 'name-desc' ? 'Tên Z–A' : sortBy === 'members' ? 'Nhiều thành viên' : sortBy === 'newest' ? 'Mới nhất' : 'Tên A–Z';

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backText}>Người & nhóm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Nhóm</Text>
        <Text style={styles.subtitle}>Quản lý các nhóm thực hiện công việc và thành viên trong nhà máy.</Text>

        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm nhóm..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.sortButton} onPress={() => setShowSort((v) => !v)} activeOpacity={0.75}>
            <Ionicons name="swap-vertical-outline" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)} activeOpacity={0.78}>
            <Ionicons name="add" size={19} color="#fff" />
            <Text style={styles.createButtonText}>Tạo nhóm</Text>
          </TouchableOpacity>
        </View>

        {showSort ? (
          <View style={styles.sortPanel}>
            <Text style={styles.sortTitle}>Sắp xếp · {sortLabel}</Text>
            {([
              ['name-asc', 'Tên A–Z'],
              ['name-desc', 'Tên Z–A'],
              ['members', 'Nhiều thành viên'],
              ['newest', 'Mới nhất'],
            ] as [SortBy, string][]).map(([key, label]) => (
              <TouchableOpacity key={key} style={styles.sortRow} onPress={() => { setSortBy(key); setShowSort(false); }}>
                <Text style={[styles.sortRowText, sortBy === key && { color: colors.primary, fontWeight: '900' }]}>{label}</Text>
                {sortBy === key ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Đang tải nhóm...</Text></View>
        ) : null}

        {!loading && rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>{search ? 'Không tìm thấy nhóm' : 'Chưa có nhóm nào'}</Text>
            <Text style={styles.emptyText}>{search ? 'Thử từ khóa khác.' : 'Tạo nhóm đầu tiên để tổ chức công việc bảo trì và phân công thành viên.'}</Text>
            {!search ? <TouchableOpacity style={styles.emptyAction} onPress={() => setShowCreate(true)}><Ionicons name="add" size={19} color="#fff" /><Text style={styles.emptyActionText}>Tạo nhóm đầu tiên</Text></TouchableOpacity> : null}
          </View>
        ) : null}

        {!loading && rows.length > 0 ? (
          <View style={styles.grid}>
            {rows.map((team) => (
              <TouchableOpacity key={team.id} style={styles.card} activeOpacity={0.72} onPress={() => onOpenTeam?.(team)}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{team.name}</Text>
                    <Text style={styles.cardDescription}>{team.description || 'Chưa có mô tả'}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton} onPress={() => onOpenTeam?.(team)}>
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}><Ionicons name="people-outline" size={15} color={colors.muted} /><Text style={styles.statText}>{team.memberCount}</Text></View>
                  <View style={styles.stat}><Ionicons name="cube-outline" size={15} color={colors.muted} /><Text style={styles.statText}>—</Text></View>
                  <View style={styles.stat}><Ionicons name="clipboard-outline" size={15} color={colors.muted} /><Text style={styles.statText}>—</Text></View>
                </View>

                <Text style={styles.membersTitle}>Thành viên</Text>
                {team.members.slice(0, 3).map((member) => (
                  <View key={`${team.id}-${member.userId}`} style={styles.memberRow}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{shortUser(member.userId).slice(5, 7).toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.memberName}>{shortUser(member.userId)}</Text><Text style={styles.memberRole}>{roleLabel(member.role)}</Text></View>
                  </View>
                ))}
                {team.members.length > 3 ? <Text style={styles.moreMembers}>+{team.members.length - 3} thành viên khác</Text> : null}
                {team.members.length === 0 ? <Text style={styles.noMembers}>Chưa có thành viên</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowCreate(false)} />
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <View style={{ flex: 1 }}><Text style={styles.dialogTitle}>Tạo nhóm mới</Text><Text style={styles.dialogSubtitle}>Tạo nhóm để tổ chức công việc bảo trì và phân công thành viên.</Text></View>
              <TouchableOpacity onPress={() => setShowCreate(false)}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity>
            </View>
            <Text style={styles.label}>Tên nhóm *</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Nhập tên nhóm" placeholderTextColor={colors.muted} style={styles.input} autoFocus />
            <Text style={[styles.label, { marginTop: 14 }]}>Mô tả</Text>
            <TextInput value={description} onChangeText={(v) => setDescription(v.slice(0, 500))} placeholder="Mô tả nhóm (không bắt buộc)" placeholderTextColor={colors.muted} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
            <Text style={styles.counter}>{description.length} / 500</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreate(false)}><Text style={styles.cancelText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity disabled={creating} style={[styles.submitButton, creating && { opacity: 0.6 }]} onPress={() => void submitCreate()}>{creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Tạo nhóm</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 54, paddingHorizontal: 12, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  content: { padding: 18, paddingTop: 4, paddingBottom: 120 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  toolbar: { flexDirection: 'row', gap: 8, marginTop: 18, alignItems: 'center' },
  searchBox: { flex: 1, minWidth: 0, height: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  sortButton: { width: 46, height: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  createButton: { height: 46, paddingHorizontal: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  createButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  sortPanel: { marginTop: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sortTitle: { color: colors.muted, fontSize: 11, fontWeight: '800', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  sortRow: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  sortRowText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  loading: { minHeight: 250, justifyContent: 'center', alignItems: 'center', gap: 10 },
  muted: { color: colors.muted, fontSize: 13 },
  emptyCard: { marginTop: 18, minHeight: 300, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', padding: 28 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 12 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, maxWidth: 290 },
  emptyAction: { marginTop: 16, height: 44, backgroundColor: colors.primary, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 16 },
  emptyActionText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  grid: { gap: 12, marginTop: 18 },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 15 },
  cardHeader: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  cardDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  moreButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  membersTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 13, marginBottom: 8 },
  memberRow: { flexDirection: 'row', gap: 9, alignItems: 'center', paddingVertical: 5 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  memberName: { color: colors.text, fontSize: 12, fontWeight: '800' },
  memberRole: { color: colors.muted, fontSize: 11, marginTop: 1 },
  moreMembers: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 5 },
  noMembers: { color: colors.muted, fontSize: 12, textAlign: 'center', paddingVertical: 10 },
  modalRoot: { flex: 1, justifyContent: 'center', padding: 18 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  dialog: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 18 },
  dialogHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 18 },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  dialogSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 12, color: colors.text, fontSize: 14 },
  textarea: { minHeight: 92, paddingTop: 11 },
  counter: { color: colors.muted, fontSize: 10, textAlign: 'right', marginTop: 5 },
  dialogButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 18 },
  cancelButton: { height: 42, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  submitButton: { height: 42, minWidth: 100, paddingHorizontal: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 12, fontWeight: '900' },
});
