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
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://euriskoproject.onrender.com';

let GoogleSignin: any = null;
let statusCodes: any = null;
let nativeAvailable = false;

try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes;
  nativeAvailable = true;
} catch {
  nativeAvailable = false;
}

export function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [step, setStep] = useState<'email' | 'sso'>('email');
  const [companyInfo, setCompanyInfo] = useState<{ companyName: string; googleClientId?: string } | null>(null);

  const handleDiscover = async () => {
    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      setStatus('Looking up your company...');
      const res = await fetch(`${API_BASE}/auth/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Company not found');
      }

      const data = await res.json();
      setCompanyInfo(data);
      setStep('sso');
      setStatus('');
    } catch (e: any) {
      Alert.alert('Company not found', e.message || 'No company configured for this email domain');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!nativeAvailable || !GoogleSignin) {
      Alert.alert('Error', 'Google Sign-In is only available in the EAS build');
      return;
    }

    setLoading(true);
    try {
      setStatus('Opening Google sign-in...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.idToken) throw new Error('No ID token received');

      setStatus('Verifying with server...');
      await loginWithGoogle(tokens.idToken);
      setStatus('Done!');
    } catch (e: any) {
      if (e.code === statusCodes?.SIGN_IN_CANCELLED) {
        setLoading(false);
        setStatus('');
        return;
      }
      Alert.alert('Login failed', `${e.code || 'unknown'}: ${e.message || 'Google authentication failed'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const handleBack = () => {
    setStep('email');
    setCompanyInfo(null);
    setStatus('');
  };

  if (step === 'sso' && companyInfo) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>{companyInfo.companyName}</Text>
          <Text style={styles.subtitle}>Sign in with your company Google account</Text>
          <Text style={styles.email}>{email}</Text>

          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#333" /> : <Text style={styles.googleBtnText}>G  Sign in with Google</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>← Use a different email</Text>
          </TouchableOpacity>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Internal Operations Hub</Text>
        <Text style={styles.subtitle}>Enter your work email to sign in</Text>

        <Text style={styles.label}>Work Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.continueBtn, loading && styles.buttonDisabled]}
          onPress={handleDiscover}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>Continue</Text>}
        </TouchableOpacity>

        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  email: { fontSize: 14, color: '#111827', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 20, backgroundColor: '#f8fafc' },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 16, alignItems: 'center' },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
  continueBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  status: { fontSize: 12, color: '#6366f1', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});
