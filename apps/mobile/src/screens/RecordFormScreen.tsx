import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { MasterRecord } from '../data/masterData';

type Props = {
  title: string;
  messages: any;
  record?: MasterRecord;
  onBack: () => void;
  onSave: () => void;
};

export function RecordFormScreen({ title, messages, record, onBack, onSave }: Props) {
  const [code, setCode] = useState(record?.code ?? '');
  const [name, setName] = useState(record?.name ?? '');
  const [specification, setSpecification] = useState(record?.secondary ?? '');
  const [location, setLocation] = useState(record?.location ?? '');
  const [nextDue, setNextDue] = useState(record?.nextDue ?? '');

  const fields = [
    { label: messages.common.code, value: code, setValue: setCode, placeholder: 'VD: EQ-001' },
    { label: messages.common.name, value: name, setValue: setName, placeholder: messages.common.enterName },
    { label: messages.common.specification, value: specification, setValue: setSpecification, placeholder: messages.common.enterSpecification },
    { label: messages.common.location, value: location, setValue: setLocation, placeholder: messages.common.enterLocation },
    { label: messages.common.nextDue, value: nextDue, setValue: setNextDue, placeholder: 'YYYY-MM-DD' },
  ];

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /><Text style={styles.backText}>{title}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{record ? messages.common.editRecord : messages.common.createRecord}</Text>
        <Text style={styles.subtitle}>{messages.common.requiredHint}</Text>

        <View style={styles.card}>
          {fields.map((field) => (
            <View key={field.label} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput value={field.value} onChangeText={field.setValue} placeholder={field.placeholder} placeholderTextColor={colors.muted} style={styles.input} />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{messages.common.controlInfo}</Text>
          <View style={styles.infoRow}><Ionicons name="qr-code-outline" size={20} color={colors.primary} /><Text style={styles.infoText}>{messages.common.qrAutoHint}</Text></View>
          <View style={styles.infoRow}><Ionicons name="time-outline" size={20} color={colors.primary} /><Text style={styles.infoText}>{messages.common.historyAutoHint}</Text></View>
        </View>

        <TouchableOpacity style={styles.save} activeOpacity={0.75} onPress={onSave}><Ionicons name="save-outline" size={20} color="#fff" /><Text style={styles.saveText}>{messages.common.save}</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { minHeight: 54, paddingHorizontal: 12, justifyContent: 'center' }, back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }, backText: { color: colors.text, fontSize: 14, fontWeight: '700', maxWidth: 300 }, content: { padding: 18, paddingTop: 4, paddingBottom: 120 }, title: { color: colors.text, fontSize: 26, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 13, marginTop: 6, marginBottom: 15 }, card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 14 }, field: { marginBottom: 14 }, label: { color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 7 }, input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text, fontSize: 14, backgroundColor: colors.background }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 10 }, infoRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 }, infoText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 }, save: { height: 50, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, saveText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
