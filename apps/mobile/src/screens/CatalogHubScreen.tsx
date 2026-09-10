import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Locale } from '../i18n';
import type { CatalogHubKey, CatalogKey } from '../data/masterData';
import { InventoryWorkspaceScreen } from './InventoryWorkspaceScreen';

type Props = {
  hub: CatalogHubKey;
  title: string;
  messages: any;
  locale?: Locale;
  onBack: () => void;
  onMasterPress: (key: CatalogKey, title: string) => void;
  onSimplePress: (title: string) => void;
};

export function CatalogHubScreen({ hub, title, messages, locale, onBack, onMasterPress, onSimplePress }: Props) {
  if (hub === 'inventory') return <InventoryWorkspaceScreen messages={messages} locale={locale} onBack={onBack} />;

  const entries = hub === 'people'
    ? [
        { key: 'users', icon: 'person-outline', title: messages.catalogHub.users, note: messages.catalogHub.usersNote, master: false },
        { key: 'teams' as CatalogKey, icon: 'people-outline', title: messages.catalogHub.teams, note: messages.catalogHub.teamsNote, master: true },
      ]
    : [
        { key: 'suppliers' as CatalogKey, icon: 'construct-outline', title: messages.catalogHub.suppliers, note: messages.catalogHub.suppliersNote, master: true },
        { key: 'customers' as CatalogKey, icon: 'briefcase-outline', title: messages.catalogHub.customers, note: messages.catalogHub.customersNote, master: true },
      ];

  return (
    <View style={styles.page}>
      <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /><Text style={styles.backText}>{messages.nav.catalog}</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{messages.catalogHub.subtitle}</Text>
        <View style={styles.list}>{entries.map((entry) => (
          <TouchableOpacity key={String(entry.key)} style={styles.card} activeOpacity={0.72} onPress={() => entry.master ? onMasterPress(entry.key as CatalogKey, entry.title) : onSimplePress(entry.title)}>
            <View style={styles.icon}><Ionicons name={entry.icon as any} size={21} color={colors.primary} /></View>
            <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{entry.title}</Text><Text style={styles.cardNote}>{entry.note}</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { minHeight: 54, paddingHorizontal: 12, justifyContent: 'center' }, back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }, backText: { color: colors.text, fontSize: 14, fontWeight: '700' }, content: { padding: 18, paddingTop: 4, paddingBottom: 110 }, title: { color: colors.text, fontSize: 26, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }, list: { gap: 10, marginTop: 18 }, card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, cardTitle: { color: colors.text, fontSize: 15, fontWeight: '800' }, cardNote: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
});
