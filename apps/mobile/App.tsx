import { useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { colors } from './src/theme/colors';

type Tab = 'home' | 'work' | 'assets' | 'pm' | 'profile';

const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home-outline' },
  { key: 'work', label: 'Công việc', icon: 'clipboard-outline' },
  { key: 'assets', label: 'Thiết bị', icon: 'cube-outline' },
  { key: 'pm', label: 'Bảo trì', icon: 'calendar-outline' },
  { key: 'profile', label: 'Cá nhân', icon: 'person-outline' },
];

function Screen({ tab }: { tab: Tab }) {
  if (tab === 'home') return <HomeScreen />;
  if (tab === 'work') return <ListScreen title="Công việc" subtitle="Quản lý yêu cầu và lệnh bảo trì" icon="clipboard-outline" items={['Việc đang mở', 'Việc của tôi', 'Quá hạn', 'Đã hoàn thành']} />;
  if (tab === 'assets') return <ListScreen title="Thiết bị" subtitle="Tài sản và tình trạng vận hành" icon="cube-outline" items={['Tất cả thiết bị', 'Thiết bị đang chạy', 'Thiết bị dừng', 'Quét mã QR']} />;
  if (tab === 'pm') return <ListScreen title="Bảo trì định kỳ" subtitle="Kế hoạch PM và lịch thực hiện" icon="calendar-outline" items={['Hôm nay', 'Tuần này', 'Sắp đến hạn', 'Mẫu checklist']} />;
  return <ListScreen title="Cá nhân" subtitle="Tài khoản và cài đặt ứng dụng" icon="person-outline" items={['Hồ sơ', 'Thông báo', 'Cài đặt', 'Đăng xuất']} />;
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
