import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { CatalogHubKey, CatalogKey } from '../data/masterData';

type Props = {
  messages: any;
  onMasterPress?: (key: CatalogKey, title: string) => void;
  onHubPress?: (key: CatalogHubKey, title: string) => void;
};

export function CatalogScreen({ messages, onMasterPress, onHubPress }: Props) {
  const groups: { key: CatalogKey | CatalogHubKey; kind: 'master' | 'hub'; icon: keyof typeof Ionicons.glyphMap; title: string; note: string }[] = [
    { key: 'assets', kind: 'master', icon: 'cube-outline', title: messages.catalog.assets, note: messages.catalog.assetsNote },
    { key: 'assetTypes', kind: 'master', icon: 'git-branch-outline', title: messages.catalog.assetTypes, note: messages.catalog.assetTypesNote },
    { key: 'locations', kind: 'master', icon: 'location-outline', title: messages.catalog.locations, note: messages.catalog.locationsNote },
    { key: 'inventory', kind: 'hub', icon: 'layers-outline', title: messages.catalog.inventory, note: messages.catalog.inventoryNote },
    { key: 'meters', kind: 'master', icon: 'speedometer-outline', title: messages.catalog.meters, note: messages.catalog.metersNote },
    { key: 'people', kind: 'hub', icon: 'people-outline', title: messages.catalog.peopleGroups, note: messages.catalog.peopleGroupsNote },
    { key: 'partners', kind: 'hub', icon: 'business-outline', title: messages.catalog.partners, note: messages.catalog.partnersNote },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>CEV · IATF 16949</Text>
      <Text style={styles.title}>{messages.catalog.title}</Text>
      <Text style={styles.subtitle}>{messages.catalog.subtitle}</Text>

      <View style={styles.principle}>
        <Ionicons name="layers-outline" size={24} color={colors.primary} />
        <View style={{ flex: 1 }}><Text style={styles.principleTitle}>{messages.catalog.principleTitle}</Text><Text style={styles.principleText}>{messages.catalog.principleText}</Text></View>
      </View>

      <View style={styles.list}>
        {groups.map((item) => (
          <TouchableOpacity key={`${item.kind}-${item.key}`} style={styles.card} activeOpacity={0.7} onPress={() => item.kind === 'master' ? onMasterPress?.(item.key as CatalogKey, item.title) : onHubPress?.(item.key as CatalogHubKey, item.title)}>
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
  content: { padding: 20, paddingBottom: 110 }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', marginBottom: 6 }, title: { color: colors.text, fontSize: 28, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8 }, principle: { marginTop: 16, flexDirection: 'row', gap: 12, backgroundColor: colors.primarySoft, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }, principleTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, principleText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, list: { gap: 10, marginTop: 18 }, card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, iconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, cardBody: { flex: 1 }, cardTitle: { color: colors.text, fontSize: 15, fontWeight: '800' }, cardNote: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }, infoBox: { marginTop: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 }, infoTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' }, infoText: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
