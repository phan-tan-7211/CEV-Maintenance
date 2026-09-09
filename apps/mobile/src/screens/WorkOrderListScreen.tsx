import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { listWorkOrders, type WorkFilter, type WorkOrderRow } from '../data/workOrderRepository';

type Props = { title: string; filter: WorkFilter; messages: any; onBack: () => void };

export function WorkOrderListScreen({ title, filter, messages, onBack }: Props) {
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { setRows(await listWorkOrders(filter)); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { void load(); }, [filter]);
  return <View style={styles.page}>
    <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /><Text style={styles.backText}>{messages.nav.work}</Text></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
      <Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{messages.work.subtitle}</Text>
      <View style={styles.live}><View style={styles.dot}/><Text style={styles.liveText}>SUPABASE · LIVE DATA</Text></View>
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary}/></View> : <View style={styles.list}>{rows.map((row) => <View key={row.id} style={styles.card}>
        <View style={styles.icon}><Ionicons name="clipboard-outline" size={20} color={colors.primary}/></View>
        <View style={styles.body}><View style={styles.top}><Text style={styles.code}>{row.code}</Text><Text style={styles.priority}>{row.priority.toUpperCase()}</Text></View><Text style={styles.name}>{row.title}</Text><Text style={styles.meta}>{row.asset ?? '-'}</Text><Text style={styles.meta}>{row.status}{row.dueAt ? ` · ${String(row.dueAt).replace('T',' ').slice(0,16)}` : ''}</Text></View>
      </View>)}{rows.length===0 ? <Text style={styles.empty}>Không có dữ liệu.</Text> : null}</View>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  page:{flex:1},header:{minHeight:54,paddingHorizontal:12,justifyContent:'center'},back:{flexDirection:'row',alignItems:'center',alignSelf:'flex-start'},backText:{color:colors.text,fontSize:14,fontWeight:'700'},content:{padding:18,paddingTop:4,paddingBottom:110},title:{fontSize:26,fontWeight:'900',color:colors.text},subtitle:{fontSize:13,color:colors.muted,marginTop:6},live:{alignSelf:'flex-start',marginTop:10,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#ECFDF3',paddingHorizontal:9,paddingVertical:5,borderRadius:999},dot:{width:7,height:7,borderRadius:4,backgroundColor:colors.success},liveText:{fontSize:10,fontWeight:'900',color:colors.success},loading:{paddingVertical:50},list:{gap:10,marginTop:16},card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:16,padding:14,flexDirection:'row',gap:11},icon:{width:40,height:40,borderRadius:12,backgroundColor:colors.primarySoft,alignItems:'center',justifyContent:'center'},body:{flex:1},top:{flexDirection:'row',justifyContent:'space-between',gap:8},code:{color:colors.primary,fontSize:12,fontWeight:'900'},priority:{color:colors.warning,fontSize:10,fontWeight:'900'},name:{color:colors.text,fontSize:15,fontWeight:'800',marginTop:4},meta:{color:colors.muted,fontSize:11,marginTop:4},empty:{color:colors.muted,textAlign:'center',padding:30}
});
