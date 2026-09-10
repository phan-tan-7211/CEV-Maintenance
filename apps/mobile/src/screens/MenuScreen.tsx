import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type MenuCopy = {
  title: string;
  subtitle: string;
  catalog: string;
  catalogNote: string;
  maintenance: string;
  maintenanceNote: string;
  settings: string;
  settingsNote: string;
  account: string;
  accountNote: string;
  signOut: string;
};

type Props = {
  copy: MenuCopy;
  email?: string | null;
  onCatalog: () => void;
  onMaintenance: () => void;
  onSettings: () => void;
  onAccount: () => void;
  onSignOut: () => void;
};

export function MenuScreen({ copy, email, onCatalog, onMaintenance, onSettings, onAccount, onSignOut }: Props) {
  const rows = [
    { key: 'catalog', title: copy.catalog, note: copy.catalogNote, icon: 'grid-outline' as const, onPress: onCatalog },
    { key: 'maintenance', title: copy.maintenance, note: copy.maintenanceNote, icon: 'calendar-outline' as const, onPress: onMaintenance },
    { key: 'settings', title: copy.settings, note: copy.settingsNote, icon: 'settings-outline' as const, onPress: onSettings },
    { key: 'account', title: copy.account, note: email || copy.accountNote, icon: 'person-outline' as const, onPress: onAccount },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <View style={styles.list}>
        {rows.map((row) => (
          <TouchableOpacity key={row.key} style={styles.row} activeOpacity={0.72} onPress={row.onPress}>
            <View style={styles.iconWrap}><Ionicons name={row.icon} size={21} color={colors.primary} /></View>
            <View style={styles.textWrap}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowNote}>{row.note}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOut} activeOpacity={0.72} onPress={onSignOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>{copy.signOut}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 110 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  list: { marginTop: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' },
  row: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  rowNote: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  signOut: { marginTop: 14, minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signOutText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
});
