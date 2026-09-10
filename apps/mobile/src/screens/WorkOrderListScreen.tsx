import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Locale } from '../i18n';
import { getWorkOrderUi } from '../i18n/workOrderUi';
import type { MasterRecord } from '../data/masterData';
import { listMasterRecords } from '../data/masterRepository';
import {
  createWorkOrder,
  listWorkOrders,
  updateWorkOrderCloseout,
  updateWorkOrderStatus,
  type WorkFilter,
  type WorkOrderRow,
} from '../data/workOrderRepository';

type Props = { title: string; filter: WorkFilter; messages: any; locale?: Locale; onBack: () => void };
type SortMode = 'newest' | 'oldest' | 'due';

const statusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
  if (status === 'completed') return 'checkmark-circle-outline';
  if (status === 'in_progress') return 'play-circle-outline';
  if (status === 'on_hold') return 'pause-circle-outline';
  return 'ellipse-outline';
};

const priorityTone = (priority: string) => priority === 'urgent' || priority === 'high' ? colors.danger : priority === 'medium' ? colors.warning : colors.muted;

export function WorkOrderListScreen({ title, filter, messages, locale, onBack }: Props) {
  const resolvedLocale: Locale = locale ?? (messages.nav.home === 'Home' ? 'en' : messages.nav.home === '홈' ? 'ko' : 'vi');
  const copy = useMemo(() => getWorkOrderUi(resolvedLocale), [resolvedLocale]);
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [assets, setAssets] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<WorkFilter>(filter);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<WorkOrderRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newType, setNewType] = useState('corrective');
  const [newAssetId, setNewAssetId] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [downtime, setDowntime] = useState('0');
  const [verified, setVerified] = useState(false);
  const [showCloseout, setShowCloseout] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [workOrders, assetRows] = await Promise.all([listWorkOrders(activeFilter), listMasterRecords('assets')]);
      setRows(workOrders);
      setAssets(assetRows);
    } catch (error: any) {
      Alert.alert(messages.common.loadError ?? 'Load error', error?.message ?? String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { setActiveFilter(filter); }, [filter]);
  useEffect(() => { void load(); }, [activeFilter]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((row) => !q || `${row.code} ${row.title} ${row.asset ?? ''} ${row.description ?? ''}`.toLowerCase().includes(q));
    return [...filtered].sort((a, b) => {
      if (sortMode === 'oldest') return String(a.requestedAt ?? '').localeCompare(String(b.requestedAt ?? ''));
      if (sortMode === 'due') return String(a.dueAt ?? '9999').localeCompare(String(b.dueAt ?? '9999'));
      return String(b.requestedAt ?? '').localeCompare(String(a.requestedAt ?? ''));
    });
  }, [rows, query, sortMode]);

  const pickAsset = assets.find((item) => item.id === newAssetId);

  const resetCreate = () => {
    setNewTitle(''); setNewDescription(''); setNewPriority('medium'); setNewType('corrective'); setNewAssetId(''); setShowAssetPicker(false);
  };

  const submitCreate = async () => {
    if (!newTitle.trim()) return Alert.alert(copy.create, copy.title);
    setSaving(true);
    try {
      const created = await createWorkOrder({ title: newTitle, description: newDescription, priority: newPriority, workType: newType, assetId: newAssetId || undefined });
      resetCreate();
      setShowCreate(false);
      setSelected(created);
      await load();
    } catch (error: any) {
      Alert.alert(messages.common.saveError ?? 'Save error', error?.message ?? String(error));
    } finally { setSaving(false); }
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      const next = await updateWorkOrderStatus(selected.id, status);
      setSelected(next);
      await load();
    } catch (error: any) { Alert.alert(messages.common.saveError ?? 'Save error', error?.message ?? String(error)); }
    finally { setSaving(false); }
  };

  const openCloseout = () => {
    if (!selected) return;
    setRootCause(selected.rootCause ?? '');
    setCorrectiveAction(selected.correctiveAction ?? '');
    setDowntime(String(selected.downtimeMinutes ?? 0));
    setVerified(selected.postRepairVerified);
    setShowCloseout(true);
  };

  const saveCloseout = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const next = await updateWorkOrderCloseout(selected.id, { rootCause, correctiveAction, downtimeMinutes: Number(downtime || 0), postRepairVerified: verified });
      setSelected(next);
      setShowCloseout(false);
      await load();
    } catch (error: any) { Alert.alert(messages.common.saveError ?? 'Save error', error?.message ?? String(error)); }
    finally { setSaving(false); }
  };

  if (selected) {
    return (
      <View style={styles.page}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.iconButton}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity>
          <View style={{ flex: 1 }}><Text style={styles.detailEyebrow}>{selected.code}</Text><Text numberOfLines={1} style={styles.detailTitle}>{selected.title}</Text></View>
          <TouchableOpacity style={styles.iconButton}><Ionicons name="ellipsis-horizontal" size={22} color={colors.text} /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.workIcon}><Ionicons name={statusIcon(selected.status)} size={27} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.summaryName}>{selected.title}</Text><Text style={styles.summaryAsset}>{selected.asset ?? copy.noAsset}</Text></View>
              <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{selected.status.replaceAll('_', ' ')}</Text></View>
            </View>
            {selected.description ? <Text style={styles.description}>{selected.description}</Text> : null}
            <View style={styles.metricRow}>
              <View style={styles.metric}><Text style={styles.metricLabel}>{copy.priority}</Text><Text style={[styles.metricValue,{color:priorityTone(selected.priority)}]}>{selected.priority.toUpperCase()}</Text></View>
              <View style={styles.metric}><Text style={styles.metricLabel}>{copy.type}</Text><Text style={styles.metricValue}>{selected.workType}</Text></View>
              <View style={styles.metric}><Text style={styles.metricLabel}>{copy.downtime}</Text><Text style={styles.metricValue}>{selected.downtimeMinutes}</Text></View>
            </View>
          </View>

          <Text style={styles.blockTitle}>{copy.details}</Text>
          <View style={styles.infoCard}>
            {[[copy.asset, selected.asset ?? copy.noAsset],[copy.created, selected.requestedAt ? selected.requestedAt.replace('T',' ').slice(0,16) : '-'],[copy.due, selected.dueAt ? selected.dueAt.replace('T',' ').slice(0,16) : '-']].map(([label,value]) => <View key={label} style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>)}
          </View>

          <Text style={styles.blockTitle}>{copy.activity}</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}><View style={styles.timelineDot}/><View><Text style={styles.timelineTitle}>{copy.created}</Text><Text style={styles.timelineMeta}>{selected.requestedAt?.replace('T',' ').slice(0,16) ?? '-'}</Text></View></View>
            {selected.startedAt ? <View style={styles.timelineRow}><View style={styles.timelineDot}/><View><Text style={styles.timelineTitle}>{copy.start}</Text><Text style={styles.timelineMeta}>{selected.startedAt.replace('T',' ').slice(0,16)}</Text></View></View> : null}
            {selected.completedAt ? <View style={styles.timelineRow}><View style={styles.timelineDot}/><View><Text style={styles.timelineTitle}>{copy.complete}</Text><Text style={styles.timelineMeta}>{selected.completedAt.replace('T',' ').slice(0,16)}</Text></View></View> : null}
          </View>

          <Text style={styles.blockTitle}>{copy.editCloseout}</Text>
          <TouchableOpacity style={styles.closeoutCard} onPress={openCloseout}>
            <View style={{ flex: 1 }}><Text style={styles.closeoutTitle}>{selected.rootCause || copy.rootCause}</Text><Text style={styles.closeoutMeta}>{selected.correctiveAction || copy.correctiveAction}</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted}/>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.actionBar}>
          {selected.status !== 'in_progress' && selected.status !== 'completed' ? <TouchableOpacity disabled={saving} style={styles.secondaryAction} onPress={() => void changeStatus('in_progress')}><Ionicons name="play" size={18} color={colors.primary}/><Text style={styles.secondaryActionText}>{copy.start}</Text></TouchableOpacity> : null}
          {selected.status === 'in_progress' ? <TouchableOpacity disabled={saving} style={styles.secondaryAction} onPress={() => void changeStatus('on_hold')}><Ionicons name="pause" size={18} color={colors.primary}/><Text style={styles.secondaryActionText}>{copy.hold}</Text></TouchableOpacity> : null}
          {selected.status !== 'completed' ? <TouchableOpacity disabled={saving} style={styles.primaryAction} onPress={() => void changeStatus('completed')}><Ionicons name="checkmark" size={19} color="#fff"/><Text style={styles.primaryActionText}>{copy.complete}</Text></TouchableOpacity> : <TouchableOpacity disabled={saving} style={styles.primaryAction} onPress={() => void changeStatus('open')}><Ionicons name="refresh" size={19} color="#fff"/><Text style={styles.primaryActionText}>{copy.reopen}</Text></TouchableOpacity>}
        </View>

        <Modal visible={showCloseout} transparent animationType="slide" onRequestClose={() => setShowCloseout(false)}>
          <View style={styles.sheetRoot}><Pressable style={styles.scrim} onPress={() => setShowCloseout(false)}/><View style={styles.sheet}>
            <View style={styles.sheetHandle}/><Text style={styles.sheetTitle}>{copy.editCloseout}</Text>
            <Text style={styles.fieldLabel}>{copy.rootCause}</Text><TextInput value={rootCause} onChangeText={setRootCause} style={[styles.input,styles.multiline]} multiline />
            <Text style={styles.fieldLabel}>{copy.correctiveAction}</Text><TextInput value={correctiveAction} onChangeText={setCorrectiveAction} style={[styles.input,styles.multiline]} multiline />
            <Text style={styles.fieldLabel}>{copy.downtime}</Text><TextInput value={downtime} onChangeText={setDowntime} keyboardType="numeric" style={styles.input}/>
            <View style={styles.switchRow}><Text style={styles.switchText}>{copy.verified}</Text><Switch value={verified} onValueChange={setVerified}/></View>
            <TouchableOpacity style={styles.fullPrimary} disabled={saving} onPress={() => void saveCloseout()}>{saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.fullPrimaryText}>{copy.save}</Text>}</TouchableOpacity>
          </View></View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}><Ionicons name="chevron-back" size={23} color={colors.text}/></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.title}>{copy.title}</Text><Text style={styles.subtitle}>{title}</Text></View>
        <TouchableOpacity style={styles.addTop} onPress={() => setShowCreate(true)}><Ionicons name="add" size={22} color={colors.primary}/></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />} showsVerticalScrollIndicator={false}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}><Ionicons name="search-outline" size={19} color={colors.muted}/><TextInput value={query} onChangeText={setQuery} placeholder={copy.search} placeholderTextColor={colors.muted} style={styles.searchInput}/></View>
          <TouchableOpacity style={styles.toolButton} onPress={() => setShowSortSheet(true)}><Ionicons name="swap-vertical-outline" size={20} color={colors.text}/></TouchableOpacity>
          <TouchableOpacity style={[styles.toolButton, activeFilter !== 'open' && styles.toolButtonActive]} onPress={() => setShowFilterSheet(true)}><Ionicons name="funnel-outline" size={19} color={activeFilter !== 'open' ? colors.primary : colors.text}/></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {(['open','repair','mine','overdue','completed'] as WorkFilter[]).map((item) => <TouchableOpacity key={item} onPress={() => setActiveFilter(item)} style={[styles.quickChip,activeFilter===item&&styles.quickChipActive]}><Text style={[styles.quickText,activeFilter===item&&styles.quickTextActive]}>{copy[item]}</Text></TouchableOpacity>)}
        </ScrollView>

        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary}/></View> : null}
        {!loading && visible.length === 0 ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="clipboard-outline" size={36} color={colors.muted}/></View><Text style={styles.emptyTitle}>{rows.length ? copy.noResults : copy.noData}</Text><TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreate(true)}><Ionicons name="add" size={18} color="#fff"/><Text style={styles.emptyButtonText}>{copy.add}</Text></TouchableOpacity></View> : null}

        {!loading && visible.length > 0 ? <View style={styles.list}>{visible.map((row) => <TouchableOpacity key={row.id} style={styles.card} activeOpacity={0.72} onPress={() => setSelected(row)}>
          <View style={styles.cardIcon}><Ionicons name={statusIcon(row.status)} size={22} color={colors.primary}/></View>
          <View style={styles.cardBody}><View style={styles.cardTop}><Text style={styles.code}>{row.code}</Text><Text style={[styles.priority,{color:priorityTone(row.priority)}]}>{row.priority.toUpperCase()}</Text></View><Text style={styles.name}>{row.title}</Text><Text style={styles.meta}>{row.asset ?? copy.noAsset}</Text><View style={styles.metaRow}><Text style={styles.statusText}>{row.status.replaceAll('_',' ')}</Text>{row.dueAt ? <Text style={styles.meta}> · {row.dueAt.slice(0,10)}</Text> : null}</View></View><Ionicons name="chevron-forward" size={19} color={colors.muted}/>
        </TouchableOpacity>)}</View> : null}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}><Ionicons name="add" size={29} color="#fff"/></TouchableOpacity>

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.sheetRoot}><Pressable style={styles.scrim} onPress={() => setShowCreate(false)}/><View style={[styles.sheet,{maxHeight:'88%'}]}>
          <View style={styles.sheetHandle}/><View style={styles.sheetTitleRow}><Text style={styles.sheetTitle}>{copy.create}</Text><TouchableOpacity onPress={() => setShowCreate(false)}><Ionicons name="close" size={22} color={colors.text}/></TouchableOpacity></View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>{copy.title} *</Text><TextInput value={newTitle} onChangeText={setNewTitle} style={styles.input} placeholder={copy.add} placeholderTextColor={colors.muted}/>
            <Text style={styles.fieldLabel}>{copy.description}</Text><TextInput value={newDescription} onChangeText={setNewDescription} style={[styles.input,styles.multiline]} multiline/>
            <Text style={styles.fieldLabel}>{copy.asset}</Text><TouchableOpacity style={styles.select} onPress={() => setShowAssetPicker(!showAssetPicker)}><Text style={styles.selectText}>{pickAsset ? `${pickAsset.code} · ${pickAsset.name}` : copy.noAsset}</Text><Ionicons name="chevron-down" size={17} color={colors.muted}/></TouchableOpacity>
            {showAssetPicker ? <View style={styles.picker}><TouchableOpacity style={styles.pickerItem} onPress={() => {setNewAssetId('');setShowAssetPicker(false)}}><Text style={styles.pickerText}>{copy.noAsset}</Text></TouchableOpacity>{assets.map((asset)=><TouchableOpacity key={asset.id} style={styles.pickerItem} onPress={() => {setNewAssetId(asset.id);setShowAssetPicker(false)}}><Text style={styles.pickerText}>{asset.code} · {asset.name}</Text></TouchableOpacity>)}</View> : null}
            <Text style={styles.fieldLabel}>{copy.type}</Text><View style={styles.optionRow}>{['corrective','preventive','inspection'].map((item)=><TouchableOpacity key={item} style={[styles.option,newType===item&&styles.optionActive]} onPress={()=>setNewType(item)}><Text style={[styles.optionText,newType===item&&styles.optionTextActive]}>{copy[item as 'corrective']}</Text></TouchableOpacity>)}</View>
            <Text style={styles.fieldLabel}>{copy.priority}</Text><View style={styles.optionRow}>{['low','medium','high','urgent'].map((item)=><TouchableOpacity key={item} style={[styles.option,newPriority===item&&styles.optionActive]} onPress={()=>setNewPriority(item)}><Text style={[styles.optionText,newPriority===item&&styles.optionTextActive]}>{copy[item as 'low']}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity style={styles.fullPrimary} disabled={saving} onPress={() => void submitCreate()}>{saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.fullPrimaryText}>{copy.create}</Text>}</TouchableOpacity>
          </ScrollView>
        </View></View>
      </Modal>

      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <View style={styles.sheetRoot}><Pressable style={styles.scrim} onPress={() => setShowFilterSheet(false)}/><View style={styles.sheet}><View style={styles.sheetHandle}/><Text style={styles.sheetTitle}>{copy.filters}</Text>{(['open','repair','mine','overdue','completed'] as WorkFilter[]).map((item)=><TouchableOpacity key={item} style={styles.sheetOption} onPress={()=>{setActiveFilter(item);setShowFilterSheet(false)}}><Text style={styles.sheetOptionText}>{copy[item]}</Text>{activeFilter===item?<Ionicons name="checkmark" size={20} color={colors.primary}/>:null}</TouchableOpacity>)}</View></View>
      </Modal>

      <Modal visible={showSortSheet} transparent animationType="slide" onRequestClose={() => setShowSortSheet(false)}>
        <View style={styles.sheetRoot}><Pressable style={styles.scrim} onPress={() => setShowSortSheet(false)}/><View style={styles.sheet}><View style={styles.sheetHandle}/><Text style={styles.sheetTitle}>{copy.sort}</Text>{([['newest',copy.newest],['oldest',copy.oldest],['due',copy.dueSoon]] as [SortMode,string][]).map(([value,label])=><TouchableOpacity key={value} style={styles.sheetOption} onPress={()=>{setSortMode(value);setShowSortSheet(false)}}><Text style={styles.sheetOptionText}>{label}</Text>{sortMode===value?<Ionicons name="checkmark" size={20} color={colors.primary}/>:null}</TouchableOpacity>)}</View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},
  header:{minHeight:64,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:colors.surface,borderBottomWidth:1,borderBottomColor:colors.border},
  iconButton:{width:40,height:40,alignItems:'center',justifyContent:'center'},title:{fontSize:20,fontWeight:'900',color:colors.text},subtitle:{fontSize:11,color:colors.muted,marginTop:1},addTop:{width:40,height:40,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center',borderRadius:10},
  content:{padding:16,paddingBottom:130},searchRow:{flexDirection:'row',gap:8},searchBox:{flex:1,height:44,borderWidth:1,borderColor:colors.border,borderRadius:10,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',paddingHorizontal:11,gap:8},searchInput:{flex:1,color:colors.text,fontSize:13},toolButton:{width:44,height:44,borderWidth:1,borderColor:colors.border,borderRadius:10,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},toolButtonActive:{borderColor:colors.primary,backgroundColor:colors.primarySoft},
  quickRow:{gap:8,paddingTop:12,paddingBottom:4},quickChip:{height:34,paddingHorizontal:13,borderRadius:17,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},quickChipActive:{borderColor:colors.primary,backgroundColor:colors.primarySoft},quickText:{fontSize:11,fontWeight:'700',color:colors.muted},quickTextActive:{color:colors.primary,fontWeight:'900'},
  loading:{paddingVertical:60},list:{gap:9,marginTop:12},card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:13,flexDirection:'row',gap:10,alignItems:'center'},cardIcon:{width:42,height:42,borderRadius:12,backgroundColor:colors.primarySoft,alignItems:'center',justifyContent:'center'},cardBody:{flex:1},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:8},code:{fontSize:11,fontWeight:'900',color:colors.primary},priority:{fontSize:9,fontWeight:'900'},name:{fontSize:14,fontWeight:'900',color:colors.text,marginTop:3},meta:{fontSize:10,color:colors.muted,marginTop:3},metaRow:{flexDirection:'row',alignItems:'center'},statusText:{fontSize:10,fontWeight:'800',color:colors.text,marginTop:3,textTransform:'capitalize'},
  empty:{minHeight:300,alignItems:'center',justifyContent:'center'},emptyIcon:{width:68,height:68,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:15,fontWeight:'900',color:colors.text,marginTop:12},emptyButton:{marginTop:16,height:44,paddingHorizontal:15,borderRadius:10,backgroundColor:colors.primary,flexDirection:'row',alignItems:'center',gap:6},emptyButtonText:{color:'#fff',fontWeight:'900',fontSize:12},fab:{position:'absolute',right:18,bottom:92,width:56,height:56,borderRadius:28,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',elevation:7,shadowColor:'#000',shadowOpacity:0.18,shadowRadius:8},
  detailHeader:{minHeight:64,paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:colors.surface,borderBottomWidth:1,borderBottomColor:colors.border},detailEyebrow:{fontSize:10,fontWeight:'900',color:colors.primary},detailTitle:{fontSize:15,fontWeight:'900',color:colors.text,marginTop:1},detailContent:{padding:16,paddingBottom:110},summaryCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:16,padding:15},summaryTop:{flexDirection:'row',gap:11,alignItems:'center'},workIcon:{width:48,height:48,borderRadius:14,backgroundColor:colors.primarySoft,alignItems:'center',justifyContent:'center'},summaryName:{fontSize:17,fontWeight:'900',color:colors.text},summaryAsset:{fontSize:11,color:colors.muted,marginTop:3},statusBadge:{paddingHorizontal:8,paddingVertical:5,borderRadius:999,backgroundColor:colors.primarySoft},statusBadgeText:{fontSize:9,fontWeight:'900',color:colors.primary,textTransform:'uppercase'},description:{fontSize:12,lineHeight:18,color:colors.text,marginTop:13},metricRow:{flexDirection:'row',marginTop:15,borderTopWidth:1,borderTopColor:colors.border,paddingTop:12},metric:{flex:1},metricLabel:{fontSize:9,color:colors.muted},metricValue:{fontSize:11,fontWeight:'900',color:colors.text,marginTop:3,textTransform:'capitalize'},blockTitle:{fontSize:12,fontWeight:'900',color:colors.text,marginTop:18,marginBottom:8},infoCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:14,overflow:'hidden'},infoRow:{minHeight:46,paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,borderBottomWidth:1,borderBottomColor:colors.border},infoLabel:{fontSize:11,color:colors.muted},infoValue:{flex:1,textAlign:'right',fontSize:11,fontWeight:'700',color:colors.text},timelineCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:13,gap:14},timelineRow:{flexDirection:'row',gap:10,alignItems:'flex-start'},timelineDot:{width:8,height:8,borderRadius:4,backgroundColor:colors.primary,marginTop:4},timelineTitle:{fontSize:11,fontWeight:'800',color:colors.text},timelineMeta:{fontSize:10,color:colors.muted,marginTop:2},closeoutCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:13,flexDirection:'row',alignItems:'center',gap:8},closeoutTitle:{fontSize:12,fontWeight:'800',color:colors.text},closeoutMeta:{fontSize:10,color:colors.muted,marginTop:4},
  actionBar:{position:'absolute',left:0,right:0,bottom:0,minHeight:68,padding:10,flexDirection:'row',gap:8,backgroundColor:colors.surface,borderTopWidth:1,borderTopColor:colors.border},secondaryAction:{flex:1,height:46,borderWidth:1,borderColor:colors.border,borderRadius:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},secondaryActionText:{fontSize:12,fontWeight:'900',color:colors.primary},primaryAction:{flex:1.3,height:46,borderRadius:10,backgroundColor:colors.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},primaryActionText:{fontSize:12,fontWeight:'900',color:'#fff'},
  sheetRoot:{flex:1,justifyContent:'flex-end'},scrim:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(15,23,42,0.44)'},sheet:{backgroundColor:colors.surface,borderTopLeftRadius:22,borderTopRightRadius:22,padding:18,paddingBottom:28},sheetHandle:{width:42,height:4,borderRadius:2,backgroundColor:colors.border,alignSelf:'center',marginBottom:14},sheetTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},sheetTitle:{fontSize:17,fontWeight:'900',color:colors.text,marginBottom:14},sheetOption:{minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderTopColor:colors.border},sheetOptionText:{fontSize:13,fontWeight:'700',color:colors.text},fieldLabel:{fontSize:11,fontWeight:'800',color:colors.text,marginTop:12,marginBottom:6},input:{minHeight:45,borderWidth:1,borderColor:colors.border,borderRadius:10,backgroundColor:colors.background,paddingHorizontal:11,color:colors.text,fontSize:13},multiline:{minHeight:82,paddingTop:10,textAlignVertical:'top'},switchRow:{minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},switchText:{flex:1,fontSize:12,fontWeight:'700',color:colors.text},select:{minHeight:45,borderWidth:1,borderColor:colors.border,borderRadius:10,backgroundColor:colors.background,paddingHorizontal:11,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},selectText:{fontSize:12,color:colors.text,flex:1},picker:{borderWidth:1,borderColor:colors.border,borderTopWidth:0,maxHeight:180},pickerItem:{minHeight:42,paddingHorizontal:10,justifyContent:'center',borderTopWidth:1,borderTopColor:colors.border},pickerText:{fontSize:11,color:colors.text},optionRow:{flexDirection:'row',flexWrap:'wrap',gap:7},option:{minHeight:36,paddingHorizontal:11,borderWidth:1,borderColor:colors.border,borderRadius:9,alignItems:'center',justifyContent:'center'},optionActive:{borderColor:colors.primary,backgroundColor:colors.primarySoft},optionText:{fontSize:11,fontWeight:'700',color:colors.muted},optionTextActive:{color:colors.primary,fontWeight:'900'},fullPrimary:{height:48,borderRadius:10,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',marginTop:18},fullPrimaryText:{fontSize:13,fontWeight:'900',color:'#fff'},
});
