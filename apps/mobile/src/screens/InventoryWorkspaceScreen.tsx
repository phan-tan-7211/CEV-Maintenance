import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { Locale } from '../i18n';
import { getInventoryUi } from '../i18n/inventoryUi';
import { adjustInventoryStock, createInventoryPart, listCompatibleAssets, listInventoryLocations, listInventoryParts, type InventoryLocation, type InventoryPart } from '../data/inventoryRepository';

type Props = { messages: any; locale?: Locale; onBack: () => void };
type QuickFilter = 'all' | 'low' | 'out' | 'healthy';
type SortKey = 'name' | 'stock' | 'code';

export function InventoryWorkspaceScreen({ messages, locale, onBack }: Props) {
  const resolvedLocale: Locale = locale ?? (messages.nav.home === 'Home' ? 'en' : messages.nav.home === '홈' ? 'ko' : 'vi');
  const copy = useMemo(() => getInventoryUi(resolvedLocale), [resolvedLocale]);
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<QuickFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOpen, setSortOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<InventoryPart | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [compatible, setCompatible] = useState<{ id: string; code: string; name: string; critical: boolean; preferredQuantity?: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [specification, setSpecification] = useState('');
  const [unit, setUnit] = useState('EA');
  const [notes, setNotes] = useState('');
  const [locationId, setLocationId] = useState('');
  const [initialQty, setInitialQty] = useState('0');
  const [minQty, setMinQty] = useState('0');
  const [maxQty, setMaxQty] = useState('');
  const [delta, setDelta] = useState('1');
  const [adjustMode, setAdjustMode] = useState<'receive' | 'issue'>('receive');

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [nextParts, nextLocations] = await Promise.all([listInventoryParts(), listInventoryLocations()]);
      setParts(nextParts); setLocations(nextLocations);
    } catch (error: any) { Alert.alert('Inventory', error?.message ?? String(error)); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return parts.filter((part) => {
      if (filter === 'low' && !part.lowStock) return false;
      if (filter === 'out' && !part.outOfStock) return false;
      if (filter === 'healthy' && (part.lowStock || part.outOfStock)) return false;
      if (!needle) return true;
      return [part.code, part.name, part.specification ?? ''].some((value) => value.toLowerCase().includes(needle));
    }).sort((a, b) => sortKey === 'stock' ? a.totalQuantity - b.totalQuantity : sortKey === 'code' ? a.code.localeCompare(b.code) : a.name.localeCompare(b.name));
  }, [parts, filter, query, sortKey]);

  const counts = useMemo(() => ({ low: parts.filter((part) => part.lowStock).length, out: parts.filter((part) => part.outOfStock).length, healthy: parts.filter((part) => !part.lowStock && !part.outOfStock).length }), [parts]);

  const resetCreate = () => { setName(''); setSpecification(''); setUnit('EA'); setNotes(''); setLocationId(''); setInitialQty('0'); setMinQty('0'); setMaxQty(''); };
  const createPart = async () => {
    if (!name.trim()) return Alert.alert(copy.name);
    setSaving(true);
    try {
      await createInventoryPart({ name, specification, unit, notes, locationId: locationId || undefined, quantity: Number(initialQty || 0), minQuantity: Number(minQty || 0), maxQuantity: maxQty ? Number(maxQty) : undefined });
      setCreateOpen(false); resetCreate(); await load(true);
    } catch (error: any) { Alert.alert(copy.newPart, error?.message ?? String(error)); }
    finally { setSaving(false); }
  };

  const openDetail = async (part: InventoryPart) => {
    setDetail(part); setCompatible([]);
    try { setCompatible(await listCompatibleAssets(part.id)); } catch { setCompatible([]); }
  };

  const adjust = async () => {
    if (!detail || !locationId) return Alert.alert(copy.chooseLocation);
    const amount = Math.abs(Number(delta || 0));
    if (!amount) return;
    setSaving(true);
    try {
      await adjustInventoryStock({ partId: detail.id, locationId, delta: adjustMode === 'receive' ? amount : -amount });
      setAdjustOpen(false); setDelta('1'); await load(true);
      const refreshed = (await listInventoryParts()).find((part) => part.id === detail.id); if (refreshed) setDetail(refreshed);
    } catch (error: any) { Alert.alert(copy.adjust, error?.message ?? String(error)); }
    finally { setSaving(false); }
  };

  return <View style={styles.page}>
    <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text}/></TouchableOpacity><View style={{ flex: 1 }}><Text style={styles.title}>{copy.title}</Text><Text style={styles.subtitle}>{copy.subtitle}</Text></View><TouchableOpacity style={styles.addTop} onPress={() => setCreateOpen(true)}><Ionicons name="add" size={20} color="#fff"/></TouchableOpacity></View>
    <View style={styles.toolbar}><View style={styles.search}><Ionicons name="search-outline" size={18} color={colors.muted}/><TextInput value={query} onChangeText={setQuery} placeholder={copy.search} placeholderTextColor={colors.muted} style={styles.searchInput}/></View><TouchableOpacity style={styles.sortButton} onPress={() => setSortOpen(true)}><Ionicons name="swap-vertical-outline" size={19} color={colors.text}/></TouchableOpacity></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{([
      ['all', copy.all, parts.length], ['low', copy.low, counts.low], ['out', copy.out, counts.out], ['healthy', copy.healthy, counts.healthy]
    ] as const).map(([key,label,count]) => <TouchableOpacity key={key} onPress={() => setFilter(key)} style={[styles.chip, filter===key && styles.chipActive]}><Text style={[styles.chipText, filter===key && styles.chipTextActive]}>{label} · {count}</Text></TouchableOpacity>)}</ScrollView>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)}/>}>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary}/> : visible.length === 0 ? <View style={styles.empty}><Ionicons name="cube-outline" size={38} color={colors.muted}/><Text style={styles.emptyTitle}>{parts.length ? copy.noResult : copy.noData}</Text></View> : visible.map((part) => <TouchableOpacity key={part.id} style={styles.card} onPress={() => void openDetail(part)} activeOpacity={0.75}>
        <View style={styles.cardTop}><View style={styles.partIcon}><Ionicons name="construct-outline" size={20} color={colors.primary}/></View><View style={{ flex:1 }}><Text style={styles.code}>{part.code}</Text><Text style={styles.name}>{part.name}</Text><Text style={styles.spec}>{part.specification || '-'}</Text></View>{part.outOfStock ? <Text style={styles.outBadge}>{copy.outBadge}</Text> : part.lowStock ? <Text style={styles.lowBadge}>{copy.lowBadge}</Text> : null}</View>
        <View style={styles.stockRow}><Text style={styles.stockLabel}>{copy.stock}</Text><Text style={styles.stockValue}>{part.totalQuantity} {part.unit}</Text><Text style={styles.minText}>{copy.minimum}: {part.totalMinQuantity}</Text></View>
      </TouchableOpacity>)}
    </ScrollView>
    <TouchableOpacity style={styles.fab} onPress={() => setCreateOpen(true)}><Ionicons name="add" size={28} color="#fff"/></TouchableOpacity>

    <Modal visible={sortOpen} transparent animationType="slide" onRequestClose={() => setSortOpen(false)}><Pressable style={styles.overlay} onPress={() => setSortOpen(false)}/><View style={styles.sheet}><Text style={styles.sheetTitle}>{copy.sort}</Text>{([['name',copy.byName],['stock',copy.byStock],['code',copy.byCode]] as const).map(([key,label]) => <TouchableOpacity key={key} style={styles.sheetRow} onPress={() => { setSortKey(key); setSortOpen(false); }}><Text style={styles.sheetRowText}>{label}</Text>{sortKey===key ? <Ionicons name="checkmark" size={20} color={colors.primary}/> : null}</TouchableOpacity>)}</View></Modal>

    <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}><Pressable style={styles.overlay} onPress={() => setCreateOpen(false)}/><View style={styles.sheetTall}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{copy.newPart}</Text><TouchableOpacity onPress={() => setCreateOpen(false)}><Ionicons name="close" size={24} color={colors.text}/></TouchableOpacity></View><ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      {field(copy.name, name, setName, true)}{field(copy.specification, specification, setSpecification)}{field(copy.unit, unit, setUnit)}{field(copy.notes, notes, setNotes)}
      <Text style={styles.label}>{copy.location}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingBottom:10 }}>{locations.map((loc) => <TouchableOpacity key={loc.id} onPress={() => setLocationId(loc.id)} style={[styles.locationChip, locationId===loc.id && styles.locationChipActive]}><Text style={[styles.locationText, locationId===loc.id && styles.locationTextActive]}>{loc.name}</Text></TouchableOpacity>)}</ScrollView>
      {field(copy.initialQty, initialQty, setInitialQty)}{field(copy.minQty, minQty, setMinQty)}{field(copy.maxQty, maxQty, setMaxQty)}<Text style={styles.note}>{copy.codeAuto}</Text>
      <TouchableOpacity disabled={saving} style={styles.primaryButton} onPress={() => void createPart()}>{saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryText}>{copy.save}</Text>}</TouchableOpacity>
    </ScrollView></View></Modal>

    <Modal visible={Boolean(detail)} transparent animationType="slide" onRequestClose={() => setDetail(null)}><Pressable style={styles.overlay} onPress={() => setDetail(null)}/>{detail ? <View style={styles.sheetTall}><View style={styles.sheetHeader}><View><Text style={styles.code}>{detail.code}</Text><Text style={styles.sheetTitle}>{detail.name}</Text></View><TouchableOpacity onPress={() => setDetail(null)}><Ionicons name="close" size={24} color={colors.text}/></TouchableOpacity></View><ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.summaryGrid}><View style={styles.summaryBox}><Text style={styles.summaryLabel}>{copy.stock}</Text><Text style={styles.summaryValue}>{detail.totalQuantity} {detail.unit}</Text></View><View style={styles.summaryBox}><Text style={styles.summaryLabel}>{copy.minimum}</Text><Text style={styles.summaryValue}>{detail.totalMinQuantity}</Text></View></View>
      <Text style={styles.sectionTitle}>{copy.inventoryByLocation}</Text>{detail.stocks.length ? detail.stocks.map((stock) => <View key={stock.id} style={styles.detailRow}><View><Text style={styles.detailName}>{stock.locationName}</Text><Text style={styles.detailMeta}>{copy.minimum}: {stock.minQuantity}{stock.maxQuantity != null ? ` · Max: ${stock.maxQuantity}` : ''}</Text></View><Text style={styles.detailQty}>{stock.quantity} {detail.unit}</Text></View>) : <Text style={styles.emptySmall}>{copy.noStockLocation}</Text>}
      <TouchableOpacity style={styles.secondaryButton} onPress={() => { setLocationId(detail.stocks[0]?.locationId ?? locations[0]?.id ?? ''); setAdjustOpen(true); }}><Ionicons name="options-outline" size={18} color={colors.primary}/><Text style={styles.secondaryText}>{copy.adjust}</Text></TouchableOpacity>
      <Text style={styles.sectionTitle}>{copy.compatible}</Text>{compatible.length ? compatible.map((asset) => <View key={asset.id} style={styles.detailRow}><View><Text style={styles.detailName}>{asset.name}</Text><Text style={styles.detailMeta}>{asset.code}{asset.critical ? ' · CRITICAL' : ''}</Text></View>{asset.preferredQuantity != null ? <Text style={styles.detailQty}>{asset.preferredQuantity}</Text> : null}</View>) : <Text style={styles.emptySmall}>{copy.noCompatible}</Text>}
    </ScrollView></View> : null}</Modal>

    <Modal visible={adjustOpen} transparent animationType="fade" onRequestClose={() => setAdjustOpen(false)}><Pressable style={styles.overlay} onPress={() => setAdjustOpen(false)}/><View style={styles.dialog}><Text style={styles.sheetTitle}>{copy.adjust}</Text><View style={styles.segment}><TouchableOpacity onPress={() => setAdjustMode('receive')} style={[styles.segmentItem,adjustMode==='receive'&&styles.segmentActive]}><Text style={styles.segmentText}>{copy.receive}</Text></TouchableOpacity><TouchableOpacity onPress={() => setAdjustMode('issue')} style={[styles.segmentItem,adjustMode==='issue'&&styles.segmentActive]}><Text style={styles.segmentText}>{copy.issue}</Text></TouchableOpacity></View><Text style={styles.label}>{copy.location}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingBottom:10 }}>{locations.map((loc) => <TouchableOpacity key={loc.id} onPress={() => setLocationId(loc.id)} style={[styles.locationChip,locationId===loc.id&&styles.locationChipActive]}><Text style={[styles.locationText,locationId===loc.id&&styles.locationTextActive]}>{loc.name}</Text></TouchableOpacity>)}</ScrollView>{field(copy.quantity,delta,setDelta,true)}<TouchableOpacity disabled={saving} style={styles.primaryButton} onPress={() => void adjust()}>{saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryText}>{copy.save}</Text>}</TouchableOpacity></View></Modal>
  </View>;
}

function field(label: string, value: string, onChange: (value:string)=>void, required=false) { return <View style={{ marginBottom: 12 }}><Text style={styles.label}>{label}{required?' *':''}</Text><TextInput value={value} onChangeText={onChange} placeholderTextColor={colors.muted} style={styles.input}/></View>; }

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},header:{paddingHorizontal:16,paddingTop:10,paddingBottom:10,flexDirection:'row',alignItems:'center',gap:8},back:{width:38,height:38,alignItems:'center',justifyContent:'center'},title:{fontSize:24,fontWeight:'900',color:colors.text},subtitle:{fontSize:11,color:colors.muted,marginTop:2},addTop:{width:38,height:38,borderRadius:10,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'},toolbar:{paddingHorizontal:16,flexDirection:'row',gap:8},search:{flex:1,height:44,borderWidth:1,borderColor:colors.border,borderRadius:12,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',paddingHorizontal:11},searchInput:{flex:1,color:colors.text,fontSize:13,marginLeft:7},sortButton:{width:44,height:44,borderWidth:1,borderColor:colors.border,borderRadius:12,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},chips:{paddingHorizontal:16,paddingVertical:11,gap:8},chip:{height:32,paddingHorizontal:12,borderWidth:1,borderColor:colors.border,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},chipActive:{borderColor:colors.primary,backgroundColor:colors.primarySoft},chipText:{fontSize:11,fontWeight:'700',color:colors.muted},chipTextActive:{color:colors.primary},content:{padding:16,paddingTop:2,paddingBottom:120,gap:10},card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:15,padding:13},cardTop:{flexDirection:'row',gap:10,alignItems:'flex-start'},partIcon:{width:39,height:39,borderRadius:11,backgroundColor:colors.primarySoft,alignItems:'center',justifyContent:'center'},code:{color:colors.primary,fontSize:11,fontWeight:'900'},name:{color:colors.text,fontSize:15,fontWeight:'900',marginTop:2},spec:{color:colors.muted,fontSize:11,marginTop:3},lowBadge:{fontSize:9,fontWeight:'900',color:colors.warning,backgroundColor:'#FFF7ED',paddingHorizontal:7,paddingVertical:4,borderRadius:999},outBadge:{fontSize:9,fontWeight:'900',color:colors.danger,backgroundColor:'#FEF2F2',paddingHorizontal:7,paddingVertical:4,borderRadius:999},stockRow:{marginTop:12,paddingTop:10,borderTopWidth:1,borderTopColor:colors.border,flexDirection:'row',alignItems:'center'},stockLabel:{fontSize:11,color:colors.muted},stockValue:{fontSize:15,fontWeight:'900',color:colors.text,marginLeft:7},minText:{fontSize:10,color:colors.muted,marginLeft:'auto'},fab:{position:'absolute',right:18,bottom:82,width:54,height:54,borderRadius:27,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',elevation:8},empty:{alignItems:'center',paddingVertical:60},emptyTitle:{color:colors.muted,fontWeight:'800',marginTop:10},overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(15,23,42,0.38)'},sheet:{position:'absolute',left:0,right:0,bottom:0,backgroundColor:colors.surface,borderTopLeftRadius:22,borderTopRightRadius:22,padding:18,paddingBottom:30},sheetTall:{position:'absolute',left:0,right:0,bottom:0,maxHeight:'86%',backgroundColor:colors.surface,borderTopLeftRadius:22,borderTopRightRadius:22,padding:18},sheetHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},sheetTitle:{fontSize:18,fontWeight:'900',color:colors.text},sheetRow:{minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:colors.border},sheetRowText:{fontSize:14,fontWeight:'700',color:colors.text},label:{fontSize:11,fontWeight:'800',color:colors.text,marginBottom:6},input:{minHeight:44,borderWidth:1,borderColor:colors.border,borderRadius:10,paddingHorizontal:12,color:colors.text,backgroundColor:colors.background},locationChip:{paddingHorizontal:10,height:34,borderWidth:1,borderColor:colors.border,borderRadius:17,alignItems:'center',justifyContent:'center'},locationChipActive:{borderColor:colors.primary,backgroundColor:colors.primarySoft},locationText:{fontSize:11,color:colors.muted},locationTextActive:{color:colors.primary,fontWeight:'800'},note:{fontSize:11,color:colors.muted,marginBottom:12},primaryButton:{height:48,borderRadius:12,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontSize:14,fontWeight:'900'},summaryGrid:{flexDirection:'row',gap:10},summaryBox:{flex:1,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:13},summaryLabel:{fontSize:10,color:colors.muted},summaryValue:{fontSize:18,fontWeight:'900',color:colors.text,marginTop:4},sectionTitle:{fontSize:13,fontWeight:'900',color:colors.text,marginTop:18,marginBottom:8},detailRow:{minHeight:50,borderBottomWidth:1,borderBottomColor:colors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},detailName:{fontSize:13,fontWeight:'800',color:colors.text},detailMeta:{fontSize:10,color:colors.muted,marginTop:3},detailQty:{fontSize:13,fontWeight:'900',color:colors.text},emptySmall:{fontSize:11,color:colors.muted,paddingVertical:12},secondaryButton:{height:44,borderWidth:1,borderColor:colors.primary,borderRadius:12,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',marginTop:12},secondaryText:{color:colors.primary,fontSize:12,fontWeight:'900'},dialog:{position:'absolute',left:24,right:24,top:'24%',backgroundColor:colors.surface,borderRadius:18,padding:18},segment:{flexDirection:'row',backgroundColor:colors.background,borderRadius:10,padding:3,marginVertical:14},segmentItem:{flex:1,height:38,alignItems:'center',justifyContent:'center',borderRadius:8},segmentActive:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},segmentText:{fontSize:12,fontWeight:'800',color:colors.text}
});
