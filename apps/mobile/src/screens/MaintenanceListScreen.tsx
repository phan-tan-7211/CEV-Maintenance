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
import { getMaintenanceUi } from '../i18n/maintenanceUi';
import {
  completeMaintenanceExecution,
  getTodayPrestartState,
  listDailyChecks,
  listMaintenanceAssets,
  listMaintenanceExecutions,
  listMaintenancePlans,
  saveMaintenancePlan,
  setMaintenancePlanActive,
  startMaintenanceExecution,
  submitDailyCheck,
  type ChecklistAnswer,
  type ChecklistItem,
  type FrequencyUnit,
  type MaintenanceAsset,
  type MaintenanceExecution,
  type MaintenanceFilter,
  type MaintenanceKind,
  type MaintenancePlan,
  type MaintenanceStatusFilter,
} from '../data/maintenanceRepository';

type Props = { title: string; filter: MaintenanceFilter; messages: any; locale?: Locale; onBack: () => void };
type WorkspaceTab = 'plans' | 'tasks' | 'daily';
type PlanStateFilter = 'all' | 'active' | 'inactive';
type PlanSort = 'due' | 'name';

type PrestartState = {
  asset: MaintenanceAsset;
  plan?: MaintenancePlan;
  completed?: { id: string; result: 'pass' | 'fail' | 'na'; checkedAt: string };
};

function inferLocale(messages: any): Locale {
  if (messages?.nav?.home === 'Home') return 'en';
  if (messages?.nav?.home === '홈') return 'ko';
  return 'vi';
}

function dateText(value?: string) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 16);
}

function pillTone(result?: string) {
  if (result === 'fail') return { bg: '#FEF2F2', fg: colors.danger };
  if (result === 'pass' || result === 'completed') return { bg: '#ECFDF3', fg: colors.success };
  if (result === 'in_progress') return { bg: '#EFF6FF', fg: colors.primary };
  return { bg: '#FFF7ED', fg: colors.warning };
}

export function MaintenanceListScreen({ title, filter, messages, locale, onBack }: Props) {
  const resolvedLocale = locale ?? inferLocale(messages);
  const copy = useMemo(() => getMaintenanceUi(resolvedLocale), [resolvedLocale]);
  const initialTaskFilter: MaintenanceStatusFilter = filter === 'history' ? 'completed' : filter === 'today' ? 'due' : 'upcoming';

  const [tab, setTab] = useState<WorkspaceTab>(filter === 'history' ? 'tasks' : 'plans');
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [tasks, setTasks] = useState<MaintenanceExecution[]>([]);
  const [prestarts, setPrestarts] = useState<PrestartState[]>([]);
  const [dailyHistory, setDailyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');

  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanStateFilter>('all');
  const [planSort, setPlanSort] = useState<PlanSort>('due');
  const [taskFilter, setTaskFilter] = useState<MaintenanceStatusFilter>(initialTaskFilter);

  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<MaintenanceExecution | null>(null);
  const [selectedPrestart, setSelectedPrestart] = useState<PrestartState | null>(null);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setErrorText('');
    try {
      const [planRows, taskRows, dailyRows, historyRows] = await Promise.all([
        listMaintenancePlans(),
        listMaintenanceExecutions(taskFilter),
        getTodayPrestartState(),
        listDailyChecks(undefined, 40),
      ]);
      setPlans(planRows);
      setTasks(taskRows);
      setPrestarts(dailyRows as PrestartState[]);
      setDailyHistory(historyRows);
    } catch (error: any) {
      setErrorText(error?.message ?? String(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, [taskFilter]);

  const visiblePlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plans
      .filter((plan) => planFilter === 'all' || (planFilter === 'active' ? plan.active : !plan.active))
      .filter((plan) => !q || `${plan.code} ${plan.name} ${plan.asset ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => planSort === 'name' ? a.name.localeCompare(b.name) : String(a.nextDueDate ?? '9999').localeCompare(String(b.nextDueDate ?? '9999')));
  }, [plans, planFilter, planSort, query]);

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((row) => !q || `${row.planCode} ${row.planName} ${row.asset}`.toLowerCase().includes(q));
  }, [tasks, query]);

  const refreshAfterAction = async () => { await load(true); };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.title}>{copy.workspace}</Text><Text style={styles.subtitle}>{title || copy.subtitle}</Text></View>
        {tab === 'plans' ? <TouchableOpacity onPress={() => setEditingPlan(null)} style={styles.addButton}><Ionicons name="add" size={22} color={colors.primary} /></TouchableOpacity> : null}
      </View>

      <View style={styles.tabs}>
        {(['plans', 'tasks', 'daily'] as WorkspaceTab[]).map((key) => <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}><Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{copy[key]}</Text></TouchableOpacity>)}
      </View>

      {tab !== 'daily' ? <View style={styles.searchRow}><Ionicons name="search-outline" size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={copy.search} placeholderTextColor={colors.muted} style={styles.searchInput} /></View> : null}

      {tab === 'plans' ? <View style={styles.toolbar}>
        {(['all', 'active', 'inactive'] as PlanStateFilter[]).map((key) => <TouchableOpacity key={key} onPress={() => setPlanFilter(key)} style={[styles.filterChip, planFilter === key && styles.filterChipActive]}><Text style={[styles.filterChipText, planFilter === key && styles.filterChipTextActive]}>{copy[key]}</Text></TouchableOpacity>)}
        <TouchableOpacity onPress={() => setPlanSort(planSort === 'due' ? 'name' : 'due')} style={styles.sortChip}><Ionicons name="swap-vertical" size={15} color={colors.muted} /><Text style={styles.sortText}>{planSort === 'due' ? copy.nextDue : copy.planName}</Text></TouchableOpacity>
      </View> : null}

      {tab === 'tasks' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
        {(['due', 'upcoming', 'overdue', 'completed'] as MaintenanceStatusFilter[]).map((key) => <TouchableOpacity key={key} onPress={() => setTaskFilter(key)} style={[styles.filterChip, taskFilter === key && styles.filterChipActive]}><Text style={[styles.filterChipText, taskFilter === key && styles.filterChipTextActive]}>{copy[key]}</Text></TouchableOpacity>)}
      </ScrollView> : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
        <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>SUPABASE · LIVE DATA</Text></View>
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>{copy.loading}</Text></View> : null}
        {!loading && errorText ? <View style={styles.errorCard}><Text style={styles.errorTitle}>{copy.loadError}</Text><Text style={styles.errorText}>{errorText}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>{copy.retry}</Text></TouchableOpacity></View> : null}

        {!loading && !errorText && tab === 'plans' ? <View style={styles.list}>
          {visiblePlans.map((plan) => <TouchableOpacity key={plan.id} style={styles.card} onPress={() => setEditingPlan(plan)}>
            <View style={[styles.cardIcon, { backgroundColor: plan.kind === 'prestart' ? '#F5F3FF' : colors.primarySoft }]}><Ionicons name={plan.kind === 'prestart' ? 'shield-checkmark-outline' : 'calendar-outline'} size={21} color={plan.kind === 'prestart' ? '#7C3AED' : colors.primary} /></View>
            <View style={{ flex: 1 }}><View style={styles.cardTop}><Text style={styles.code}>{plan.code}</Text><View style={[styles.miniPill, { backgroundColor: plan.active ? '#ECFDF3' : '#F3F4F6' }]}><Text style={[styles.miniPillText, { color: plan.active ? colors.success : colors.muted }]}>{plan.active ? copy.active : copy.inactive}</Text></View></View><Text style={styles.cardTitle}>{plan.name}</Text><Text style={styles.meta}>{plan.asset ?? '-'}</Text><Text style={styles.meta}>{copy.frequency}: {plan.frequencyValue} {copy[plan.frequencyUnit]} · {copy.nextDue}: {dateText(plan.nextDueDate)}</Text><Text style={styles.meta}>{copy.checklist}: {plan.checklist.length}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>)}
          {visiblePlans.length === 0 ? <EmptyState icon="calendar-clear-outline" text={copy.noPlans} /> : null}
        </View> : null}

        {!loading && !errorText && tab === 'tasks' ? <View style={styles.list}>
          {visibleTasks.map((task) => {
            const tone = pillTone(task.status === 'completed' ? task.result ?? 'completed' : task.status);
            return <TouchableOpacity key={task.id} style={styles.card} onPress={() => setSelectedTask(task)}>
              <View style={styles.cardIcon}><Ionicons name={task.status === 'completed' ? 'checkmark-circle-outline' : task.status === 'in_progress' ? 'play-circle-outline' : 'construct-outline'} size={21} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><View style={styles.cardTop}><Text style={styles.code}>{task.planCode}</Text><View style={[styles.miniPill,{backgroundColor:tone.bg}]}><Text style={[styles.miniPillText,{color:tone.fg}]}>{task.status === 'completed' ? copy.completed : task.status === 'in_progress' ? copy.statusInProgress : copy.statusPending}</Text></View></View><Text style={styles.cardTitle}>{task.planName}</Text><Text style={styles.meta}>{task.asset}</Text><Text style={styles.meta}>{copy.nextDue}: {dateText(task.dueDate)}</Text>{task.workOrderId ? <Text style={[styles.meta,{color:colors.primary}]}>{copy.linkedWorkOrder}: {task.workOrderId.slice(0,8)}</Text> : null}</View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>;
          })}
          {visibleTasks.length === 0 ? <EmptyState icon="checkmark-done-outline" text={copy.noTasks} /> : null}
        </View> : null}

        {!loading && !errorText && tab === 'daily' ? <View style={styles.list}>
          <Text style={styles.sectionTitle}>{copy.todayTasks}</Text>
          {prestarts.map((state) => <TouchableOpacity key={state.asset.id} style={styles.card} onPress={() => state.plan ? setSelectedPrestart(state) : undefined}>
            <View style={[styles.cardIcon,{backgroundColor: state.completed ? '#ECFDF3' : '#FFF7ED'}]}><Ionicons name={state.completed ? 'checkmark-circle' : 'flash-outline'} size={21} color={state.completed ? colors.success : colors.warning} /></View>
            <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{state.asset.name}</Text><Text style={styles.meta}>{state.asset.code}{state.asset.type ? ` · ${state.asset.type}` : ''}</Text>{state.completed ? <Text style={[styles.meta,{color:colors.success}]}>{copy.doneToday} · {dateText(state.completed.checkedAt)}</Text> : state.plan ? <Text style={styles.meta}>{state.plan.name} · {state.plan.checklist.length} {copy.checklist.toLowerCase()}</Text> : <Text style={[styles.meta,{color:colors.warning}]}>{copy.missingTemplate}</Text>}</View>
            {state.plan ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
          </TouchableOpacity>)}
          {prestarts.length === 0 ? <EmptyState icon="shield-checkmark-outline" text={copy.noDaily} /> : null}

          <Text style={[styles.sectionTitle,{marginTop:22}]}>{copy.history}</Text>
          {dailyHistory.slice(0,20).map((row) => { const tone = pillTone(row.result); return <View key={row.id} style={styles.historyRow}><View style={[styles.historyDot,{backgroundColor:tone.fg}]} /><View style={{flex:1}}><Text style={styles.historyTitle}>{row.asset}</Text><Text style={styles.meta}>{dateText(row.checkedAt)}</Text></View><Text style={[styles.historyResult,{color:tone.fg}]}>{row.result.toUpperCase()}</Text></View>; })}
        </View> : null}
      </ScrollView>

      <PlanEditor visible={editingPlan !== undefined} plan={editingPlan ?? null} copy={copy} onClose={() => setEditingPlan(undefined)} onSaved={async () => { setEditingPlan(undefined); await refreshAfterAction(); }} />
      <ExecutionModal task={selectedTask} copy={copy} onClose={() => setSelectedTask(null)} onChanged={async (next) => { setSelectedTask(next); await refreshAfterAction(); }} />
      <DailyCheckModal state={selectedPrestart} copy={copy} onClose={() => setSelectedPrestart(null)} onSaved={async () => { setSelectedPrestart(null); await refreshAfterAction(); }} />
    </View>
  );
}

function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return <View style={styles.empty}><Ionicons name={icon} size={30} color={colors.muted} /><Text style={styles.emptyText}>{text}</Text></View>;
}

function PlanEditor({ visible, plan, copy, onClose, onSaved }: { visible: boolean; plan: MaintenancePlan | null; copy: any; onClose: () => void; onSaved: () => Promise<void> }) {
  const [kind, setKind] = useState<MaintenanceKind>('pm');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assetId, setAssetId] = useState('');
  const [assets, setAssets] = useState<MaintenanceAsset[]>([]);
  const [frequencyValue, setFrequencyValue] = useState('1');
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('month');
  const [nextDue, setNextDue] = useState('');
  const [active, setActive] = useState(true);
  const [items, setItems] = useState<ChecklistItem[]>([{ id: 'item-1', label: '', required: true }]);
  const [saving, setSaving] = useState(false);
  const [showAssets, setShowAssets] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const nextKind = plan?.kind ?? 'pm';
    setKind(nextKind); setName(plan?.name ?? ''); setDescription(plan?.description ?? ''); setAssetId(plan?.assetId ?? ''); setFrequencyValue(String(plan?.frequencyValue ?? 1)); setFrequencyUnit(plan?.frequencyUnit ?? 'month'); setNextDue(plan?.nextDueDate ?? ''); setActive(plan?.active ?? true); setItems(plan?.checklist.length ? plan.checklist : [{ id: 'item-1', label: '', required: true }]);
    void listMaintenanceAssets(nextKind).then(setAssets).catch(() => setAssets([]));
  }, [visible, plan]);

  const changeKind = async (next: MaintenanceKind) => { setKind(next); setAssetId(''); try { setAssets(await listMaintenanceAssets(next)); } catch { setAssets([]); } };
  const selectedAsset = assets.find((item) => item.id === assetId);

  const save = async () => {
    setSaving(true);
    try {
      await saveMaintenancePlan({ id: plan?.id, name, description, kind, assetId, frequencyValue: Number(frequencyValue), frequencyUnit, nextDueDate: nextDue || undefined, active, checklist: items });
      await onSaved();
    } catch (error: any) { Alert.alert(copy.saveError, error?.message ?? String(error)); }
    finally { setSaving(false); }
  };

  const toggleActive = async () => {
    if (!plan) { setActive(!active); return; }
    setSaving(true);
    try { await setMaintenancePlanActive(plan.id, !active); setActive(!active); await onSaved(); }
    catch (error: any) { Alert.alert(copy.saveError, error?.message ?? String(error)); }
    finally { setSaving(false); }
  };

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalPage}>
      <View style={styles.modalHeader}><TouchableOpacity onPress={onClose} style={styles.iconButton}><Ionicons name="close" size={23} color={colors.text} /></TouchableOpacity><Text style={styles.modalTitle}>{plan ? copy.editPlan : copy.newPlan}</Text><TouchableOpacity disabled={saving} onPress={() => void save()}><Text style={styles.saveLink}>{copy.save}</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.formContent}>
        <Text style={styles.fieldLabel}>{copy.result}</Text><View style={styles.segment}>{(['pm','prestart'] as MaintenanceKind[]).map((key) => <TouchableOpacity key={key} onPress={() => void changeKind(key)} style={[styles.segmentItem,kind===key&&styles.segmentItemActive]}><Text style={[styles.segmentText,kind===key&&styles.segmentTextActive]}>{copy[key]}</Text></TouchableOpacity>)}</View>
        <Field label={copy.planName}><TextInput value={name} onChangeText={setName} style={styles.input} /></Field>
        <Field label={copy.description}><TextInput value={description} onChangeText={setDescription} multiline style={[styles.input,styles.multiline]} /></Field>
        <Field label={copy.asset}><TouchableOpacity style={styles.inputButton} onPress={() => setShowAssets(true)}><Text style={selectedAsset ? styles.inputText : styles.placeholder}>{selectedAsset ? `${selectedAsset.code} · ${selectedAsset.name}` : copy.asset}</Text><Ionicons name="chevron-down" size={18} color={colors.muted} /></TouchableOpacity></Field>
        <Field label={copy.frequency}><View style={styles.frequencyRow}><TextInput value={frequencyValue} onChangeText={setFrequencyValue} keyboardType="numeric" style={[styles.input,{width:78}]} /><View style={[styles.segment,{flex:1,marginTop:0}]}>{(['day','week','month'] as FrequencyUnit[]).map((key) => <TouchableOpacity key={key} onPress={() => setFrequencyUnit(key)} style={[styles.segmentItem,frequencyUnit===key&&styles.segmentItemActive]}><Text style={[styles.segmentText,frequencyUnit===key&&styles.segmentTextActive]}>{copy[key]}</Text></TouchableOpacity>)}</View></View></Field>
        <Field label={`${copy.nextDue} (YYYY-MM-DD)`}><TextInput value={nextDue} onChangeText={setNextDue} placeholder="2026-09-10" style={styles.input} /></Field>
        <View style={styles.switchRow}><Text style={styles.fieldLabel}>{copy.active}</Text><Switch value={active} onValueChange={setActive} /></View>
        <View style={styles.checklistHeader}><Text style={styles.sectionTitle}>{copy.checklist}</Text><TouchableOpacity onPress={() => setItems((current) => [...current,{id:`item-${Date.now()}`,label:'',required:true}])}><Text style={styles.addItem}>{copy.addItem}</Text></TouchableOpacity></View>
        {items.map((item,index) => <View key={item.id} style={styles.checklistEditRow}><Text style={styles.itemNumber}>{index+1}</Text><TextInput value={item.label} onChangeText={(label) => setItems((current) => current.map((row) => row.id===item.id?{...row,label}:row))} placeholder={copy.itemPlaceholder} style={[styles.input,{flex:1}]} /><TouchableOpacity onPress={() => setItems((current) => current.filter((row) => row.id!==item.id))}><Ionicons name="trash-outline" size={20} color={colors.danger} /></TouchableOpacity></View>)}
        <TouchableOpacity disabled={saving} style={styles.primaryFull} onPress={() => void save()}>{saving?<ActivityIndicator color="#fff"/>:<Text style={styles.primaryText}>{copy.save}</Text>}</TouchableOpacity>
        {plan ? <TouchableOpacity disabled={saving} style={styles.secondaryFull} onPress={() => void toggleActive()}><Text style={styles.secondaryText}>{active ? copy.inactive : copy.active}</Text></TouchableOpacity> : null}
      </ScrollView>
      <Modal visible={showAssets} transparent animationType="slide" onRequestClose={() => setShowAssets(false)}><View style={styles.sheetRoot}><Pressable style={styles.scrim} onPress={() => setShowAssets(false)} /><View style={styles.sheet}><View style={styles.sheetHandle}/><Text style={styles.sectionTitle}>{copy.asset}</Text><ScrollView style={{maxHeight:430}}>{assets.map((asset) => <TouchableOpacity key={asset.id} style={styles.assetOption} onPress={() => {setAssetId(asset.id);setShowAssets(false);}}><View><Text style={styles.assetCode}>{asset.code}</Text><Text style={styles.assetName}>{asset.name}</Text></View>{asset.id===assetId?<Ionicons name="checkmark" size={20} color={colors.primary}/>:null}</TouchableOpacity>)}</ScrollView></View></View></Modal>
    </View>
  </Modal>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{children}</View>; }

function ExecutionModal({ task, copy, onClose, onChanged }: { task: MaintenanceExecution | null; copy: any; onClose: () => void; onChanged: (task: MaintenanceExecution) => Promise<void> }) {
  const [answers, setAnswers] = useState<ChecklistAnswer[]>([]);
  const [note, setNote] = useState('');
  const [createWo, setCreateWo] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (task) { setAnswers(task.checklist); setNote(task.notes ?? ''); } }, [task]);
  const hasFail = answers.some((item) => item.result === 'fail');

  const start = async () => { if (!task) return; setSaving(true); try { await onChanged(await startMaintenanceExecution(task.id)); } catch (error:any) { Alert.alert(copy.saveError,error?.message??String(error)); } finally { setSaving(false); } };
  const complete = async () => { if (!task) return; setSaving(true); try { await onChanged(await completeMaintenanceExecution(task.id,{checklist:answers,notes:note,createWorkOrderOnFail:createWo})); } catch (error:any) { Alert.alert(copy.saveError,error?.message??String(error)); } finally { setSaving(false); } };

  return <Modal visible={Boolean(task)} animationType="slide" onRequestClose={onClose}>{task ? <View style={styles.modalPage}>
    <View style={styles.modalHeader}><TouchableOpacity onPress={onClose} style={styles.iconButton}><Ionicons name="close" size={23} color={colors.text}/></TouchableOpacity><View style={{flex:1}}><Text style={styles.modalTitle}>{copy.execution}</Text><Text style={styles.modalSub}>{task.planCode} · {task.asset}</Text></View></View>
    <ScrollView contentContainerStyle={styles.formContent}>
      <View style={styles.summaryBox}><Text style={styles.cardTitle}>{task.planName}</Text><Text style={styles.meta}>{copy.nextDue}: {dateText(task.dueDate)}</Text><Text style={styles.evidence}>{copy.serverEvidence}</Text></View>
      <Text style={styles.sectionTitle}>{copy.checklist}</Text>
      {answers.map((item,index) => <View key={item.id} style={styles.answerCard}><Text style={styles.answerTitle}>{index+1}. {item.label}</Text><View style={styles.resultRow}>{(['pass','fail','na'] as const).map((result) => <TouchableOpacity key={result} onPress={() => setAnswers((current) => current.map((row) => row.id===item.id?{...row,result}:row))} style={[styles.resultButton,item.result===result&&styles.resultButtonActive,result==='fail'&&item.result===result&&{borderColor:colors.danger,backgroundColor:'#FEF2F2'}]}><Text style={[styles.resultText,item.result===result&&styles.resultTextActive,result==='fail'&&item.result===result&&{color:colors.danger}]}>{copy[result]}</Text></TouchableOpacity>)}</View><TextInput value={item.note??''} onChangeText={(value)=>setAnswers((current)=>current.map((row)=>row.id===item.id?{...row,note:value}:row))} placeholder={copy.noteOptional} style={styles.itemNote}/></View>)}
      <Field label={copy.note}><TextInput value={note} onChangeText={setNote} multiline style={[styles.input,styles.multiline]} /></Field>
      {hasFail ? <View style={styles.switchRow}><Text style={[styles.fieldLabel,{flex:1}]}>{copy.createWoOnFail}</Text><Switch value={createWo} onValueChange={setCreateWo} /></View> : null}
      {task.workOrderId ? <View style={styles.woBox}><Ionicons name="construct-outline" size={18} color={colors.primary}/><Text style={styles.woText}>{copy.linkedWorkOrder}: {task.workOrderId}</Text></View> : null}
    </ScrollView>
    <View style={styles.footer}>{task.status==='pending'?<TouchableOpacity disabled={saving} style={styles.primaryFull} onPress={() => void start()}>{saving?<ActivityIndicator color="#fff"/>:<Text style={styles.primaryText}>{copy.start}</Text>}</TouchableOpacity>:task.status==='in_progress'?<TouchableOpacity disabled={saving} style={styles.primaryFull} onPress={() => void complete()}>{saving?<ActivityIndicator color="#fff"/>:<Text style={styles.primaryText}>{copy.finish}</Text>}</TouchableOpacity>:<View style={styles.completedBanner}><Ionicons name="checkmark-circle" size={20} color={colors.success}/><Text style={styles.completedText}>{copy.completed} · {(task.result??'').toUpperCase()}</Text></View>}</View>
  </View> : null}</Modal>;
}

function DailyCheckModal({ state, copy, onClose, onSaved }: { state: PrestartState | null; copy: any; onClose: () => void; onSaved: () => Promise<void> }) {
  const [answers, setAnswers] = useState<ChecklistAnswer[]>([]);
  const [note, setNote] = useState('');
  const [createWo, setCreateWo] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (state?.plan) setAnswers(state.plan.checklist.map((item)=>({...item}))); }, [state]);
  const hasFail = answers.some((item)=>item.result==='fail');
  const submit = async () => { if (!state?.plan) return; setSaving(true); try { await submitDailyCheck({assetId:state.asset.id,planId:state.plan.id,checklist:answers,note,createWorkOrderOnFail:createWo}); await onSaved(); } catch(error:any){ Alert.alert(copy.saveError,error?.message??String(error)); } finally{setSaving(false);} };
  return <Modal visible={Boolean(state)} animationType="slide" onRequestClose={onClose}>{state?.plan ? <View style={styles.modalPage}>
    <View style={styles.modalHeader}><TouchableOpacity onPress={onClose} style={styles.iconButton}><Ionicons name="close" size={23} color={colors.text}/></TouchableOpacity><View style={{flex:1}}><Text style={styles.modalTitle}>{copy.prestart}</Text><Text style={styles.modalSub}>{state.asset.code} · {state.asset.name}</Text></View></View>
    <ScrollView contentContainerStyle={styles.formContent}><View style={styles.quickHint}><Ionicons name="flash" size={18} color={colors.warning}/><Text style={styles.quickHintText}>{copy.quickCheckHint}</Text></View>{answers.map((item,index)=><View key={item.id} style={styles.answerCard}><Text style={styles.answerTitle}>{index+1}. {item.label}</Text><View style={styles.resultRow}>{(['pass','fail','na'] as const).map((result)=><TouchableOpacity key={result} onPress={()=>setAnswers((current)=>current.map((row)=>row.id===item.id?{...row,result}:row))} style={[styles.resultButton,item.result===result&&styles.resultButtonActive,result==='fail'&&item.result===result&&{borderColor:colors.danger,backgroundColor:'#FEF2F2'}]}><Text style={[styles.resultText,item.result===result&&styles.resultTextActive,result==='fail'&&item.result===result&&{color:colors.danger}]}>{copy[result]}</Text></TouchableOpacity>)}</View></View>)}<Field label={copy.noteOptional}><TextInput value={note} onChangeText={setNote} multiline style={[styles.input,styles.multiline]}/></Field>{hasFail?<View style={styles.switchRow}><Text style={[styles.fieldLabel,{flex:1}]}>{copy.createWoOnFail}</Text><Switch value={createWo} onValueChange={setCreateWo}/></View>:null}<Text style={styles.evidence}>{copy.serverEvidence}</Text></ScrollView>
    <View style={styles.footer}><TouchableOpacity disabled={saving} style={styles.primaryFull} onPress={() => void submit()}>{saving?<ActivityIndicator color="#fff"/>:<Text style={styles.primaryText}>{copy.submitCheck}</Text>}</TouchableOpacity></View>
  </View>:null}</Modal>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#F8FAFC'},header:{minHeight:66,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:colors.border},iconButton:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'},addButton:{width:40,height:40,borderRadius:12,backgroundColor:colors.primarySoft,alignItems:'center',justifyContent:'center'},title:{fontSize:19,fontWeight:'900',color:colors.text},subtitle:{fontSize:11,color:colors.muted,marginTop:2},tabs:{flexDirection:'row',backgroundColor:'#fff',paddingHorizontal:14,paddingTop:8,gap:6},tab:{flex:1,paddingVertical:10,alignItems:'center',borderBottomWidth:2,borderBottomColor:'transparent'},tabActive:{borderBottomColor:colors.primary},tabText:{fontSize:13,fontWeight:'700',color:colors.muted},tabTextActive:{color:colors.primary},searchRow:{margin:12,marginBottom:6,height:44,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:'#fff',paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8},searchInput:{flex:1,color:colors.text,fontSize:13},toolbar:{paddingHorizontal:12,paddingVertical:8,flexDirection:'row',gap:7,alignItems:'center'},filterChip:{paddingHorizontal:11,paddingVertical:7,borderRadius:999,backgroundColor:'#fff',borderWidth:1,borderColor:colors.border},filterChipActive:{backgroundColor:colors.primarySoft,borderColor:colors.primary},filterChipText:{fontSize:11,fontWeight:'800',color:colors.muted},filterChipTextActive:{color:colors.primary},sortChip:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:9,paddingVertical:7},sortText:{fontSize:11,fontWeight:'700',color:colors.muted},content:{padding:12,paddingBottom:110},live:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#ECFDF3',paddingHorizontal:9,paddingVertical:5,borderRadius:999,marginBottom:10},liveDot:{width:7,height:7,borderRadius:4,backgroundColor:colors.success},liveText:{fontSize:9,fontWeight:'900',color:colors.success},loading:{paddingVertical:60,alignItems:'center',gap:10},loadingText:{fontSize:12,color:colors.muted},errorCard:{backgroundColor:'#FEF2F2',borderRadius:14,padding:16,gap:8},errorTitle:{fontWeight:'900',color:colors.danger},errorText:{fontSize:12,color:colors.text},retry:{fontWeight:'900',color:colors.primary},list:{gap:9},card:{backgroundColor:'#fff',borderWidth:1,borderColor:colors.border,borderRadius:15,padding:13,flexDirection:'row',alignItems:'center',gap:11},cardIcon:{width:42,height:42,borderRadius:12,backgroundColor:colors.primarySoft,alignItems:'center',justifyContent:'center'},cardTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6},code:{color:colors.primary,fontSize:11,fontWeight:'900'},cardTitle:{color:colors.text,fontSize:14,fontWeight:'900',marginTop:3},meta:{color:colors.muted,fontSize:11,marginTop:3},miniPill:{paddingHorizontal:7,paddingVertical:3,borderRadius:999},miniPillText:{fontSize:9,fontWeight:'900'},empty:{paddingVertical:46,alignItems:'center',gap:9},emptyText:{fontSize:12,color:colors.muted,textAlign:'center'},sectionTitle:{fontSize:14,fontWeight:'900',color:colors.text,marginBottom:2},historyRow:{backgroundColor:'#fff',borderRadius:12,borderWidth:1,borderColor:colors.border,padding:12,flexDirection:'row',alignItems:'center',gap:10},historyDot:{width:9,height:9,borderRadius:5},historyTitle:{fontSize:12,fontWeight:'800',color:colors.text},historyResult:{fontSize:10,fontWeight:'900'},modalPage:{flex:1,backgroundColor:'#F8FAFC'},modalHeader:{minHeight:64,paddingHorizontal:12,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:colors.border,flexDirection:'row',alignItems:'center',gap:9},modalTitle:{fontSize:17,fontWeight:'900',color:colors.text},modalSub:{fontSize:10,color:colors.muted,marginTop:2},saveLink:{fontSize:13,fontWeight:'900',color:colors.primary,padding:10},formContent:{padding:16,paddingBottom:120},field:{marginTop:15},fieldLabel:{fontSize:11,fontWeight:'900',color:colors.text,marginBottom:7},input:{minHeight:44,borderWidth:1,borderColor:colors.border,borderRadius:11,backgroundColor:'#fff',paddingHorizontal:12,color:colors.text,fontSize:13},multiline:{minHeight:86,paddingTop:11,textAlignVertical:'top'},inputButton:{minHeight:44,borderWidth:1,borderColor:colors.border,borderRadius:11,backgroundColor:'#fff',paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},inputText:{fontSize:13,color:colors.text},placeholder:{fontSize:13,color:colors.muted},segment:{flexDirection:'row',gap:5,marginTop:7},segmentItem:{flex:1,paddingVertical:9,alignItems:'center',borderRadius:9,borderWidth:1,borderColor:colors.border,backgroundColor:'#fff'},segmentItemActive:{backgroundColor:colors.primarySoft,borderColor:colors.primary},segmentText:{fontSize:11,fontWeight:'800',color:colors.muted},segmentTextActive:{color:colors.primary},frequencyRow:{flexDirection:'row',gap:8,alignItems:'center'},switchRow:{marginTop:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},checklistHeader:{marginTop:22,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},addItem:{fontSize:12,fontWeight:'900',color:colors.primary},checklistEditRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:8},itemNumber:{width:20,fontSize:11,fontWeight:'900',color:colors.muted,textAlign:'center'},primaryFull:{minHeight:48,borderRadius:12,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',marginTop:18},primaryText:{fontSize:13,fontWeight:'900',color:'#fff'},secondaryFull:{minHeight:46,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',marginTop:9},secondaryText:{fontSize:13,fontWeight:'900',color:colors.text},sheetRoot:{flex:1,justifyContent:'flex-end'},scrim:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(15,23,42,0.35)'},sheet:{backgroundColor:'#fff',borderTopLeftRadius:22,borderTopRightRadius:22,padding:16,paddingBottom:30,maxHeight:'70%'},sheetHandle:{width:40,height:4,borderRadius:2,backgroundColor:'#CBD5E1',alignSelf:'center',marginBottom:14},assetOption:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},assetCode:{fontSize:10,fontWeight:'900',color:colors.primary},assetName:{fontSize:13,fontWeight:'800',color:colors.text,marginTop:3},summaryBox:{backgroundColor:'#fff',borderWidth:1,borderColor:colors.border,borderRadius:14,padding:14,marginBottom:18},evidence:{fontSize:10,color:colors.muted,marginTop:8,fontStyle:'italic'},answerCard:{backgroundColor:'#fff',borderWidth:1,borderColor:colors.border,borderRadius:14,padding:13,marginTop:9},answerTitle:{fontSize:13,fontWeight:'800',color:colors.text},resultRow:{flexDirection:'row',gap:7,marginTop:11},resultButton:{flex:1,minHeight:38,borderRadius:9,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},resultButtonActive:{backgroundColor:colors.primarySoft,borderColor:colors.primary},resultText:{fontSize:11,fontWeight:'900',color:colors.muted},resultTextActive:{color:colors.primary},itemNote:{marginTop:9,minHeight:38,borderTopWidth:1,borderTopColor:colors.border,paddingTop:8,fontSize:11,color:colors.text},woBox:{marginTop:14,padding:12,borderRadius:11,backgroundColor:colors.primarySoft,flexDirection:'row',gap:8,alignItems:'center'},woText:{flex:1,fontSize:10,color:colors.primary,fontWeight:'700'},footer:{padding:12,paddingBottom:24,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:colors.border},completedBanner:{minHeight:48,borderRadius:12,backgroundColor:'#ECFDF3',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},completedText:{fontSize:12,fontWeight:'900',color:colors.success},quickHint:{padding:12,borderRadius:12,backgroundColor:'#FFF7ED',flexDirection:'row',gap:9,alignItems:'flex-start',marginBottom:10},quickHintText:{flex:1,fontSize:11,lineHeight:16,color:colors.text},
});
