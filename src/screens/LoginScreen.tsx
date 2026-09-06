import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://euriskoproject.onrender.com';

const DEMO_ACCOUNTS = [
  { label: 'Francis King (System Admin)', sso: 'francis.king' },
  { label: 'Bob Jones (Employee)', sso: 'bob.jones' },
  { label: 'Alice Smith (Employee)', sso: 'alice.smith' },
  { label: 'Carol White (Employee)', sso: 'carol.white' },
];

export function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleLogin = async (ssoSubject: string) => {
    setLoading(true);
    setSelected(ssoSubject);
    try {
      const res = await fetch(`${API_BASE}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssoSubject }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed');
      }
      const { accessToken } = await res.json();
      await loginWithGoogle(accessToken);
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Authentication failed');
    } finally {
      setLoading(false);
      setSelected(null);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Internal Operations Hub</Text>
        <Text style={styles.subtitle}>Select your account to sign in</Text>

        {DEMO_ACCOUNTS.map((account) => (
          <TouchableOpacity
            key={account.sso}
            style={[
              styles.accountBtn,
              selected === account.sso && styles.accountBtnActive,
              loading && selected !== account.sso && styles.accountBtnDisabled,
            ]}
            onPress={() => handleLogin(account.sso)}
            disabled={loading}
          >
            <Text style={styles.accountName}>{account.label}</Text>
            <Text style={styles.accountId}>{account.sso}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.hint}>Google SSO requires a production build (EAS)</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  accountBtn: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, marginBottom: 10, backgroundColor: '#f8fafc' },
  accountBtnActive: { borderColor: '#111827', backgroundColor: '#f1f5f9' },
  accountBtnDisabled: { opacity: 0.5 },
  accountName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  accountId: { fontSize: 12, color: '#64748b', marginTop: 2 },
  hint: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 },
});
