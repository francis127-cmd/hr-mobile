import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useAuth } from '../auth/AuthContext';

export function MfaChallengeScreen({ navigation }: any) {
  const { handleMfaChallenge, clearMfaChallenge } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (!code.trim() || code.length < 6) {
      Alert.alert('Error', 'Enter a valid code');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await handleMfaChallenge(code);
    } catch (e: any) {
      setStatus(e.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearMfaChallenge();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Two-Factor Verification</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code from your authenticator app</Text>

        <AppTextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  codeInput: { borderWidth: 2, borderColor: '#2563eb', borderRadius: 12, padding: 18, fontSize: 28, textAlign: 'center', marginBottom: 16, fontWeight: '700', letterSpacing: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  verifyBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center' },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  cancelBtn: { marginTop: 16, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  status: { fontSize: 12, color: '#ef4444', textAlign: 'center', marginBottom: 8 },
});
