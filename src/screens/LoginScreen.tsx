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

export function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [ssoSubject, setSsoSubject] = useState('francis.king');
  const [loading, setLoading] = useState(false);

  const handleMockLogin = async () => {
    if (!ssoSubject.trim()) {
      Alert.alert('Error', 'Enter an SSO subject');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssoSubject: ssoSubject.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed');
      }
      const { accessToken } = await res.json();
      await loginWithGoogle(accessToken);
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'SSO authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Internal Operations Hub</Text>
        <Text style={styles.subtitle}>Sign in with your company account</Text>

        <Text style={styles.label}>SSO Subject</Text>
        <TextInput
          style={styles.input}
          value={ssoSubject}
          onChangeText={setSsoSubject}
          placeholder="e.g. francis.king"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.buttonDisabled]}
          onPress={handleMockLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Google SSO requires an EAS dev build (not available in Expo Go)</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: '#f8fafc' },
  btn: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  hint: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 16 },
});
