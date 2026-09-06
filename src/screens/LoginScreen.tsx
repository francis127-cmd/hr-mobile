import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
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
  GoogleSignin.configure({
    webClientId: '804630899699-d6eceuaat3io3p1f65ihvsejfgpnatcn.apps.googleusercontent.com',
    offlineAccess: false,
    scopes: ['openid', 'profile', 'email'],
  });
  nativeAvailable = true;
} catch {
  nativeAvailable = false;
}

const DEMO_ACCOUNTS = [
  { label: 'Francis King (System Admin)', sso: 'francis.king' },
  { label: 'Yorgo Cnam (Employee)', sso: 'yorgo.cnam' },
  { label: 'James Wilson (Employee)', sso: 'james.wilson' },
];

export function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [useNative, setUseNative] = useState(false);

  useEffect(() => {
    if (nativeAvailable) {
      GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false })
        .then(() => setUseNative(true))
        .catch(() => setUseNative(false));
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      setStatus('Checking Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      setStatus('Opening Google sign-in...');
      await GoogleSignin.signIn();

      setStatus('Getting tokens...');
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

  const handleMockLogin = async (ssoSubject: string) => {
    setLoading(true);
    setSelected(ssoSubject);
    try {
      setStatus('Connecting to server...');
      const res = await fetch(`${API_BASE}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssoSubject }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed');
      }
      setStatus('Signing in...');
      const { accessToken } = await res.json();
      await loginWithGoogle(accessToken);
      setStatus('Done!');
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Authentication failed');
    } finally {
      setLoading(false);
      setSelected(null);
      setTimeout(() => setStatus(''), 2000);
    }
  };

  if (useNative) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>Internal Operations Hub</Text>
          <Text style={styles.subtitle}>Sign in with your company account</Text>
          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#333" /> : <Text style={styles.googleBtnText}>G  Sign in with Google</Text>}
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
        <Text style={styles.subtitle}>Select your account to sign in</Text>
        {DEMO_ACCOUNTS.map((account) => (
          <TouchableOpacity
            key={account.sso}
            style={[styles.accountBtn, selected === account.sso && styles.accountBtnActive, loading && selected !== account.sso && styles.accountBtnDisabled]}
            onPress={() => handleMockLogin(account.sso)}
            disabled={loading}
          >
            <Text style={styles.accountName}>{account.label}</Text>
            <Text style={styles.accountId}>{account.sso}</Text>
          </TouchableOpacity>
        ))}
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <Text style={styles.hint}>Demo mode — run EAS build for Google SSO</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 16, alignItems: 'center' },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
  accountBtn: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, marginBottom: 10, backgroundColor: '#f8fafc' },
  accountBtnActive: { borderColor: '#111827', backgroundColor: '#f1f5f9' },
  accountBtnDisabled: { opacity: 0.5 },
  accountName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  accountId: { fontSize: 12, color: '#64748b', marginTop: 2 },
  buttonDisabled: { opacity: 0.6 },
  hint: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 },
  status: { fontSize: 12, color: '#6366f1', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});
