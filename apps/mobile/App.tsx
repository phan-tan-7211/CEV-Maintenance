import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { CatalogHubScreen } from './src/screens/CatalogHubScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { MasterListScreen } from './src/screens/MasterListScreen';
import { RecordDetailScreen } from './src/screens/RecordDetailScreen';
import { RecordFormScreen } from './src/screens/RecordFormScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { WorkOrderListScreen } from './src/screens/WorkOrderListScreen';
import { MaintenanceListScreen } from './src/screens/MaintenanceListScreen';
import { BackHeader } from './src/components/BackHeader';
import { colors } from './src/theme/colors';
import { getMessages, type Locale } from './src/i18n';
import { supabase } from './src/lib/supabase';
import type { CatalogHubKey, CatalogKey, MasterRecord } from './src/data/masterData';
import type { WorkFilter } from './src/data/workOrderRepository';
import type { MaintenanceFilter } from './src/data/maintenanceRepository';

type Tab = 'home' | 'work' | 'catalog' | 'maintenance' | 'profile';
type Route =
  | { kind: 'simple'; parent: Tab; title: string }
  | { kind: 'settings' }
  | { kind: 'work'; title: string; filter: WorkFilter }
  | { kind: 'maintenance'; title: string; filter: MaintenanceFilter }
  | { kind: 'catalogHub'; hub: CatalogHubKey; title: string }
  | { kind: 'master'; category: CatalogKey; title: string }
  | { kind: 'detail'; category: CatalogKey; title: string; record: MasterRecord }
  | { kind: 'form'; category: CatalogKey; title: string; record?: MasterRecord }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [route, setRoute] = useState<Route>(null);
  const [locale, setLocale] = useState<Locale>('vi');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const messages = useMemo(() => getMessages(locale), [locale]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthLoading(false); if (!nextSession) { setRoute(null); setTab('home'); } });
    return () => listener.subscription.unsubscribe();
  }, []);

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: messages.nav.home, icon: 'home-outline' },
    { key: 'work', label: messages.nav.work, icon: 'clipboard-outline' },
    { key: 'catalog', label: messages.nav.catalog, icon: 'grid-outline' },
    { key: 'maintenance', label: messages.nav.maintenance, icon: 'calendar-outline' },
    { key: 'profile', label: messages.nav.profile, icon: 'person-outline' },
  ];

  if (authLoading) return <SafeAreaView style={styles.authPage}><StatusBar style="dark" /><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>;
  if (!session) return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.shell}><AuthScreen locale={locale} onChangeLocale={setLocale} /></View></SafeAreaView>;

  const openMaster = (category: CatalogKey, title: string) => setRoute({ kind: 'master', category, title });

  const renderRoute = () => {
    if (!route) return null;
    if (route.kind === 'settings') return <View style={styles.child}><BackHeader label={messages.nav.profile} onPress={() => setRoute(null)} /><SettingsScreen locale={locale} onChangeLocale={setLocale} messages={messages} /></View>;
    if (route.kind === 'work') return <WorkOrderListScreen title={route.title} filter={route.filter} messages={messages} onBack={() => setRoute(null)} />;
    if (route.kind === 'maintenance') return <MaintenanceListScreen title={route.title} filter={route.filter} messages={messages} onBack={() => setRoute(null)} />;
    if (route.kind === 'catalogHub') return <CatalogHubScreen hub={route.hub} title={route.title} messages={messages} onBack={() => setRoute(null)} onMasterPress={openMaster} onSimplePress={(title) => setRoute({ kind: 'simple', parent: 'catalog', title })} />;
    if (route.kind === 'master') return <MasterListScreen category={route.category} title={route.title} messages={messages} onBack={() => setRoute(null)} onOpenRecord={(record) => setRoute({ kind: 'detail', category: route.category, title: route.title, record })} onCreate={() => setRoute({ kind: 'form', category: route.category, title: route.title })} />;
    if (route.kind === 'detail') return <RecordDetailScreen category={route.category} title={route.title} record={route.record} messages={messages} onBack={() => setRoute({ kind: 'master', category: route.category, title: route.title })} onEdit={() => setRoute({ kind: 'form', category: route.category, title: route.title, record: route.record })} />;
    if (route.kind === 'form') return <RecordFormScreen category={route.category} title={route.title} record={route.record} messages={messages} onBack={() => route.record ? setRoute({ kind: 'detail', category: route.category, title: route.title, record: route.record }) : setRoute({ kind: 'master', category: route.category, title: route.title })} onSaved={(record) => setRoute({ kind: 'detail', category: route.category, title: route.title, record })} />;
    const parentLabel = tabs.find((item) => item.key === route.parent)?.label ?? messages.nav.home;
    return <View style={styles.child}><BackHeader label={parentLabel} onPress={() => setRoute(null)} /><ListScreen title={route.title} subtitle={messages.common.childSubtitle} icon="document-text-outline" items={[]} /></View>;
  };

  const renderRoot = () => {
    if (tab === 'home') return <HomeScreen messages={messages} />;
    if (tab === 'work') {
      const items = [messages.work.repairRequest, messages.work.openOrders, messages.work.mine, messages.work.overdue, messages.work.completed];
      const filters: WorkFilter[] = ['repair','open','mine','overdue','completed'];
      return <ListScreen title={messages.work.title} subtitle={messages.work.subtitle} icon="clipboard-outline" items={items} onItemPress={(item, index) => setRoute({ kind: 'work', title: item, filter: filters[index] })} />;
    }
    if (tab === 'catalog') return <CatalogScreen messages={messages} onMasterPress={openMaster} onHubPress={(hub, title) => setRoute({ kind: 'catalogHub', hub, title })} />;
    if (tab === 'maintenance') {
      const items = [messages.maintenance.today, messages.maintenance.thisWeek, messages.maintenance.upcoming, messages.maintenance.checklist, messages.maintenance.history];
      return <ListScreen title={messages.maintenance.title} subtitle={messages.maintenance.subtitle} icon="calendar-outline" items={items} onItemPress={(item, index) => {
        if (index === 3) setRoute({ kind: 'simple', parent: 'maintenance', title: item });
        else setRoute({ kind: 'maintenance', title: item, filter: (['today','week','upcoming','upcoming','history'] as MaintenanceFilter[])[index] });
      }} />;
    }
    const items = [messages.profile.account, messages.profile.notifications, messages.profile.settings, messages.profile.logout];
    return <ListScreen title={messages.profile.title} subtitle={`${messages.profile.subtitle}\n${session.user.email ?? ''}`} icon="person-outline" items={items} onItemPress={async (item, index) => {
      if (index === 2) setRoute({ kind: 'settings' });
      else if (index === 3) await supabase.auth.signOut();
      else setRoute({ kind: 'simple', parent: 'profile', title: item });
    }} />;
  };

  const changeTab = (nextTab: Tab) => { setRoute(null); setTab(nextTab); };

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.shell}><View style={styles.main}>{route ? renderRoute() : renderRoot()}</View><View style={styles.nav}>{tabs.map((item) => { const active = item.key === tab; return <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => changeTab(item.key)} activeOpacity={0.7}><Ionicons name={active ? (item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : item.icon} size={22} color={active ? colors.primary : colors.muted} /><Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text></TouchableOpacity>; })}</View></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, authPage: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, shell: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 480 : undefined, alignSelf: 'center', backgroundColor: colors.background, borderLeftWidth: Platform.OS === 'web' ? 1 : 0, borderRightWidth: Platform.OS === 'web' ? 1 : 0, borderColor: colors.border }, main: { flex: 1 }, child: { flex: 1 }, nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 78, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', paddingBottom: 8 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, navText: { fontSize: 11, fontWeight: '600', color: colors.muted }, navTextActive: { color: colors.primary, fontWeight: '800' } });
