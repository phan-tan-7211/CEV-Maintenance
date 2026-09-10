import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Locale } from '../i18n';
import { getEquipmentUi } from '../i18n/equipmentUi';
import type { AssetGroupOption, AssetTypeOption, MasterRecord } from '../data/masterData';
import { createAssetGroup, createAssetType, saveEquipment } from '../data/assetGroupRepository';
import { getMasterRecord, listAssetGroups, listAssetTypes } from '../data/masterRepository';

type Props = { messages: any; locale: Locale; record?: MasterRecord; onBack: () => void; onSaved: (record: MasterRecord) => void };
type PickerMode = 'group' | 'type' | null;

export function AssetFormScreen({ messages, locale, record, onBack, onSaved }: Props) {
  const copy = useMemo(() => getEquipmentUi(locale).form, [locale]);
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
  useEffect(() => { void loadGroups().catch(() => setGroups([])); }, []);
  useEffect(() => { void loadTypes(groupId).catch(() => setTypes([])); }, [groupId]);
  useEffect(() => { if (!record && manufacturer.trim() && model.trim() && !name.trim()) setName(`${manufacturer.trim()} ${model.trim()}`); }, [manufacturer, model, record, name]);

  const selectedGroup = useMemo(() => groups.find((item) => item.id === groupId), [groups, groupId]);
  const selectedType = useMemo(() => types.find((item) => item.id === typeId), [types, typeId]);

  const createGroupInline = async () => {
    if (!newGroupName.trim()) return;
    setCreatingInline(true);
    try {
      const group = await createAssetGroup({ name: newGroupName, description: newGroupDescription });
      await loadGroups();
      setGroupId(group.id); setTypeId(''); setNewGroupName(''); setNewGroupDescription(''); setShowCreateGroup(false); setPickerMode(null);
    } catch (error: any) { Alert.alert(copy.createGroup, error?.message ?? String(error)); }
    finally { setCreatingInline(false); }
  };

  const createTypeInline = async () => {
    if (!groupId || !newTypeName.trim()) return;
    setCreatingInline(true);
    try {
      const type = await createAssetType({ groupId, name: newTypeName, description: newTypeDescription });
      await loadTypes(groupId);
      setTypeId(type.id); setNewTypeName(''); setNewTypeDescription(''); setShowCreateType(false); setPickerMode(null);
    } catch (error: any) { Alert.alert(copy.createType, error?.message ?? String(error)); }
    finally { setCreatingInline(false); }
  };

  const save = async () => {
    if (!groupId) return Alert.alert(copy.group);
    if (!typeId) return Alert.alert(copy.type);
    if (!name.trim()) return Alert.alert(copy.name);
    setSaving(true);
    try {
      const id = await saveEquipment({ id: record?.id, code: record?.code, name, manufacturer, model, serial, location, groupId, typeId, parentCode });
      onSaved(await getMasterRecord('assets', id));
    } catch (error: any) { Alert.alert(messages.common.saveError ?? 'Save failed', error?.message ?? String(error)); }
    finally { setSaving(false); }
  };

  const field = (label: string, value: string, setValue: (value: string) => void, placeholder: string, required = false) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TextInput value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.input} />
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.close}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>{record ? copy.edit : copy.add}</Text><Text style={styles.headerSub}>{record?.code ?? copy.autoCode}</Text></View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}><View style={styles.sectionIcon}><Ionicons name="layers-outline" size={18} color={colors.primary} /></View><Text style={styles.cardTitle}>{copy.classification}</Text></View>
          <Text style={styles.label}>{copy.group} *</Text>
          <TouchableOpacity style={styles.select} onPress={() => setPickerMode(pickerMode === 'group' ? null : 'group')}>
            <Text style={[styles.selectText, !selectedGroup && styles.placeholder]}>{selectedGroup?.name ?? copy.chooseGroup}</Text><Ionicons name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
          {pickerMode === 'group' ? <View style={styles.dropdown}>{groups.map((group) => <TouchableOpacity key={group.id} style={styles.option} onPress={() => { setGroupId(group.id); setTypeId(''); setPickerMode(null); }}><Text style={styles.optionText}>{group.name}</Text>{group.id === groupId ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}</TouchableOpacity>)}<TouchableOpacity style={[styles.option, styles.createOption]} onPress={() => { setPickerMode(null); setShowCreateGroup(true); }}><Ionicons name="add" size={18} color={colors.primary} /><Text style={styles.createText}>{copy.createGroup}</Text></TouchableOpacity></View> : null}

          {showCreateGroup ? <View style={styles.inlinePanel}><Text style={styles.inlineTitle}>{copy.createGroup}</Text>{field(copy.group, newGroupName, setNewGroupName, 'Production equipment', true)}{field('Description', newGroupDescription, setNewGroupDescription, '')}<View style={styles.inlineActions}><TouchableOpacity style={styles.primarySmall} disabled={creatingInline} onPress={() => void createGroupInline()}><Text style={styles.primarySmallText}>{copy.createAndSelect}</Text></TouchableOpacity><TouchableOpacity style={styles.secondarySmall} onPress={() => setShowCreateGroup(false)}><Text style={styles.secondarySmallText}>{copy.cancel}</Text></TouchableOpacity></View></View> : null}

          <Text style={[styles.label, { marginTop: 16 }]}>{copy.type} *</Text>
          <TouchableOpacity disabled={!groupId} style={[styles.select, !groupId && styles.disabled]} onPress={() => setPickerMode(pickerMode === 'type' ? null : 'type')}>
            <Text style={[styles.selectText, !selectedType && styles.placeholder]}>{selectedType?.name ?? copy.chooseType}</Text><Ionicons name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
          {pickerMode === 'type' && groupId ? <View style={styles.dropdown}>{types.map((type) => <TouchableOpacity key={type.id} style={styles.option} onPress={() => { setTypeId(type.id); setPickerMode(null); }}><Text style={styles.optionText}>{type.name}</Text>{type.id === typeId ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}</TouchableOpacity>)}<TouchableOpacity style={[styles.option, styles.createOption]} onPress={() => { setPickerMode(null); setShowCreateType(true); }}><Ionicons name="add" size={18} color={colors.primary} /><Text style={styles.createText}>{copy.createType}</Text></TouchableOpacity></View> : null}
          {showCreateType ? <View style={styles.inlinePanel}><Text style={styles.inlineTitle}>{copy.createType}</Text>{field(copy.type, newTypeName, setNewTypeName, 'Press / Jig / Gauge', true)}{field('Description', newTypeDescription, setNewTypeDescription, '')}<View style={styles.inlineActions}><TouchableOpacity style={styles.primarySmall} disabled={creatingInline} onPress={() => void createTypeInline()}><Text style={styles.primarySmallText}>{copy.createAndSelect}</Text></TouchableOpacity><TouchableOpacity style={styles.secondarySmall} onPress={() => setShowCreateType(false)}><Text style={styles.secondarySmallText}>{copy.cancel}</Text></TouchableOpacity></View></View> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}><View style={styles.sectionIcon}><Ionicons name="construct-outline" size={18} color={colors.primary} /></View><Text style={styles.cardTitle}>{copy.info}</Text></View>
          <View style={styles.twoCol}><View style={styles.col}>{field(copy.manufacturer, manufacturer, setManufacturer, 'Panasonic')}</View><View style={styles.col}>{field(copy.model, model, setModel, 'AC-250')}</View></View>
          {field(copy.name, name, setName, 'Panasonic AC-250', true)}
          {field(copy.serial, serial, setSerial, 'Serial / nameplate')}
          {field(copy.location, location, setLocation, 'Line WPC')}
          {field(copy.parent, parentCode, setParentCode, 'TS-0100')}
        </View>

        <View style={styles.hint}><Ionicons name="qr-code-outline" size={22} color={colors.primary} /><Text style={styles.hintText}>{copy.autoCode}</Text></View>
        <View style={styles.footerActions}><TouchableOpacity style={styles.cancelButton} onPress={onBack}><Text style={styles.cancelText}>{copy.cancel}</Text></TouchableOpacity><TouchableOpacity disabled={saving} style={[styles.saveButton, saving && styles.disabled]} onPress={() => void save()}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{record ? copy.save : copy.create}</Text>}</TouchableOpacity></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, header: { minHeight: 64, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }, close: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, alignItems: 'center' }, headerTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, headerSub: { marginTop: 2, maxWidth: 250, textAlign: 'center', color: colors.muted, fontSize: 9 }, content: { padding: 14, paddingBottom: 120, gap: 12 }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }, cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 }, sectionIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontSize: 15, fontWeight: '900', color: colors.text }, field: { marginBottom: 13 }, label: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7 }, input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background, paddingHorizontal: 12, color: colors.text, fontSize: 14 }, select: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectText: { color: colors.text, fontSize: 13, fontWeight: '700' }, placeholder: { color: colors.muted, fontWeight: '500' }, dropdown: { marginTop: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, overflow: 'hidden' }, option: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }, optionText: { color: colors.text, fontSize: 13, fontWeight: '700' }, createOption: { justifyContent: 'flex-start', gap: 7, borderBottomWidth: 0 }, createText: { color: colors.primary, fontSize: 13, fontWeight: '900' }, inlinePanel: { marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: colors.primarySoft }, inlineTitle: { marginBottom: 10, fontSize: 13, fontWeight: '900', color: colors.text }, inlineActions: { flexDirection: 'row', gap: 8 }, primarySmall: { minHeight: 40, paddingHorizontal: 13, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, primarySmallText: { color: '#fff', fontSize: 12, fontWeight: '900' }, secondarySmall: { minHeight: 40, paddingHorizontal: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, secondarySmallText: { color: colors.muted, fontSize: 12, fontWeight: '800' }, twoCol: { flexDirection: 'row', gap: 10 }, col: { flex: 1 }, hint: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.primarySoft, padding: 13 }, hintText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 16 }, footerActions: { flexDirection: 'row', gap: 10, marginTop: 2 }, cancelButton: { flex: 1, height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, cancelText: { color: colors.text, fontSize: 13, fontWeight: '800' }, saveButton: { flex: 2, height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#fff', fontSize: 14, fontWeight: '900' }, disabled: { opacity: 0.5 },
});
