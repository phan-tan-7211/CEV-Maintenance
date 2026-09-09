import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { t } from '../i18n';

const groups = [
  { icon: 'construct-outline', title: t.catalog.assets, note: 'Máy dập, máy ép, máy quấn, dây chuyền và thiết bị sản xuất' },
  { icon: 'flash-outline', title: t.catalog.utilities, note: 'Máy nén khí, chiller, điện, khí, nước và hạ tầng nhà máy' },
  { icon: 'hammer-outline', title: t.catalog.tooling, note: 'Jig, fixture, khuôn, đồ gá, dao cụ và dụng cụ chuyên dùng' },
  { icon: 'speedometer-outline', title: t.catalog.measuring, note: 'Dụng cụ đo, thiết bị kiểm tra, hiệu chuẩn và MSA' },
  { icon: 'settings-outline', title: t.catalog.spareParts, note: 'Linh kiện dự phòng, tồn kho, mức tối thiểu/tối đa và thiết bị sử dụng' },
  { icon: 'flask-outline', title: t.catalog.consumables, note: 'Dầu, mỡ, lọc, hóa chất vệ sinh và vật tư tiêu hao' },
  { icon: 'shield-checkmark-outline', title: t.catalog.safety, note: 'Công tắc an toàn, rèm quang, dừng khẩn và thiết bị bảo vệ máy' },
  { icon: 'business-outline', title: t.catalog.suppliers, note: 'Đơn vị hiệu chuẩn, sửa chữa, bảo trì thuê ngoài và đánh giá năng lực' },
] as const;

export function CatalogScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>IATF 16949</Text>
      <Text style={styles.title}>{t.catalog.title}</Text>
      <Text style={styles.subtitle}>{t.catalog.subtitle}</Text>

      <View style={styles.list}>
        {groups.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardNote}>{item.note}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Nghiệp vụ dùng chung</Text>
        <Text style={styles.infoText}>Yêu cầu sửa chữa • Lệnh bảo trì • Bảo trì định kỳ • Kiểm tra • Sự cố • Phụ tùng sử dụng • Xác nhận sau sửa chữa • Lịch sử thiết bị</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  list: { gap: 10, marginTop: 22 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  cardNote: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  infoBox: { marginTop: 18, backgroundColor: colors.primarySoft, borderRadius: 16, padding: 16 },
  infoTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  infoText: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
