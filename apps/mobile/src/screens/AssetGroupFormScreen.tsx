import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { AssetGroupOption } from '../data/masterData';
import { createAssetGroup } from '../data/masterRepository';

type Props = {
  messages: any;
  onBack: () => void;
  onSaved: (group: AssetGroupOption) => void;
};

export function AssetGroupFormScreen({ messages, onBack, onSaved }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Tên nhóm là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const group = await createAssetGroup({ name, description });
      onSaved(group);
    } catch (error: any) {
      Alert.alert(messages.common.saveError ?? 'Không thể lưu dữ liệu', error?.message ?? String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backText}>Thiết bị & tài sản</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.step}>BƯỚC 1 / 3</Text>
        <Text style={styles.title}>Thêm nhóm tài sản</Text>
        <Text style={styles.subtitle}>Nhóm là tầng phân loại cao. Sau khi lưu, hệ thống sẽ chuyển thẳng sang bước tạo loại tài sản đầu tiên trong nhóm này.</Text>

        <View style={styles.flowCard}>
          <View style={styles.flowActive}><Text style={styles.flowActiveText}>1</Text></View>
          <View style={styles.flowLine} />
          <View style={styles.flowIdle}><Text style={styles.flowIdleText}>2</Text></View>
          <View style={styles.flowLine} />
          <View style={styles.flowIdle}><Text style={styles.flowIdleText}>3</Text></View>
        </View>
        <View style={styles.flowLabels}>
          <Text style={[styles.flowLabel, styles.flowLabelActive]}>Nhóm</Text>
          <Text style={styles.flowLabel}>Loại</Text>
          <Text style={styles.flowLabel}>Thiết bị</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Tên nhóm *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="VD: Thiết bị sản xuất"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoFocus
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Nhóm này dùng cho loại tài sản nào?"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={21} color={colors.primary} />
          <Text style={styles.hintText}>Không cần tạo nhóm cho từng model máy. Nhóm nên ổn định và rộng; chi tiết nằm ở Loại tài sản.</Text>
        </View>

        <TouchableOpacity disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]} activeOpacity={0.75} onPress={() => void save()}>
          {saving ? <ActivityIndicator color="#fff" /> : <><Text style={styles.saveText}>Lưu & tiếp tục tạo loại</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 54, paddingHorizontal: 12, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  content: { padding: 18, paddingTop: 4, paddingBottom: 120 },
  step: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  flowCard: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 32 },
  flowActive: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  flowActiveText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  flowIdle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  flowIdleText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  flowLine: { flex: 1, height: 2, backgroundColor: colors.border },
  flowLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 21, marginTop: 7, marginBottom: 18 },
  flowLabel: { width: 55, textAlign: 'center', color: colors.muted, fontSize: 10, fontWeight: '800' },
  flowLabelActive: { color: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15 },
  field: { marginBottom: 14 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text, fontSize: 14, backgroundColor: colors.background },
  textarea: { minHeight: 96, paddingTop: 12 },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 14, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  hintText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
  save: { marginTop: 20, height: 50, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
