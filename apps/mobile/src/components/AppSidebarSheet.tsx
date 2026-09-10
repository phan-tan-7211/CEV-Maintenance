import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;
type MenuItem = { label: string; icon: IconName; onPress: () => void; danger?: boolean };
type Section = { label: string; items: MenuItem[] };

type Props = {
  visible: boolean;
  brand: string;
  email?: string | null;
  sectionLabels: { assets: string; operations: string; system: string };
  labels: {
    equipment: string; locations: string; inventory: string; parts: string;
    dashboard: string; workOrders: string; maintenance: string; dailyChecks: string; reports: string;
    teams: string; catalog: string; settings: string; account: string; signOut: string;
  };
  onClose: () => void;
  onEquipment: () => void;
  onLocations: () => void;
  onInventory: () => void;
  onParts: () => void;
  onDashboard: () => void;
  onWorkOrders: () => void;
  onMaintenance: () => void;
  onDailyChecks: () => void;
  onReports: () => void;
  onTeams: () => void;
  onCatalog: () => void;
  onSettings: () => void;
  onAccount: () => void;
  onSignOut: () => void;
};

export function AppSidebarSheet(props: Props) {
  const run = (fn: () => void) => { props.onClose(); fn(); };
  const sections: Section[] = [
    { label: props.sectionLabels.assets, items: [
      { label: props.labels.equipment, icon: 'cube-outline', onPress: props.onEquipment },
      { label: props.labels.locations, icon: 'location-outline', onPress: props.onLocations },
      { label: props.labels.inventory, icon: 'business-outline', onPress: props.onInventory },
      { label: props.labels.parts, icon: 'search-outline', onPress: props.onParts },
    ]},
    { label: props.sectionLabels.operations, items: [
      { label: props.labels.dashboard, icon: 'home-outline', onPress: props.onDashboard },
      { label: props.labels.workOrders, icon: 'clipboard-outline', onPress: props.onWorkOrders },
      { label: props.labels.maintenance, icon: 'calendar-outline', onPress: props.onMaintenance },
      { label: props.labels.dailyChecks, icon: 'checkbox-outline', onPress: props.onDailyChecks },
      { label: props.labels.reports, icon: 'bar-chart-outline', onPress: props.onReports },
    ]},
    { label: props.sectionLabels.system, items: [
      { label: props.labels.teams, icon: 'people-outline', onPress: props.onTeams },
      { label: props.labels.catalog, icon: 'grid-outline', onPress: props.onCatalog },
      { label: props.labels.settings, icon: 'settings-outline', onPress: props.onSettings },
      { label: props.labels.account, icon: 'person-outline', onPress: props.onAccount },
      { label: props.labels.signOut, icon: 'log-out-outline', onPress: props.onSignOut, danger: true },
    ]},
  ];

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={props.onClose} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logo}><Ionicons name="construct" size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brand}>{props.brand}</Text>
                {props.email ? <Text numberOfLines={1} style={styles.email}>{props.email}</Text> : null}
              </View>
            </View>
            <TouchableOpacity style={styles.close} onPress={props.onClose} accessibilityLabel="Close menu">
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {sections.map((section, sectionIndex) => (
              <View key={section.label} style={[styles.section, sectionIndex > 0 && styles.sectionBorder]}>
                <Text style={styles.sectionLabel}>{section.label}</Text>
                {section.items.map((item) => (
                  <TouchableOpacity key={item.label} style={styles.item} activeOpacity={0.7} onPress={() => run(item.onPress)}>
                    <Ionicons name={item.icon} size={19} color={item.danger ? colors.danger : colors.text} />
                    <Text style={[styles.itemText, item.danger && { color: colors.danger }]}>{item.label}</Text>
                    {!item.danger ? <Ionicons name="chevron-forward" size={16} color={colors.muted} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  scrim: { flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' },
  panel: {
    width: '86%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    paddingBottom: 68,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 16, fontWeight: '900', color: colors.text },
  email: { marginTop: 2, fontSize: 11, color: colors.muted },
  close: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 10, paddingBottom: 24 },
  section: { paddingVertical: 10 },
  sectionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  sectionLabel: { paddingHorizontal: 10, paddingVertical: 8, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, color: colors.muted },
  item: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, borderRadius: 10 },
  itemText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
});
