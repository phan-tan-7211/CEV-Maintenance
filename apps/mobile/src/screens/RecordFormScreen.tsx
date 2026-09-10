import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { AssetControlFlags, AssetGroupOption, AssetTypeOption, CatalogKey, MasterRecord } from '../data/masterData';
import { hasAutomaticManagementCode, managementCodeExample } from '../data/managementCodes';
import { listAssetGroups, listAssetTypes, saveMasterRecord } from '../data/masterRepository';

type Props = {
  category: CatalogKey;
  title: string;
  messages: any;
  record?: MasterRecord;
  initialGroupId?: string;
  initialTypeId?: string;
  flowStep?: 2 | 3;
  onBack: () => void;
  onSaved: (record: MasterRecord) => void;
};

const emptyFlags: AssetControlFlags = { requiresQr: true, requiresMaintenance: false, requiresPrestart: false, requiresCalibration: false, tracksDowntime: false, usesSpareParts: false };

export function RecordFormScreen({ category, title, messages, record, initialGroupId, initialTypeId, flowStep, onBack, onSaved }: Props) {
  const code = record?.code ?? '';
  const [name, setName] = useState(record?.name ?? '');
  const [specification, setSpecification] = useState(record?.specification ?? record?.secondary ?? '');
  const [location, setLocation] = useState(record?.location ?? '');
  const [nextDue, setNextDue] = useState(record?.nextDue ?? '');
  const [quantity, setQuantity] = useState(record?.quantity?.toString() ?? '0');
  const [unit, setUnit] = useState(record?.unit ?? (category === 'meters' ? 'giờ' : 'EA'));
  const [currentValue, setCurrentValue] = useState(record?.currentValue?.toString() ?? '0');
  const [parentCode, setParentCode] = useState(record?.parentCode ?? '');
  const [linkedAssetCode, setLinkedAssetCode] = useState(record?.linkedAssetCode ?? '');
  const [groupId, setGroupId] = useState(record?.groupId ?? initialGroupId ?? '');
  const [typeId, setTypeId] = useState(record?.typeId ?? initialTypeId ?? '');
  const [groups, setGroups] = useState<AssetGroupOption[]>([]);
  const [types, setTypes] = useState<AssetTypeOption[]>([]);
  const [flags, setFlags] = useState<AssetControlFlags>(record?.flags ?? emptyFlags);
  const [saving, setSaving] = useState(false);

  const inventory = category === 'spareParts' || category === 'consumables';
  const coded = hasAutomaticManagementCode(category);
  const codeExample = managementCodeExample(category);

  useEffect(() => {
    if (category !== 'assets' && category !== 'assetTypes') return;
    listAssetGroups().then(setGroups).catch(() => setGroups([]));
  }, [category]);

  useEffect(() => {
    if (category !== 'assets' || !groupId) { setTypes([]); return; }
    listAssetTypes(groupId).then(setTypes).catch(() => setTypes([]));
  }, [category, groupId]);

  const selectedType = useMemo(() => types.find((item) => item.id === typeId), [types, typeId]);
  useEffect(() => { if (category === 'assets' && selectedType) setFlags(selectedType.flags); }, [category, selectedType]);

  const chooseGroup = (id: string) => {
    if (category === 'assets' && id !== groupId) setTypeId('');
    setGroupId(id);
  };

  const save = async () => {
    if (!name.trim()) { Alert.alert(messages.common.nameRequired ?? 'Tên là thông tin bắt buộc.'); return; }
    if ((category === 'assets' || category === 'assetTypes') && !groupId) { Alert.alert(messages.common.groupRequired ?? 'Phải chọn nhóm tài sản.'); return; }
    if (category === 'assets' && !typeId) { Alert.alert(messages.common.typeRequired ?? 'Phải chọn loại tài sản.'); return; }
    setSaving(true);
    try {
      const saved = await saveMasterRecord(category, {
        code: record ? code : undefined, name, specification, location, nextDue,
        quantity: inventory ? Number(quantity || 0) : undefined,
        unit: inventory || category === 'meters' ? unit : undefined,
        currentValue: category === 'meters' ? Number(currentValue || 0) : undefined,
        meterType: category === 'meters' ? specification : undefined,
        groupId: category === 'assets' || category === 'assetTypes' ? groupId : undefined,
        typeId: category === 'assets' ? typeId : undefined,
        parentCode: category === 'assets' || category === 'locations' ? parentCode : undefined,
        linkedAssetCode: category === 'meters' ? linkedAssetCode : undefined,
        flags: category === 'assetTypes' ? flags : undefined,
      }, record?.id);
      onSaved(saved);
    } catch (error: any) { Alert.alert(messages.common.saveError ?? 'Không thể lưu dữ liệu', error?.message ?? String(error)); }
    finally { setSaving(false); }
  };

  const textField = (label: string, value: string, setValue: (v: string) => void, placeholder: string) => (
    <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.input} /></View>
  );

  const flagRows: { key: keyof AssetControlFlags; label: string }[] = [
    { key: 'requiresQr', label: messages.common.requiresQr ?? 'Cần mã QR' },
    { key: 'requiresMaintenance', label: messages.common.requiresMaintenance ?? 'Cần bảo trì' },
    { key: 'requiresPrestart', label: messages.common.requiresPrestart ?? 'Cần kiểm tra trước vận hành' },
    { key: 'requiresCalibration', label: messages.common.requiresCalibration ?? 'Cần hiệu chuẩn / kiểm tra xác nhận' },
    { key: 'tracksDowntime', label: messages.common.tracksDowntime ?? 'Theo dõi thời gian dừng' },
    { key: 'usesSpareParts', label: messages.common.usesSpareParts ?? 'Quản lý phụ tùng liên quan' },
  ];

  const createTitle = category === 'assetTypes'
    ? 'Thêm loại tài sản'
    : category === 'assets'
      ? 'Thêm thiết bị / tài sản'
      : messages.common.createRecord;
  const subtitle = category === 'assetTypes'
    ? 'Loại tài sản nằm trong một nhóm và quyết định các quy tắc QR, bảo trì, hiệu chuẩn, downtime và phụ tùng.'
    : category === 'assets'
      ? 'Chọn nhóm và loại đã thiết lập; hệ thống tự cấp mã TS-#### khi lưu.'
      : 'Mã quản lý được hệ thống cấp tự động và không thay đổi trong suốt vòng đời hồ sơ.';
  const saveLabel = !record && flowStep === 2 ? 'Lưu & tiếp tục thêm thiết bị' : messages.common.save;

  return (
    <View style={styles.page}>
      <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /><Text style={styles.backText}>{title}</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!record && flowStep ? <Text style={styles.step}>BƯỚC {flowStep} / 3</Text> : null}
        <Text style={styles.title}>{record ? messages.common.editRecord : createTitle}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.live}><View style={styles.dot} /><Text style={styles.liveText}>CƠ SỞ DỮ LIỆU · {record ? 'CẬP NHẬT' : 'TẠO MỚI'}</Text></View>

        <View style={styles.codeCard}>
          <View style={styles.codeIcon}><Ionicons name={coded ? 'lock-closed-outline' : 'git-branch-outline'} size={20} color={colors.primary} /></View>
          <View style={styles.codeBody}><Text style={styles.codeLabel}>{coded ? 'Mã quản lý' : 'Phân loại động'}</Text><Text style={styles.codeValue}>{coded ? (record ? code : `Tự động cấp khi lưu · Ví dụ ${codeExample}`) : 'Không tạo thêm tiền tố mã'}</Text><Text style={styles.codeHint}>{coded ? 'Không nhập tay · Không đổi mã · Không tái sử dụng mã cũ' : 'Thêm / đổi tên / ngừng dùng loại mà không làm phình danh mục gốc'}</Text></View>
        </View>

        {(category === 'assets' || category === 'assetTypes') ? <View style={styles.card}>
          <Text style={styles.sectionTitle}>{messages.common.assetClassification ?? 'Phân loại tài sản'}</Text>
          <Text style={styles.label}>{messages.common.assetGroup ?? 'Nhóm tài sản'}</Text>
          <View style={styles.chips}>{groups.map((item) => <TouchableOpacity key={item.id} style={[styles.chip, groupId === item.id && styles.chipActive]} onPress={() => chooseGroup(item.id)}><Text style={[styles.chipText, groupId === item.id && styles.chipTextActive]}>{item.name}</Text></TouchableOpacity>)}</View>
          {category === 'assets' && groupId ? <><Text style={[styles.label, { marginTop: 14 }]}>{messages.common.assetType ?? 'Loại tài sản'}</Text><View style={styles.chips}>{types.map((item) => <TouchableOpacity key={item.id} style={[styles.chip, typeId === item.id && styles.chipActive]} onPress={() => setTypeId(item.id)}><Text style={[styles.chipText, typeId === item.id && styles.chipTextActive]}>{item.name}</Text></TouchableOpacity>)}</View>{types.length === 0 ? <Text style={styles.inlineHint}>Nhóm này chưa có loại tài sản. Hãy quay lại và tạo loại trước khi đăng ký thiết bị.</Text> : null}</> : null}
        </View> : null}

        <View style={styles.card}>
          {textField(messages.common.name, name, setName, messages.common.enterName)}
          {textField(category === 'meters' ? (messages.common.meterType ?? 'Loại chỉ số') : messages.common.specification, specification, setSpecification, messages.common.enterSpecification)}
          {category === 'assets' || inventory ? textField(messages.common.location, location, setLocation, messages.common.enterLocation) : null}
          {category === 'assets' ? textField(messages.common.parentAsset ?? 'Tài sản cha', parentCode, setParentCode, 'VD: TS-0100') : null}
          {category === 'locations' ? textField(messages.common.parentLocation ?? 'Vị trí cha', parentCode, setParentCode, 'VD: KV-001') : null}
          {category === 'assets' || category === 'suppliers' ? textField(messages.common.nextDue, nextDue, setNextDue, 'YYYY-MM-DD') : null}
          {inventory ? <>{textField(messages.common.stock, quantity, setQuantity, '0')}{textField(messages.common.unit ?? 'Đơn vị', unit, setUnit, 'EA')}</> : null}
          {category === 'meters' ? <>{textField(messages.common.linkedAsset ?? 'Tài sản liên kết', linkedAssetCode, setLinkedAssetCode, 'VD: TS-0001')}{textField(messages.common.currentValue ?? 'Giá trị hiện tại', currentValue, setCurrentValue, '0')}{textField(messages.common.unit ?? 'Đơn vị', unit, setUnit, 'giờ')}</> : null}
        </View>

        {category === 'assetTypes' ? <View style={styles.card}><Text style={styles.sectionTitle}>{messages.common.controlRules ?? 'Quy tắc áp dụng'}</Text>{flagRows.map((item) => <View key={item.key} style={styles.switchRow}><Text style={styles.switchLabel}>{item.label}</Text><Switch value={Boolean(flags[item.key])} onValueChange={(value) => setFlags((current) => ({ ...current, [item.key]: value }))} /></View>)}</View> : null}

        {category === 'assets' && selectedType ? <View style={styles.card}><Text style={styles.sectionTitle}>Quy tắc tự động theo loại đã chọn</Text>{flagRows.filter((item) => Boolean(flags[item.key])).map((item) => <View key={item.key} style={styles.infoRow}><Ionicons name="checkmark-circle-outline" size={20} color={colors.success} /><Text style={styles.infoText}>{item.label}</Text></View>)}{!flagRows.some((item) => Boolean(flags[item.key])) ? <Text style={styles.infoText}>Không có kiểm soát đặc biệt.</Text> : null}</View> : null}

        <TouchableOpacity disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]} activeOpacity={0.75} onPress={() => void save()}>{saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name={flowStep === 2 && !record ? 'arrow-forward' : 'save-outline'} size={20} color="#fff" /><Text style={styles.saveText}>{saveLabel}</Text></>}</TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { minHeight: 54, paddingHorizontal: 12, justifyContent: 'center' }, back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }, backText: { color: colors.text, fontSize: 14, fontWeight: '700', maxWidth: 300 }, content: { padding: 18, paddingTop: 4, paddingBottom: 120 }, step: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginBottom: 5 }, title: { color: colors.text, fontSize: 26, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }, live: { alignSelf: 'flex-start', marginVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF3', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, liveText: { color: colors.success, fontSize: 10, fontWeight: '900' }, codeCard: { backgroundColor: colors.primarySoft, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 14, flexDirection: 'row', gap: 11, alignItems: 'flex-start' }, codeIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, codeBody: { flex: 1 }, codeLabel: { color: colors.text, fontSize: 12, fontWeight: '800' }, codeValue: { color: colors.primary, fontSize: 15, fontWeight: '900', marginTop: 3 }, codeHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }, card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 14 }, field: { marginBottom: 14 }, label: { color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 7 }, input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text, fontSize: 14, backgroundColor: colors.background }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 10 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: colors.background }, chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, chipText: { color: colors.text, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: colors.primary, fontWeight: '900' }, inlineHint: { color: colors.warning, fontSize: 11, lineHeight: 16, marginTop: 9 }, switchRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, switchLabel: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' }, infoRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 7 }, infoText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 }, save: { height: 50, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, saveText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
