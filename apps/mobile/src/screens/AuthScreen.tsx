import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import type { Locale } from '../i18n';

const copy = {
  vi: { title: 'CEV Bảo trì', subtitle: 'Đăng nhập để sử dụng dữ liệu bảo trì thật', email: 'Email', password: 'Mật khẩu', signIn: 'Đăng nhập', signUp: 'Tạo tài khoản', verify: 'Tài khoản đã tạo. Nếu hệ thống yêu cầu xác nhận email, vui lòng kiểm tra hộp thư.', required: 'Vui lòng nhập email và mật khẩu.', language: 'Ngôn ngữ' },
  en: { title: 'CEV Maintenance', subtitle: 'Sign in to use live maintenance data', email: 'Email', password: 'Password', signIn: 'Sign in', signUp: 'Create account', verify: 'Account created. If email confirmation is enabled, please check your inbox.', required: 'Enter email and password.', language: 'Language' },
  ko: { title: 'CEV 유지보수', subtitle: '실제 유지보수 데이터를 사용하려면 로그인하세요.', email: '이메일', password: '비밀번호', signIn: '로그인', signUp: '계정 만들기', verify: '계정이 생성되었습니다. 이메일 인증이 활성화된 경우 받은 편지함을 확인하세요.', required: '이메일과 비밀번호를 입력하세요.', language: '언어' },
} as const;

type Props = { locale: Locale; onChangeLocale: (locale: Locale) => void };

export function AuthScreen({ locale, onChangeLocale }: Props) {
  const text = useMemo(() => copy[locale], [locale]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim() || !password) { Alert.alert(text.required); return false; }
    return true;
  };

  const signIn = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert(error.message);
  };

  const signUp = async () => {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { preferred_locale: locale } } });
    setLoading(false);
    if (error) Alert.alert(error.message);
    else if (!data.session) Alert.alert(text.verify);
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.logo}><Ionicons name="construct" size={34} color={colors.primary} /></View>
      <Text style={styles.title}>{text.title}</Text>
      <Text style={styles.subtitle}>{text.subtitle}</Text>
      <View style={styles.languageRow}>
        <Text style={styles.languageLabel}>{text.language}</Text>
        {(['vi','en','ko'] as Locale[]).map((item) => <TouchableOpacity key={item} onPress={() => onChangeLocale(item)} style={[styles.lang, locale === item && styles.langActive]}><Text style={[styles.langText, locale === item && styles.langTextActive]}>{item.toUpperCase()}</Text></TouchableOpacity>)}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{text.email}</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="name@company.com" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>{text.password}</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.muted} style={styles.input} />
        <TouchableOpacity disabled={loading} onPress={signIn} style={[styles.primary, loading && styles.disabled]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{text.signIn}</Text>}</TouchableOpacity>
        <TouchableOpacity disabled={loading} onPress={signUp} style={styles.secondary}><Text style={styles.secondaryText}>{text.signUp}</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background }, logo: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }, title: { marginTop: 16, textAlign: 'center', fontSize: 28, fontWeight: '900', color: colors.text }, subtitle: { marginTop: 7, textAlign: 'center', fontSize: 14, color: colors.muted }, languageRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, languageLabel: { color: colors.muted, fontSize: 12, marginRight: 4 }, lang: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.border }, langActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, langText: { fontSize: 11, fontWeight: '800', color: colors.muted }, langTextActive: { color: colors.primary }, card: { marginTop: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18 }, label: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 7, marginTop: 6 }, input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text, backgroundColor: colors.background, marginBottom: 10 }, primary: { height: 50, marginTop: 12, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#fff', fontWeight: '900', fontSize: 15 }, secondary: { height: 48, marginTop: 10, borderRadius: 13, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.text, fontWeight: '800', fontSize: 14 }, disabled: { opacity: 0.6 },
});
