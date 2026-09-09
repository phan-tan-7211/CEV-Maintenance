import { useMemo, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';
import { getMessages, type Locale } from './src/i18n';

type Tab = 'home' | 'work' | 'catalog' | 'maintenance' | 'profile';
type ProfilePage = 'menu' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [profilePage, setProfilePage] = useState<ProfilePage>('menu');
  const [locale, setLocale] = useState<Locale>('vi');
  const messages = useMemo(() => getMessages(locale), [locale]);

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: messages.nav.home, icon: 'home-outline' },
    { key: 'work', label: messages.nav.work, icon: 'clipboard-outline' },
    { key: 'catalog', label: messages.nav.catalog, icon: 'grid-outline' },
    { key: 'maintenance', label: messages.nav.maintenance, icon: 'calendar-outline' },
    { key: 'profile', label: messages.nav.profile, icon: 'person-outline' },
  ];

  const renderScreen = () => {
    if (tab === 'home') return <HomeScreen messages={messages} />;
    if (tab === 'work') {
      return (
        <ListScreen
          title={messages.work.title}
          subtitle={messages.work.subtitle}
          icon="clipboard-outline"
          items={[messages.work.repairRequest, messages.work.openOrders, messages.work.mine, messages.work.overdue, messages.work.completed]}
        />
      );
    }
    if (tab === 'catalog') return <CatalogScreen messages={messages} />;
    if (tab === 'maintenance') {
      return (
        <ListScreen
          title={messages.maintenance.title}
          subtitle={messages.maintenance.subtitle}
          icon="calendar-outline"
          items={[messages.maintenance.today, messages.maintenance.thisWeek, messages.maintenance.upcoming, messages.maintenance.checklist, messages.maintenance.history]}
        />
      );
    }
    if (profilePage === 'settings') {
      return <SettingsScreen locale={locale} onChangeLocale={setLocale} messages={messages} />;
    }
    return (
      <ListScreen
        title={messages.profile.title}
        subtitle={messages.profile.subtitle}
        icon="person-outline"
        items={[messages.profile.account, messages.profile.notifications, messages.profile.settings, messages.profile.logout]}
        onItemPress={(_, index) => {
          if (index === 2) setProfilePage('settings');
        }}
      />
    );
  };

  const changeTab = (nextTab: Tab) => {
    setTab(nextTab);
    if (nextTab !== 'profile') setProfilePage('menu');
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
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 78, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', paddingBottom: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 11, fontWeight: '600', color: colors.muted },
  navTextActive: { color: colors.primary, fontWeight: '800' },
});
