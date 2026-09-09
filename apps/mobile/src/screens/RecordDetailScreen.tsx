import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { MasterRecord } from '../data/masterData';

type Props = {
  title: string;
  record: MasterRecord;
  messages: any;
  onBack: () => void;
  onEdit: () => void;
};

export function RecordDetailScreen({ title, record, messages, onBack, onEdit }: Props) {
  const rows = [
    [messages.common.code, record.code],
    [messages.common.name, record.name],
    [messages.common.specification, record.secondary],
    [messages.common.location, record.location ?? '-'],
    [messages.common.nextDue, record.nextDue ?? '-'],
    [messages.common.stock, typeof record.quantity === 'number' ? `${record.quantity} ${record.unit ?? ''}` : '-'],
  ];

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /><Text style={styles.backText}>{title}</Text></TouchableOpacity>
        <TouchableOpacity onPress={onEdit} style={styles.edit}><Ionicons name="create-outline" size={20} color={colors.primary} /><Text style={styles.editText}>{messages.common.edit}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="cube-outline" size={30} color={colors.primary} /></View>
          <Text style={styles.code}>{record.code}</Text>
          <Text style={styles.name}>{record.name}</Text>
          <Text style={styles.secondary}>{record.secondary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{messages.common.basicInfo}</Text>
          {rows.map(([label, value], index) => (
            <View key={label} style={[styles.row, index === rows.length - 1 && styles.lastRow]}>
              <Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{messages.common.relatedManagement}</Text>
          {[
            [messages.common.history, 'time-outline'],
            [messages.common.maintenancePlan, 'calendar-outline'],
            [messages.common.workOrders, 'clipboard-outline'],
            [messages.common.documents, 'document-text-outline'],
          ].map(([label, icon]) => (
            <TouchableOpacity key={label} style={styles.actionRow} activeOpacity={0.7}>
              <Ionicons name={icon as any} size={20} color={colors.primary} /><Text style={styles.actionText}>{label}</Text><Ionicons name="chevron-forward" size={19} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { minHeight: 54, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { flexDirection: 'row', alignItems: 'center', flex: 1 }, backText: { color: colors.text, fontSize: 14, fontWeight: '700', maxWidth: 220 }, edit: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 38, paddingHorizontal: 12 }, editText: { color: colors.primary, fontWeight: '800', fontSize: 13 }, content: { padding: 18, paddingTop: 4, paddingBottom: 110 }, hero: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 22 }, heroIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, code: { color: colors.primary, fontSize: 12, fontWeight: '900', marginTop: 12 }, name: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 4 }, secondary: { color: colors.muted, fontSize: 13, marginTop: 5 }, section: { marginTop: 14, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border }, lastRow: { borderBottomWidth: 0 }, label: { color: colors.muted, fontSize: 13 }, value: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1 }, actionRow: { minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, actionText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
});
