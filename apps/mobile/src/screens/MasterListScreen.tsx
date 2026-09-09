import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { CatalogKey, MasterRecord } from '../data/masterData';
import { listMasterRecords } from '../data/masterRepository';

type Props = {
  category: CatalogKey;
  title: string;
  messages: any;
  onBack: () => void;
  onOpenRecord: (record: MasterRecord) => void;
  onCreate: () => void;
};

export function MasterListScreen({ category, title, messages, onBack, onOpenRecord, onCreate }: Props) {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try { setRecords(await listMasterRecords(category)); }
    catch (error: any) { Alert.alert(messages.common.loadError ?? 'Không thể tải dữ liệu', error?.message ?? String(error)); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void load(); }, [category]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => `${r.code} ${r.name} ${r.secondary} ${r.location ?? ''}`.toLowerCase().includes(q));
  }, [records, query]);

  const statusLabel = (status: MasterRecord['status']) => {
    if (status === 'active') return messages.common.active;
    if (status === 'warning') return messages.common.warning;
    return messages.common.inactive;
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /><Text style={styles.backText}>{messages.nav.catalog}</Text></TouchableOpacity>
        <TouchableOpacity onPress={onCreate} style={styles.add}><Ionicons name="add" size={22} color="#fff" /><Text style={styles.addText}>{messages.common.add}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{messages.common.masterListSubtitle}</Text>
        <View style={styles.live}><View style={styles.dot} /><Text style={styles.liveText}>Supabase · LIVE DATA</Text></View>
        <View style={styles.search}><Ionicons name="search-outline" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={messages.common.search} placeholderTextColor={colors.muted} style={styles.input} /></View>
        <View style={styles.summary}><Text style={styles.summaryText}>{messages.common.total}: {rows.length}</Text><Text style={styles.summaryText}>{messages.common.tapForDetail}</Text></View>
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.emptyText}>{messages.common.loading ?? 'Đang tải dữ liệu...'}</Text></View> : null}
        {!loading ? <View style={styles.list}>
          {rows.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.72} onPress={() => onOpenRecord(item)}>
              <View style={styles.iconWrap}><Ionicons name="cube-outline" size={21} color={colors.primary} /></View>
              <View style={styles.body}>
                <View style={styles.codeRow}><Text style={styles.code}>{item.code}</Text><View style={[styles.status, item.status === 'warning' && styles.statusWarn]}><Text style={[styles.statusText, item.status === 'warning' && styles.statusWarnText]}>{statusLabel(item.status)}</Text></View></View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.secondary}{item.location ? ` · ${item.location}` : ''}</Text>
                {item.nextDue ? <Text style={styles.due}>{messages.common.nextDue}: {item.nextDue}</Text> : null}
                {typeof item.quantity === 'number' ? <Text style={styles.due}>{messages.common.stock}: {item.quantity} {item.unit}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>
          ))}
          {rows.length === 0 ? <View style={styles.empty}><Ionicons name="search-outline" size={30} color={colors.muted} /><Text style={styles.emptyText}>{messages.common.noResults}</Text></View> : null}
        </View> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { minHeight: 54, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingRight: 10 }, backText: { fontSize: 14, fontWeight: '700', color: colors.text }, add: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primary, paddingHorizontal: 12, height: 38, borderRadius: 12 }, addText: { color: '#fff', fontWeight: '800', fontSize: 13 }, content: { padding: 18, paddingTop: 4, paddingBottom: 110 }, title: { fontSize: 26, fontWeight: '800', color: colors.text }, subtitle: { marginTop: 6, color: colors.muted, fontSize: 13, lineHeight: 19 }, live: { alignSelf: 'flex-start', marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF3', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, liveText: { color: colors.success, fontSize: 10, fontWeight: '900' }, search: { marginTop: 14, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 }, input: { flex: 1, color: colors.text, fontSize: 14 }, summary: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }, summaryText: { color: colors.muted, fontSize: 12, fontWeight: '600' }, list: { gap: 10, marginTop: 12 }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, body: { flex: 1 }, codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, code: { color: colors.primary, fontSize: 12, fontWeight: '900' }, status: { backgroundColor: '#ECFDF3', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }, statusWarn: { backgroundColor: '#FFF7ED' }, statusText: { color: colors.success, fontSize: 10, fontWeight: '800' }, statusWarnText: { color: colors.warning }, name: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 4 }, meta: { color: colors.muted, fontSize: 12, marginTop: 3 }, due: { color: colors.muted, fontSize: 11, marginTop: 4 }, empty: { alignItems: 'center', paddingVertical: 40, gap: 10 }, loading: { alignItems: 'center', paddingVertical: 42, gap: 10 }, emptyText: { color: colors.muted, fontSize: 13 },
});
