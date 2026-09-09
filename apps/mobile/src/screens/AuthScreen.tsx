import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import type { Locale } from '../i18n';

const copy = {
  vi: {
    title: 'CEV Bảo trì', subtitle: 'Đăng nhập để sử dụng dữ liệu bảo trì thật', email: 'Email', password: 'Mật khẩu', signIn: 'Đăng nhập', signUp: 'Tạo tài khoản', language: 'Ngôn ngữ',
    required: 'Vui lòng nhập email và mật khẩu.', creating: 'Đang tạo tài khoản...', signingIn: 'Đang đăng nhập...',
    verifyTitle: 'Đã gửi email xác nhận',
    verifyBody: 'Tài khoản đã được tạo. Hãy mở email, bấm “Confirm email address”, sau đó quay lại đây và đăng nhập.',
    verifiedHint: 'Nếu bạn đã bấm xác nhận email, có thể đăng nhập ngay.',
    errorTitle: 'Không thể thực hiện',
  },
  en: {
    title: 'CEV Maintenance', subtitle: 'Sign in to use live maintenance data', email: 'Email', password: 'Password', signIn: 'Sign in', signUp: 'Create account', language: 'Language',
    required: 'Enter email and password.', creating: 'Creating account...', signingIn: 'Signing in...',
    verifyTitle: 'Confirmation email sent',
    verifyBody: 'Your account was created. Open the email, tap “Confirm email address”, then return here and sign in.',
    verifiedHint: 'If you already confirmed the email, you can sign in now.',
    errorTitle: 'Unable to continue',
  },
  ko: {
    title: 'CEV 유지보수', subtitle: '실제 유지보수 데이터를 사용하려면 로그인하세요.', email: '이메일', password: '비밀번호', signIn: '로그인', signUp: '계정 만들기', language: '언어',
    required: '이메일과 비밀번호를 입력하세요.', creating: '계정 생성 중...', signingIn: '로그인 중...',
    verifyTitle: '인증 이메일을 보냈습니다',
    verifyBody: '계정이 생성되었습니다. 이메일에서 “Confirm email address”를 누른 뒤 이 화면으로 돌아와 로그인하세요.',
    verifiedHint: '이미 이메일 인증을 완료했다면 바로 로그인할 수 있습니다.',
    errorTitle: '처리할 수 없습니다',
  },
} as const;

type Props = { locale: Locale; onChangeLocale: (locale: Locale) => void };
type Notice = { type: 'success' | 'error'; title: string; body: string } | null;

export function AuthScreen({ locale, onChangeLocale }: Props) {
  const text = useMemo(() => copy[locale], [locale]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState<'signin' | 'signup' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const validate = () => {
    if (!email.trim() || !password) {
      setNotice({ type: 'error', title: text.errorTitle, body: text.required });
      return false;
    }
    return true;
  };

  const signIn = async () => {
    if (!validate()) return;
    setLoadingAction('signin');
    setNotice(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setNotice({ type: 'error', title: text.errorTitle, body: error.message });
    } catch (error) {
      setNotice({ type: 'error', title: text.errorTitle, body: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoadingAction(null);
    }
  };

  const signUp = async () => {
    if (!validate()) return;
    setLoadingAction('signup');
    setNotice(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { preferred_locale: locale } },
      });
      if (error) {
        setNotice({ type: 'error', title: text.errorTitle, body: error.message });
      } else if (!data.session) {
        setNotice({ type: 'success', title: text.verifyTitle, body: `${text.verifyBody}\n\n${text.verifiedHint}` });
      }
    } catch (error) {
      setNotice({ type: 'error', title: text.errorTitle, body: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoadingAction(null);
    }
  };

  const busy = loadingAction !== null;

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
        {notice ? (
          <View style={[styles.notice, notice.type === 'success' ? styles.noticeSuccess : styles.noticeError]}>
            <Ionicons name={notice.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={24} color={notice.type === 'success' ? colors.success : colors.danger} />
            <View style={styles.noticeBody}>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeText}>{notice.body}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.label}>{text.email}</Text>
        <TextInput value={email} onChangeText={setEmail} editable={!busy} autoCapitalize="none" keyboardType="email-address" placeholder="name@company.com" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>{text.password}</Text>
        <TextInput value={password} onChangeText={setPassword} editable={!busy} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.muted} style={styles.input} />

        <TouchableOpacity disabled={busy} onPress={signIn} style={[styles.primary, busy && styles.disabled]}>
          {loadingAction === 'signin' ? <View style={styles.loadingRow}><ActivityIndicator color="#fff" /><Text style={styles.primaryText}>{text.signingIn}</Text></View> : <Text style={styles.primaryText}>{text.signIn}</Text>}
        </TouchableOpacity>

        <TouchableOpacity disabled={busy} onPress={signUp} style={[styles.secondary, busy && styles.disabled]}>
          {loadingAction === 'signup' ? <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /><Text style={styles.secondaryText}>{text.creating}</Text></View> : <Text style={styles.secondaryText}>{text.signUp}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  logo: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { marginTop: 16, textAlign: 'center', fontSize: 28, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: 7, textAlign: 'center', fontSize: 14, color: colors.muted },
  languageRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  languageLabel: { color: colors.muted, fontSize: 12, marginRight: 4 },
  lang: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  langActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  langText: { fontSize: 11, fontWeight: '800', color: colors.muted },
  langTextActive: { color: colors.primary },
  card: { marginTop: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18 },
  notice: { borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', gap: 10, marginBottom: 14 },
  noticeSuccess: { borderColor: '#ABEFC6', backgroundColor: '#ECFDF3' },
  noticeError: { borderColor: '#FECDCA', backgroundColor: '#FEF3F2' },
  noticeBody: { flex: 1 },
  noticeTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  noticeText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 7, marginTop: 6 },
  input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 13, color: colors.text, backgroundColor: colors.background, marginBottom: 10 },
  primary: { height: 50, marginTop: 12, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  secondary: { height: 48, marginTop: 10, borderRadius: 13, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '800', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  disabled: { opacity: 0.6 },
});
