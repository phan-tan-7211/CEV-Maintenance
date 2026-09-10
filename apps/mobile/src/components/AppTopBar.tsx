import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  brand: string;
  title: string;
  onOpenMenu: () => void;
  onOpenAccount: () => void;
};

export function AppTopBar({ brand, title, onOpenMenu, onOpenAccount }: Props) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.logoButton} onPress={onOpenMenu} accessibilityLabel="Open navigation menu" activeOpacity={0.72}>
        <Ionicons name="construct" size={20} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.center}>
        <Text numberOfLines={1} style={styles.brand}>{brand}</Text>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity style={styles.profileButton} onPress={onOpenAccount} accessibilityLabel="Open account" activeOpacity={0.72}>
        <Ionicons name="person-outline" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  center: { flex: 1, minWidth: 0 },
  brand: { fontSize: 11, color: colors.primary, fontWeight: '800', letterSpacing: 0.2 },
  title: { marginTop: 2, fontSize: 14, color: colors.text, fontWeight: '700' },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
});
