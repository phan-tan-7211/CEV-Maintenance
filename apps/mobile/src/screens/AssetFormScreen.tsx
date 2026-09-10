import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { AssetGroupOption, AssetTypeOption, MasterRecord } from '../data/masterData';
import { createAssetGroup, createAssetType, saveEquipment } from '../data/assetGroupRepository';
import { getMasterRecord, listAssetGroups, listAssetTypes } from '../data/masterRepository';

type Props = {
  messages: any;
  record?: MasterRecord;
  onBack: () => void;
  onSaved: (record: MasterRecord) => void;
};

type PickerMode = 'group' | 'type' | null;

export function AssetFormScreen({ messages, record, onBack, onSaved }: Props) {
  const [groups, setGroups] = useState<AssetGroupOption[]>([]);
  const [types, setTypes] = useState<AssetTypeOption[]>([]);
  const [groupId, setGroupId] = useState(record?.groupId ?? '');
  const [typeId, setTypeId] = useState(record?.typeId ?? '');
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateType, setShowCreateType] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [name, setName] = useState(record?.name ?? '');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState(record?.specification ?? record?.secondary ?? '');
  const [serial, setSerial] = useState('');
  const [location, setLocation] = useState(record?.location ?? '');
  const [parentCode, setParentCode] = useState(record?.parentCode ?? '');
  const [saving, setSaving] = useState(false);
  const [creatingInline, setCreatingInline] = useState(false);

  const loadGroups = async () => setGroups(await listAssetGroups());
  const loadTypes = async (nextGroupId: string) => setTypes(nextGroupId ? await listAssetTypes(nextGroupId) : []);

  useEffect(() => { loadGroups().catch(() => setGroups([])); }, []);
  useEffect(() => { loadTypes(groupId).catch(() => setTypes([])); }, [groupId]);

  useEffect(() => {
    if (!record && manufacturer.trim() && model.trim() && !name.trim()) {
      setName(`${manufacturer.trim()} ${model.trim()}`);
    }
  }, [manufacturer, model, record, name]);

  const selectedGroup = useMemo(() => groups.find((item) => item.id === groupId), [groups, groupId]);
  const selectedType = useMemo(() => types.find((item) => item.id === typeId), [types, typeId]);

  const chooseGroup = (id: string) => {
    setGroupId(id);
    setTypeId('');
    setPickerMode(null);
    setShowCreateGroup(false);
    setShowCreateType(false);
  };

  const chooseType = (id: string) => {
    setTypeId(id);
    setPickerMode(null);
    setShowCreateType(false);
  };

  const createGroupInline = async () => {
    if (!newGroupName.trim()) return;
    setCreatingInline(true);
    try {
      const group = await createAssetGroup({ name: newGroupName, description: newGroupDescription });
      await loadGroups();
      setGroupId(group.id);
      setTypeId('');
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroup(false);
      setPickerMode(null);
      setShowCreateType(true);
    } catch (error: any) {
      Alert.alert('Không thể tạo nhóm', error?.message ?? String(error));
    } finally {
      setCreatingInline(false);
    }
  };

  const createTypeInline = async () => {
    if (!groupId) return Alert.alert('Chọn nhóm trước');
    if (!newTypeName.trim()) return;
    setCreatingInline(true);
    try {
      const type = await createAssetType({ groupId, name: newTypeName, description: newTypeDescription });
      await loadTypes(groupId);
      setTypeId(type.id);
      setNewTypeName('');
      setNewTypeDescription('');
      setShowCreateType(false);
      setPickerMode(null);
    } catch (error: any) {
      Alert.alert('Không thể tạo loại', error?.message ?? String(error));
    } finally {
      setCreatingInline(false);
    }
  };

  const save = async () => {
    if (!groupId) return Alert.alert('Chọn nhóm tài sản');
    if (!typeId) return Alert.alert('Chọn loại tài sản');
    if (!name.trim()) return Alert.alert('Tên thiết bị là bắt buộc');
    setSaving(true);
    try {
      const id = await saveEquipment({
        id: record?.id,
        code: record?.code,
        name,
        manufacturer,
        model,
        serial,
        location,
        groupId,
        typeId,
        parentCode,
      });
      onSaved(await getMasterRecord('assets', id));
    } catch (error: any) {
      Alert.alert(messages.common.saveError ?? 'Không thể lưu dữ liệu', error?.message ?? String(error));
    } finally {
      setSaving(false);
    }
  };

  const input = (label: string, value: string, setValue: (value: string) => void, placeholder: string, required = false) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TextInput value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.input} />
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="close" size={25} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{record ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân loại</Text>
          <Text style={styles.label}>Nhóm tài sản *</Text>
          <TouchableOpacity style={styles.select} onPress={() => setPickerMode(pickerMode === 'group' ? null : 'group')} activeOpacity={0.75}>
            <Text style={[styles.selectText, !selectedGroup && styles.placeholder]}>{selectedGroup?.name ?? 'Chọn nhóm'}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
          {pickerMode === 'group' ? (
            <View style={styles.menu}>
              {groups.map((group) => (
                <TouchableOpacity key={group.id} style={styles.menuItem} onPress={() => chooseGroup(group.id)}>
                  <Text style={styles.menuText}>{group.name}</Text>
                  {group.id === groupId ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.menuItem, styles.createItem]} onPress={() => { setPickerMode(null); setShowCreateGroup(true); }}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.createText}>Tạo nhóm mới</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {showCreateGroup ? (
            <View style={styles.inlineCreate}>
              <Text style={styles.inlineTitle}>Tạo nhóm mới</Text>
              {input('Tên nhóm', newGroupName, setNewGroupName, 'VD: Thiết bị sản xuất', true)}
              {input('Mô tả', newGroupDescription, setNewGroupDescription, 'Không bắt buộc')}
              <View style={styles.inlineButtons}>
                <TouchableOpacity disabled={creatingInline || !newGroupName.trim()} style={styles.primarySmall} onPress={() => void createGroupInline()}>
                  <Text style={styles.primarySmallText}>{creatingInline ? 'Đang tạo...' : 'Tạo & chọn'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostSmall} onPress={() => setShowCreateGroup(false)}><Text style={styles.ghostText}>Hủy</Text></TouchableOpacity>
              </View>
            </View>
          ) : null}

          <Text style={[styles.label, { marginTop: 16 }]}>Loại tài sản *</Text>
          <TouchableOpacity disabled={!groupId} style={[styles.select, !groupId && { opacity: 0.5 }]} onPress={() => setPickerMode(pickerMode === 'type' ? null : 'type')} activeOpacity={0.75}>
            <Text style={[styles.selectText, !selectedType && styles.placeholder]}>{selectedType?.name ?? (groupId ? 'Chọn loại' : 'Chọn nhóm trước')}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
          {pickerMode === 'type' && groupId ? (
            <View style={styles.menu}>
              {types.map((type) => (
                <TouchableOpacity key={type.id} style={styles.menuItem} onPress={() => chooseType(type.id)}>
                  <Text style={styles.menuText}>{type.name}</Text>
                  {type.id === typeId ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.menuItem, styles.createItem]} onPress={() => { setPickerMode(null); setShowCreateType(true); }}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.createText}>Tạo loại mới</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {showCreateType ? (
            <View style={styles.inlineCreate}>
              <Text style={styles.inlineTitle}>Tạo loại mới trong {selectedGroup?.name ?? 'nhóm đã chọn'}</Text>
              {input('Tên loại', newTypeName, setNewTypeName, 'VD: Máy cuốn', true)}
              {input('Mô tả', newTypeDescription, setNewTypeDescription, 'Không bắt buộc')}
              <View style={styles.inlineButtons}>
                <TouchableOpacity disabled={creatingInline || !newTypeName.trim()} style={styles.primarySmall} onPress={() => void createTypeInline()}>
                  <Text style={styles.primarySmallText}>{creatingInline ? 'Đang tạo...' : 'Tạo & chọn'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostSmall} onPress={() => setShowCreateType(false)}><Text style={styles.ghostText}>Hủy</Text></TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thiết bị</Text>
          {input('Hãng', manufacturer, setManufacturer, 'VD: Panasonic')}
          {input('Model', model, setModel, 'VD: AC-250')}
          {input('Tên thiết bị', name, setName, 'VD: Panasonic AC-250', true)}
          {input('Serial', serial, setSerial, 'Số serial / nameplate')}
          {input('Vị trí', location, setLocation, 'VD: Line WPC')}
          {input('Tài sản cha', parentCode, setParentCode, 'VD: TS-0100')}
        </View>

        <View style={styles.note}>
          <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>Mã TS và QR được hệ thống cấp tự động khi lưu. Không cần nhập quy tắc mã ở màn hình này.</Text>
        </View>

        <TouchableOpacity disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]} onPress={() => void save()} activeOpacity={0.78}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{record ? 'Lưu thay đổi' : 'Thêm thiết bị'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 120 },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 15 },
  field: { marginBottom: 13 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 12, color: colors.text, fontSize: 14 },
  select: { height: 46, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  placeholder: { color: colors.muted, fontWeight: '500' },
  menu: { borderWidth: 1, borderColor: colors.border, borderTopWidth: 0, backgroundColor: colors.surface },
  menuItem: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border },
  menuText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  createItem: { justifyContent: 'flex-start', gap: 7 },
  createText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  inlineCreate: { marginTop: 10, padding: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primarySoft },
  inlineTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginBottom: 12 },
  inlineButtons: { flexDirection: 'row', gap: 8 },
  primarySmall: { minHeight: 38, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  primarySmallText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  ghostSmall: { minHeight: 38, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  note: { flexDirection: 'row', gap: 9, padding: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primarySoft, marginBottom: 16 },
  noteText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
  save: { height: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
