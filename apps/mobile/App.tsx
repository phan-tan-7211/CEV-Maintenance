import { useMemo, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BackHeader } from './src/components/BackHeader';
import { colors } from './src/theme/colors';
import { getMessages, type Locale } from './src/i18n';

type Tab = 'home' | 'work' | 'catalog' | 'maintenance' | 'profile';
type ChildPage = { parent: Tab; title: string } | null;

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [childPage, setChildPage] = useState<ChildPage>(null);
  const [locale, setLocale] = useState<Locale>('vi');
  const messages = useMemo(() => getMessages(locale), [locale]);

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: messages.nav.home, icon: 'home-outline' },
    { key: 'work', label: messages.nav.work, icon: 'clipboard-outline' },
    { key: 'catalog', label: messages.nav.catalog, icon: 'grid-outline' },
    { key: 'maintenance', label: messages.nav.maintenance, icon: 'calendar-outline' },
    { key: 'profile', label: messages.nav.profile, icon: 'person-outline' },
  ];

  const openChild = (parent: Tab, title: string) => setChildPage({ parent, title });
  const goBack = () => setChildPage(null);

  const renderChild = () => {
    if (!childPage) return null;
    const parentLabel = tabs.find((item) => item.key === childPage.parent)?.label ?? messages.nav.home;
    if (childPage.parent === 'profile' && childPage.title === messages.profile.settings) {
      return (
        <View style={styles.child}>
          <BackHeader label={parentLabel} onPress={goBack} />
          <SettingsScreen locale={locale} onChangeLocale={setLocale} messages={messages} />
        </View>
      );
    }
    return (
      <View style={styles.child}>
        <BackHeader label={parentLabel} onPress={goBack} />
        <ListScreen title={childPage.title} subtitle={messages.common.childSubtitle} icon="document-text-outline" items={[]} />
      </View>
    );
  };

  const renderScreen = () => {
    if (childPage) return renderChild();
    if (tab === 'home') return <HomeScreen messages={messages} />;
    if (tab === 'work') {
      const items = [messages.work.repairRequest, messages.work.openOrders, messages.work.mine, messages.work.overdue, messages.work.completed];
      return <ListScreen title={messages.work.title} subtitle={messages.work.subtitle} icon="clipboard-outline" items={items} onItemPress={(item) => openChild('work', item)} />;
    }
    if (tab === 'catalog') return <CatalogScreen messages={messages} onItemPress={(title: string) => openChild('catalog', title)} />;
    if (tab === 'maintenance') {
      const items = [messages.maintenance.today, messages.maintenance.thisWeek, messages.maintenance.upcoming, messages.maintenance.checklist, messages.maintenance.history];
      return <ListScreen title={messages.maintenance.title} subtitle={messages.maintenance.subtitle} icon="calendar-outline" items={items} onItemPress={(item) => openChild('maintenance', item)} />;
    }
    const items = [messages.profile.account, messages.profile.notifications, messages.profile.settings, messages.profile.logout];
    return <ListScreen title={messages.profile.title} subtitle={messages.profile.subtitle} icon="person-outline" items={items} onItemPress={(item, index) => { if (index !== 3) openChild('profile', item); }} />;
  };

  const changeTab = (nextTab: Tab) => {
    setChildPage(null);
    setTab(nextTab);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        <View style={styles.main}>{renderScreen()}</View>
        <View style={styles.nav}>
          {tabs.map((item) => {
            const active = item.key === tab;
            return (
              <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => changeTab(item.key)} activeOpacity={0.7}>
                <Ionicons name={active ? (item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : item.icon} size={22} color={active ? colors.primary : colors.muted} />
                <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 480 : undefined, alignSelf: 'center', backgroundColor: colors.background, borderLeftWidth: Platform.OS === 'web' ? 1 : 0, borderRightWidth: Platform.OS === 'web' ? 1 : 0, borderColor: colors.border },
  main: { flex: 1 },
  child: { flex: 1 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 78, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', paddingBottom: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 11, fontWeight: '600', color: colors.muted },
  navTextActive: { color: colors.primary, fontWeight: '800' },
});
