import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { CatalogKey } from '../data/masterData';

export function CatalogScreen({ messages, onItemPress }: { messages: any; onItemPress?: (key: CatalogKey, title: string) => void }) {
  const groups: { key: CatalogKey; icon: keyof typeof Ionicons.glyphMap; title: string; note: string }[] = [
    { key: 'assets', icon: 'construct-outline', title: messages.catalog.assets, note: messages.catalog.assetsNote },
    { key: 'utilities', icon: 'flash-outline', title: messages.catalog.utilities, note: messages.catalog.utilitiesNote },
    { key: 'tooling', icon: 'hammer-outline', title: messages.catalog.tooling, note: messages.catalog.toolingNote },
    { key: 'measuring', icon: 'speedometer-outline', title: messages.catalog.measuring, note: messages.catalog.measuringNote },
    { key: 'spareParts', icon: 'settings-outline', title: messages.catalog.spareParts, note: messages.catalog.sparePartsNote },
    { key: 'consumables', icon: 'flask-outline', title: messages.catalog.consumables, note: messages.catalog.consumablesNote },
    { key: 'safety', icon: 'shield-checkmark-outline', title: messages.catalog.safety, note: messages.catalog.safetyNote },
    { key: 'suppliers', icon: 'business-outline', title: messages.catalog.suppliers, note: messages.catalog.suppliersNote },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>IATF 16949</Text>
      <Text style={styles.title}>{messages.catalog.title}</Text>
      <Text style={styles.subtitle}>{messages.catalog.subtitle}</Text>
      <View style={styles.list}>
        {groups.map((item) => (
          <TouchableOpacity key={item.key} style={styles.card} activeOpacity={0.7} onPress={() => onItemPress?.(item.key, item.title)}>
            <View style={styles.iconWrap}><Ionicons name={item.icon} size={22} color={colors.primary} /></View>
            <View style={styles.cardBody}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardNote}>{item.note}</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.infoBox}><Text style={styles.infoTitle}>{messages.catalog.commonProcesses}</Text><Text style={styles.infoText}>{messages.catalog.commonProcessesText}</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110 }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', marginBottom: 6 }, title: { color: colors.text, fontSize: 28, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8 }, list: { gap: 10, marginTop: 22 }, card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, iconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, cardBody: { flex: 1 }, cardTitle: { color: colors.text, fontSize: 15, fontWeight: '800' }, cardNote: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }, infoBox: { marginTop: 18, backgroundColor: colors.primarySoft, borderRadius: 16, padding: 16 }, infoTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' }, infoText: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
