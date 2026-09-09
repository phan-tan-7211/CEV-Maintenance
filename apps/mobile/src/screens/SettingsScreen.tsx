import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Locale } from '../i18n';

interface Props {
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  messages: any;
}

export function SettingsScreen({ locale, onChangeLocale, messages }: Props) {
  const options = [
    { key: 'vi' as const, label: messages.settings.vietnamese, code: 'VI' },
    { key: 'en' as const, label: messages.settings.english, code: 'EN' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{messages.settings.title}</Text>
      <Text style={styles.subtitle}>{messages.settings.subtitle}</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconWrap}><Ionicons name="language-outline" size={22} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{messages.settings.language}</Text>
            <Text style={styles.sectionSubtitle}>{messages.settings.languageDescription}</Text>
          </View>
        </View>

        {options.map((item, index) => {
          const active = locale === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.option, index === options.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => onChangeLocale(item.key)}
            >
              <View style={styles.codeBadge}><Text style={styles.codeText}>{item.code}</Text></View>
              <Text style={styles.optionText}>{item.label}</Text>
              <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.primary : colors.muted} />
            </TouchableOpacity>
          );
        })}

        <View style={[styles.option, { borderBottomWidth: 0, opacity: 0.55 }]}>
          <View style={styles.codeBadge}><Text style={styles.codeText}>KO</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionText}>{messages.settings.korean}</Text>
            <Text style={styles.comingSoon}>{messages.settings.comingSoon}</Text>
          </View>
          <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 110 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 6, marginBottom: 18 },
  section: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', gap: 12, padding: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  sectionSubtitle: { fontSize: 12, color: colors.muted, marginTop: 3 },
  option: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  codeBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  codeText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  optionText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  comingSoon: { color: colors.muted, fontSize: 11, marginTop: 2 },
});
