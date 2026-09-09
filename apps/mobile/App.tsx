import { useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { colors } from './src/theme/colors';
import { t } from './src/i18n';

type Tab = 'home' | 'work' | 'catalog' | 'maintenance' | 'profile';

const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: t.nav.home, icon: 'home-outline' },
  { key: 'work', label: t.nav.work, icon: 'clipboard-outline' },
  { key: 'catalog', label: t.nav.catalog, icon: 'grid-outline' },
  { key: 'maintenance', label: t.nav.maintenance, icon: 'calendar-outline' },
  { key: 'profile', label: t.nav.profile, icon: 'person-outline' },
];

function Screen({ tab }: { tab: Tab }) {
  if (tab === 'home') return <HomeScreen />;
  if (tab === 'work') {
    return <ListScreen title={t.work.title} subtitle={t.work.subtitle} icon="clipboard-outline" items={['Yêu cầu sửa chữa', 'Lệnh bảo trì đang mở', 'Công việc của tôi', 'Công việc quá hạn', 'Công việc đã hoàn thành']} />;
  }
  if (tab === 'catalog') return <CatalogScreen />;
  if (tab === 'maintenance') {
    return <ListScreen title={t.maintenance.title} subtitle={t.maintenance.subtitle} icon="calendar-outline" items={['Bảo trì hôm nay', 'Kế hoạch tuần này', 'Sắp đến hạn', 'Biểu mẫu kiểm tra', 'Lịch sử bảo trì']} />;
  }
  return <ListScreen title={t.profile.title} subtitle={t.profile.subtitle} icon="person-outline" items={['Hồ sơ cá nhân', 'Thông báo', 'Cài đặt', 'Ngôn ngữ', 'Đăng xuất']} />;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        <View style={styles.main}><Screen tab={tab} /></View>
        <View style={styles.nav}>
          {tabs.map((item) => {
            const active = item.key === tab;
            return (
              <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => setTab(item.key)} activeOpacity={0.7}>
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
