import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = { label: string; value: string; note?: string };

export function StatCard({ label, value, note }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  value: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 8 },
  note: { color: colors.muted, fontSize: 12, marginTop: 6 },
});
