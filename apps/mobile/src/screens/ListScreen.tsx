import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon, type AppIconName } from '../components/AppIcon';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  subtitle: string;
  icon: AppIconName;
  items: string[];
  onItemPress?: (item: string, index: number) => void;
};

export function ListScreen({ title, subtitle, icon, items, onItemPress }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.card}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={`${item}-${index}`}
            style={[styles.row, index === items.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={onItemPress ? 0.7 : 1}
            onPress={() => onItemPress?.(item, index)}
          >
            <View style={styles.icon}><AppIcon name={icon} size={20} color={colors.primary} /></View>
            <Text style={styles.rowText}>{item}</Text>
            <AppIcon name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 110 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 6, marginBottom: 18 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
});
