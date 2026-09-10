import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { api } from '../api/requests';
import { useAuth } from '../auth/AuthContext';

export function MfaSetupScreen({ navigation }: any) {
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [step, setStep] = useState<'loading' | 'show' | 'verify' | 'done'>('loading');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadSetup();
  }, []);

  const loadSetup = async () => {
    try {
      const result = await api.mfaSetup();
      setSecret(result.secret);
      setOtpauthUrl(result.otpauthUrl);
      setBackupCodes(result.backupCodes);
      setStep('show');
    } catch (e: any) {
      setStatus(e.message || 'Failed to generate MFA secret');
    }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      Alert.alert('Error', 'Enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await api.mfaVerify(verifyCode);
      setStep('done');
    } catch (e: any) {
      setStatus(e.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Generating MFA secret...</Text>
      </View>
    );
  }

  if (step === 'show') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Set Up Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</Text>

          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>otpauth://totp/</Text>
              <Text style={styles.qrTextSmall}>{otpauthUrl.split('otpauth://totp/')[1]?.substring(0, 40) || '...'}</Text>
            </View>
          </View>

          <Text style={styles.label}>Or enter this code manually:</Text>
          <View style={styles.secretBox}>
            <Text style={styles.secretText}>{secret}</Text>
          </View>

          <Text style={styles.label}>Save these backup codes (each used once):</Text>
          <View style={styles.backupBox}>
            {backupCodes.map((code, i) => (
              <Text key={i} style={styles.backupCode}>{code}</Text>
            ))}
          </View>

          <TouchableOpacity style={styles.continueBtn} onPress={() => setStep('verify')}>
            <Text style={styles.continueBtnText}>I've saved my codes — Verify</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === 'verify') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify Your Code</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code from your authenticator app</Text>

          <AppTextInput
            style={styles.codeInput}
            value={verifyCode}
            onChangeText={setVerifyCode}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          {status ? <Text style={styles.status}>{status}</Text> : null}

          <TouchableOpacity
            style={[styles.continueBtn, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>Verify & Enable</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => { setStep('show'); setStatus(''); }}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>MFA Enabled!</Text>
        <Text style={styles.subtitle}>Two-factor authentication is now active on your account.</Text>
        <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.continueBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  qrContainer: { alignItems: 'center', marginBottom: 20 },
  qrPlaceholder: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 20, width: 200, height: 200, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  qrText: { fontSize: 10, color: '#94a3b8', textAlign: 'center' },
  qrTextSmall: { fontSize: 8, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  secretBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  secretText: { fontSize: 18, fontWeight: '700', color: '#0f172a', textAlign: 'center', letterSpacing: 2 },
  backupBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  backupCode: { fontSize: 13, fontWeight: '600', color: '#334155', backgroundColor: '#e0e7ff', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  codeInput: { borderWidth: 2, borderColor: '#2563eb', borderRadius: 12, padding: 18, fontSize: 28, textAlign: 'center', marginBottom: 16, fontWeight: '700', letterSpacing: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  continueBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  status: { fontSize: 12, color: '#ef4444', textAlign: 'center', marginTop: 8 },
});
