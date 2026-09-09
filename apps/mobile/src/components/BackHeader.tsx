import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = { label: string; onPress: () => void };

export function BackHeader({ label, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 2 },
  button: { alignSelf: 'flex-start', minHeight: 42, flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
