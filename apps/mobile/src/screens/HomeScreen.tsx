import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatCard } from '../components/StatCard';
import { colors } from '../theme/colors';

export function HomeScreen({ messages }: { messages: any }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CEV MAINTENANCE</Text>
          <Text style={styles.title}>{messages.home.title}</Text>
          <Text style={styles.subtitle}>{messages.home.subtitle}</Text>
        </View>
        <View style={styles.avatar}><Ionicons name="person" size={22} color={colors.primary} /></View>
      </View>

      <View style={styles.grid}>
        <StatCard label={messages.home.openWork} value="12" note={messages.home.openWorkNote} />
        <StatCard label={messages.home.overdue} value="2" note={messages.home.overdueNote} />
        <StatCard label={messages.home.pmToday} value="5" note={messages.home.pmTodayNote} />
        <StatCard label={messages.home.stoppedEquipment} value="1" note={messages.home.stoppedEquipmentNote} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{messages.home.attention}</Text>
        {[
          ['WO-1028', messages.home.task1, messages.home.asset1],
          ['WO-1027', messages.home.task2, messages.home.asset2],
          ['WO-1026', messages.home.task3, messages.home.asset3],
        ].map(([code, title, asset]) => (
          <View key={code} style={styles.row}>
            <View style={styles.rowIcon}><Ionicons name="construct-outline" size={20} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{code} · {title}</Text>
              <Text style={styles.rowSub}>{asset}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 110, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 420 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
