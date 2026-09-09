import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../components/AppIcon';
import { StatCard } from '../components/StatCard';
import { colors } from '../theme/colors';
import { loadDashboard, type DashboardData } from '../data/dashboardRepository';

const empty: DashboardData = { openWork: 0, overdue: 0, pmToday: 0, stoppedEquipment: 0, attention: [] };

export function HomeScreen({ messages }: { messages: any }) {
  const [data, setData] = useState<DashboardData>(empty);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try { setData(await loadDashboard()); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void load(); }, []);

  return (
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{messages.appName}</Text>
          <Text style={styles.title}>{messages.home.title}</Text>
          <Text style={styles.subtitle}>{messages.home.subtitle}</Text>
          <View style={styles.live}><View style={styles.dot} /><Text style={styles.liveText}>DATABASE · LIVE</Text></View>
        </View>
        <View style={styles.avatar}><AppIcon name="person" size={22} color={colors.primary} /></View>
      </View>

      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Đang tải dữ liệu...</Text></View> : <>
        <View style={styles.grid}>
          <StatCard label={messages.home.openWork} value={String(data.openWork)} note={messages.home.openWorkNote} />
          <StatCard label={messages.home.overdue} value={String(data.overdue)} note={messages.home.overdueNote} />
          <StatCard label={messages.home.pmToday} value={String(data.pmToday)} note={messages.home.pmTodayNote} />
          <StatCard label={messages.home.stoppedEquipment} value={String(data.stoppedEquipment)} note={messages.home.stoppedEquipmentNote} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{messages.home.attention}</Text>
          {data.attention.map((item) => (
            <View key={item.code} style={styles.row}>
              <View style={styles.rowIcon}><AppIcon name="construct-outline" size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{item.code} · {item.title}</Text><Text style={styles.rowSub}>{item.asset}</Text></View>
              <AppIcon name="chevron-forward" size={20} color={colors.muted} />
            </View>
          ))}
          {data.attention.length === 0 ? <Text style={styles.empty}>Không có công việc cần chú ý.</Text> : null}
        </View>
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 110, gap: 18 }, header: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }, title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 6 }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 420 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, live: { alignSelf: 'flex-start', marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }, liveText: { fontSize: 9, color: colors.success, fontWeight: '900' }, loading: { paddingVertical: 60, alignItems: 'center', gap: 10 }, loadingText: { color: colors.muted, fontSize: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, section: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border }, rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' }, rowSub: { color: colors.muted, fontSize: 12, marginTop: 4 }, empty: { color: colors.muted, fontSize: 13, padding: 16 },
});
