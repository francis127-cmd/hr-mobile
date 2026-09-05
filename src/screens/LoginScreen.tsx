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

export function LoginScreen() {
  const { login } = useAuth();
  const [ssoSubject, setSsoSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!ssoSubject.trim()) {
      Alert.alert('Required', 'Enter your SSO ID');
      return;
    }
    setLoading(true);
    try {
      await login(ssoSubject.trim());
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Cannot reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Internal Operations Hub</Text>
        <Text style={styles.subtitle}>Sign in with your company SSO</Text>

        <Text style={styles.label}>SSO ID</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. alex.chen, sara.kumar"
          value={ssoSubject}
          onChangeText={setSsoSubject}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo accounts:</Text>
          <Text style={styles.demoText}>alex.chen — Employee (Yorgo)</Text>
          <Text style={styles.demoText}>sara.kumar — IT Agent (Francis)</Text>
          <Text style={styles.demoText}>mike.howard — HR Agent (Mike)</Text>
          <Text style={styles.demoText}>james.wilson — Facilities Agent (James)</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: '#f8fafc' },
  button: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  demoBox: { marginTop: 24, padding: 14, backgroundColor: '#f1f5f9', borderRadius: 8 },
  demoTitle: { fontWeight: '700', color: '#334155', marginBottom: 4 },
  demoText: { color: '#64748b', fontSize: 13, lineHeight: 20 },
});
