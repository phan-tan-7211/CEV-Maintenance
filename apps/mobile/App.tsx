import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { CatalogHubScreen } from './src/screens/CatalogHubScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { MasterListScreen } from './src/screens/MasterListScreen';
import { AssetListScreen } from './src/screens/AssetListScreen';
import { AssetFormScreen } from './src/screens/AssetFormScreen';
import { AssetDetailScreen } from './src/screens/AssetDetailScreen';
import { AssetCatalogAdminScreen } from './src/screens/AssetCatalogAdminScreen';
import { InventoryWorkspaceScreen } from './src/screens/InventoryWorkspaceScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { TeamsScreen } from './src/screens/TeamsScreen';
import { RecordDetailScreen } from './src/screens/RecordDetailScreen';
import { RecordFormScreen } from './src/screens/RecordFormScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { WorkOrderListScreen } from './src/screens/WorkOrderListScreen';
import { MaintenanceListScreen } from './src/screens/MaintenanceListScreen';
import { BackHeader } from './src/components/BackHeader';
import { AppTopBar } from './src/components/AppTopBar';
import { AppSidebarSheet } from './src/components/AppSidebarSheet';
import { colors } from './src/theme/colors';
import { getMessages, type Locale } from './src/i18n';
import { getAppUi } from './src/i18n/appUi';
import { supabase } from './src/lib/supabase';
import { syncPendingEvents } from './src/offline/syncEngine';
import type { QrTarget } from './src/data/qrRepository';
import type { CatalogHubKey, CatalogKey, MasterRecord } from './src/data/masterData';
import type { WorkFilter } from './src/data/workOrderRepository';
import type { MaintenanceFilter } from './src/data/maintenanceRepository';

type Tab = 'home' | 'work' | 'catalog' | 'maintenance' | 'profile';
type Route =
  | { kind: 'simple'; parent: Tab; title: string }
  | { kind: 'settings' }
  | { kind: 'scan' }
  | { kind: 'assetCatalogAdmin' }
  | { kind: 'inventory' }
  | { kind: 'work'; title: string; filter: WorkFilter }
  | { kind: 'maintenance'; title: string; filter: MaintenanceFilter }
  | { kind: 'catalogHub'; hub: CatalogHubKey; title: string }
  | { kind: 'teams' }
  | { kind: 'master'; category: CatalogKey; title: string }
  | { kind: 'assetCreate' }
  | { kind: 'detail'; category: CatalogKey; title: string; record: MasterRecord }
  | { kind: 'form'; category: CatalogKey; title: string; record?: MasterRecord }
  | null;

type BottomNavKey = 'dashboard' | 'scan' | 'equipment' | 'inventory' | 'orders' | 'menu';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [route, setRoute] = useState<Route>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>('vi');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const messages = useMemo(() => getMessages(locale), [locale]);
  const ui = useMemo(() => getAppUi(locale), [locale]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession); setAuthLoading(false);
      if (!nextSession) { setRoute(null); setTab('home'); setSidebarOpen(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const syncNow = () => { void syncPendingEvents(); };
    syncNow();
    const appStateSub = AppState.addEventListener('change', (state) => { if (state === 'active') syncNow(); });
    const timer = setInterval(syncNow, 30_000);
    return () => { appStateSub.remove(); clearInterval(timer); };
  }, [session?.user.id]);

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: messages.nav.home, icon: 'home-outline' },
    { key: 'work', label: messages.nav.work, icon: 'clipboard-outline' },
    { key: 'catalog', label: messages.nav.catalog, icon: 'grid-outline' },
    { key: 'maintenance', label: messages.nav.maintenance, icon: 'calendar-outline' },
    { key: 'profile', label: ui.bottom.menu, icon: 'menu-outline' },
  ];

  if (authLoading) return <SafeAreaView style={styles.authPage}><StatusBar style="dark" /><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>;
  if (!session) return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.shell}><AuthScreen locale={locale} onChangeLocale={setLocale} /></View></SafeAreaView>;

  const openMaster = (category: CatalogKey, title: string) => {
    if (category === 'teams') return setRoute({ kind: 'teams' });
    setRoute({ kind: 'master', category, title });
  };
  const changeTab = (nextTab: Tab) => { setRoute(null); setTab(nextTab); };
  const openScanTarget = (target: QrTarget) => {
    if (target.kind === 'asset') {
      setTab('catalog');
      setRoute({ kind: 'detail', category: 'assets', title: messages.catalog.assets, record: { id: target.id, code: target.code, name: target.name, secondary: target.status ?? '-', status: target.status } });
      return;
    }
    if (target.kind === 'work_order') {
      setTab('work');
      setRoute({ kind: 'work', title: target.title, filter: target.status === 'completed' ? 'completed' : 'open' });
      return;
    }
    setTab('catalog');
    setRoute({ kind: 'inventory' });
  };

  const renderRoute = () => {
    if (!route) return null;
    if (route.kind === 'settings') return <View style={styles.child}><BackHeader label={ui.bottom.menu} onPress={() => setRoute(null)} /><SettingsScreen locale={locale} onChangeLocale={setLocale} messages={messages} /></View>;
    if (route.kind === 'scan') return <ScanScreen locale={locale} onOpenTarget={openScanTarget} onReportIssue={() => { setTab('work'); setRoute({ kind: 'work', title: messages.work.repairRequest, filter: 'repair' }); }} onCreateWorkOrder={() => { setTab('work'); setRoute({ kind: 'work', title: messages.work.repairRequest, filter: 'repair' }); }} />;
    if (route.kind === 'assetCatalogAdmin') return <AssetCatalogAdminScreen locale={locale} onBack={() => setRoute(null)} />;
    if (route.kind === 'inventory') return <InventoryWorkspaceScreen messages={messages} locale={locale} onBack={() => setRoute(null)} />;
    if (route.kind === 'work') return <WorkOrderListScreen title={route.title} filter={route.filter} messages={messages} locale={locale} onBack={() => setRoute(null)} />;
    if (route.kind === 'maintenance') return <MaintenanceListScreen title={route.title} filter={route.filter} messages={messages} locale={locale} onBack={() => setRoute(null)} />;
    if (route.kind === 'catalogHub') return <CatalogHubScreen hub={route.hub} title={route.title} messages={messages} onBack={() => setRoute(null)} onMasterPress={openMaster} onSimplePress={(title) => setRoute({ kind: 'simple', parent: 'catalog', title })} />;

    if (route.kind === 'teams') return <TeamsScreen onBack={() => setRoute({ kind: 'catalogHub', hub: 'people', title: messages.catalog.peopleGroups })} onOpenTeam={(team) => setRoute({ kind: 'detail', category: 'teams', title: messages.catalogHub.teams, record: { id: team.id, code: team.code, name: team.name, secondary: team.description ?? '-', specification: team.description, status: team.active ? 'active' : 'inactive' } })} />;

    if (route.kind === 'master' && route.category === 'assets') return <AssetListScreen messages={messages} locale={locale} onBack={() => setRoute(null)} onOpenRecord={(record) => setRoute({ kind: 'detail', category: 'assets', title: route.title, record })} onCreateAsset={() => setRoute({ kind: 'assetCreate' })} />;
    if (route.kind === 'assetCreate') return <AssetFormScreen messages={messages} locale={locale} onBack={() => setRoute({ kind: 'master', category: 'assets', title: messages.catalog.assets })} onSaved={(record) => setRoute({ kind: 'detail', category: 'assets', title: messages.catalog.assets, record })} />;

    if (route.kind === 'detail' && route.category === 'assets') return <AssetDetailScreen record={route.record} locale={locale} onBack={() => setRoute({ kind: 'master', category: 'assets', title: route.title })} onEdit={() => setRoute({ kind: 'form', category: 'assets', title: route.title, record: route.record })} onCreateWork={() => { setTab('work'); setRoute({ kind: 'work', title: messages.work.repairRequest, filter: 'repair' }); }} />;
    if (route.kind === 'form' && route.category === 'assets') return <AssetFormScreen messages={messages} locale={locale} record={route.record} onBack={() => route.record ? setRoute({ kind: 'detail', category: 'assets', title: route.title, record: route.record }) : setRoute({ kind: 'master', category: 'assets', title: route.title })} onSaved={(record) => setRoute({ kind: 'detail', category: 'assets', title: route.title, record })} />;

    if (route.kind === 'master') return <MasterListScreen category={route.category} title={route.title} messages={messages} onBack={() => setRoute(null)} onOpenRecord={(record) => setRoute({ kind: 'detail', category: route.category, title: route.title, record })} onCreate={() => setRoute({ kind: 'form', category: route.category, title: route.title })} />;
    if (route.kind === 'detail') return <RecordDetailScreen category={route.category} title={route.title} record={route.record} messages={messages} onBack={() => route.category === 'teams' ? setRoute({ kind: 'teams' }) : setRoute({ kind: 'master', category: route.category, title: route.title })} onEdit={() => setRoute({ kind: 'form', category: route.category, title: route.title, record: route.record })} />;
    if (route.kind === 'form') return <RecordFormScreen category={route.category} title={route.title} record={route.record} messages={messages} onBack={() => route.record ? setRoute({ kind: 'detail', category: route.category, title: route.title, record: route.record }) : setRoute({ kind: 'master', category: route.category, title: route.title })} onSaved={(record) => setRoute({ kind: 'detail', category: route.category, title: route.title, record })} />;

    const parentLabel = tabs.find((item) => item.key === route.parent)?.label ?? messages.nav.home;
    return <View style={styles.child}><BackHeader label={parentLabel} onPress={() => setRoute(null)} /><ListScreen title={route.title} subtitle={messages.common.childSubtitle} icon="document-text-outline" items={[]} /></View>;
  };

  const renderRoot = () => {
    if (tab === 'home') return <HomeScreen messages={messages} brand={ui.brand} />;
    if (tab === 'work') {
      const items = [messages.work.repairRequest, messages.work.openOrders, messages.work.mine, messages.work.overdue, messages.work.completed];
      const filters: WorkFilter[] = ['repair','open','mine','overdue','completed'];
      return <ListScreen title={messages.work.title} subtitle={messages.work.subtitle} icon="clipboard-outline" items={items} onItemPress={(item, index) => setRoute({ kind: 'work', title: item, filter: filters[index] })} />;
    }
    if (tab === 'catalog') return <CatalogScreen brand={ui.brand} messages={messages} onMasterPress={openMaster} onHubPress={(hub, title) => setRoute({ kind: 'catalogHub', hub, title })} onAssetCatalogAdmin={() => setRoute({ kind: 'assetCatalogAdmin' })} />;
    if (tab === 'maintenance') {
      const items = [messages.maintenance.today, messages.maintenance.thisWeek, messages.maintenance.upcoming, messages.maintenance.checklist, messages.maintenance.history];
      return <ListScreen title={messages.maintenance.title} subtitle={messages.maintenance.subtitle} icon="calendar-outline" items={items} onItemPress={(item, index) => index === 3 ? setRoute({ kind: 'maintenance', title: item, filter: 'today' }) : setRoute({ kind: 'maintenance', title: item, filter: (['today','week','upcoming','today','history'] as MaintenanceFilter[])[index] })} />;
    }
    return <ListScreen title={messages.profile.title} subtitle={`${messages.profile.subtitle}\n${session.user.email ?? ''}`} icon="person-outline" items={[messages.profile.account, messages.profile.settings]} onItemPress={(_item, index) => index === 0 ? setRoute({ kind: 'simple', parent: 'profile', title: messages.profile.account }) : setRoute({ kind: 'settings' })} />;
  };

  const currentTitle = (() => {
    if (route?.kind === 'settings') return messages.settings.title;
    if (route?.kind === 'scan') return ui.bottom.scan;
    if (route?.kind === 'assetCatalogAdmin') return messages.catalog.assetTypes;
    if (route?.kind === 'inventory') return ui.bottom.inventory;
    if (route?.kind === 'work' || route?.kind === 'maintenance' || route?.kind === 'catalogHub' || route?.kind === 'master' || route?.kind === 'detail' || route?.kind === 'form' || route?.kind === 'simple') return route.title;
    if (route?.kind === 'assetCreate') return messages.common.createRecord;
    if (route?.kind === 'teams') return messages.catalogHub.teams;
    if (tab === 'work') return messages.work.title;
    if (tab === 'catalog') return messages.catalog.title;
    if (tab === 'maintenance') return messages.maintenance.title;
    if (tab === 'profile') return messages.profile.title;
    return messages.home.title;
  })();

  const bottomItems: { key: BottomNavKey; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
    { key: 'dashboard', label: ui.bottom.home, icon: 'home-outline', onPress: () => changeTab('home') },
    { key: 'scan', label: ui.bottom.scan, icon: 'scan-outline', onPress: () => { setTab('home'); setRoute({ kind: 'scan' }); } },
    { key: 'equipment', label: ui.bottom.equipment, icon: 'cube-outline', onPress: () => { setTab('catalog'); setRoute({ kind: 'master', category: 'assets', title: messages.catalog.assets }); } },
    { key: 'inventory', label: ui.bottom.inventory, icon: 'business-outline', onPress: () => { setTab('catalog'); setRoute({ kind: 'inventory' }); } },
    { key: 'orders', label: ui.bottom.work, icon: 'clipboard-outline', onPress: () => changeTab('work') },
    { key: 'menu', label: ui.bottom.menu, icon: 'menu-outline', onPress: () => setSidebarOpen(true) },
  ];

  const activeBottomKey: BottomNavKey = (() => {
    if (!route && tab === 'home') return 'dashboard';
    if (route?.kind === 'scan') return 'scan';
    if (route?.kind === 'assetCreate') return 'equipment';
    if ((route?.kind === 'master' || route?.kind === 'detail' || route?.kind === 'form') && route.category === 'assets') return 'equipment';
    if (route?.kind === 'inventory' || (route?.kind === 'catalogHub' && route.hub === 'inventory')) return 'inventory';
    if (route?.kind === 'master' && (route.category === 'spareParts' || route.category === 'consumables')) return 'inventory';
    if (route?.kind === 'work' || (!route && tab === 'work')) return 'orders';
    return 'menu';
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        <AppTopBar brand={ui.brand} title={currentTitle} onOpenMenu={() => setSidebarOpen(true)} onOpenAccount={() => { setTab('profile'); setRoute({ kind: 'simple', parent: 'profile', title: messages.profile.account }); }} />
        <View style={styles.main}>{route ? renderRoute() : renderRoot()}</View>
        <View style={styles.nav} accessibilityRole="tablist">
          {bottomItems.map((item) => {
            const active = activeBottomKey === item.key;
            return <TouchableOpacity key={item.key} style={styles.navItem} onPress={item.onPress} activeOpacity={0.72} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={item.label}><View style={[styles.navIconWrap, active && styles.navIconWrapActive]}><Ionicons name={item.icon} size={21} color={active ? colors.primary : colors.muted} />{active ? <View style={styles.activeDot} /> : null}</View><Text numberOfLines={1} style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text></TouchableOpacity>;
          })}
        </View>
        <AppSidebarSheet visible={sidebarOpen} brand={ui.brand} email={session.user.email} sectionLabels={ui.shell.sections} labels={ui.shell} onClose={() => setSidebarOpen(false)} onEquipment={() => { setTab('catalog'); setRoute({ kind: 'master', category: 'assets', title: messages.catalog.assets }); }} onLocations={() => { setTab('catalog'); setRoute({ kind: 'master', category: 'locations', title: messages.catalog.locations }); }} onInventory={() => { setTab('catalog'); setRoute({ kind: 'inventory' }); }} onParts={() => { setTab('catalog'); setRoute({ kind: 'inventory' }); }} onDashboard={() => changeTab('home')} onWorkOrders={() => changeTab('work')} onMaintenance={() => changeTab('maintenance')} onDailyChecks={() => { setTab('maintenance'); setRoute({ kind: 'maintenance', title: ui.shell.dailyChecks, filter: 'today' }); }} onReports={() => { setTab('home'); setRoute({ kind: 'simple', parent: 'home', title: ui.shell.reports }); }} onTeams={() => { setTab('catalog'); setRoute({ kind: 'teams' }); }} onCatalog={() => changeTab('catalog')} onSettings={() => setRoute({ kind: 'settings' })} onAccount={() => { setTab('profile'); setRoute({ kind: 'simple', parent: 'profile', title: messages.profile.account }); }} onSignOut={() => { void supabase.auth.signOut(); }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, authPage: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, shell: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 480 : undefined, alignSelf: 'center', backgroundColor: colors.background, borderLeftWidth: Platform.OS === 'web' ? 1 : 0, borderRightWidth: Platform.OS === 'web' ? 1 : 0, borderColor: colors.border }, main: { flex: 1, paddingBottom: 68 }, child: { flex: 1 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 64, backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.96)' : colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around', paddingHorizontal: 6, paddingTop: 4, paddingBottom: Platform.OS === 'ios' ? 8 : 4, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 8 }, navItem: { flex: 1, minWidth: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 5 }, navIconWrap: { position: 'relative', width: 34, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, navIconWrapActive: { backgroundColor: colors.primarySoft, transform: [{ scale: 1.04 }] }, activeDot: { position: 'absolute', top: 2, left: 15, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }, navText: { marginTop: 1, fontSize: 10, fontWeight: '600', color: colors.muted }, navTextActive: { color: colors.primary, fontWeight: '800' },
});