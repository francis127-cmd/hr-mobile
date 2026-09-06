import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { api } from '../api/requests';
import { useAuth } from '../auth/AuthContext';

GoogleSignin.configure({
  webClientId: '804630899699-d6eceuaat3io3p1f65ihvsejfgpnatcn.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
});

export function LoginScreen({ navigation }: any) {
  const { loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [step, setStep] = useState<'email' | 'sso' | 'password'>('email');
  const [discoverResult, setDiscoverResult] = useState<any>(null);

  const handleDiscover = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      const result = await api.discover(email.trim().toLowerCase());
      setDiscoverResult(result);

      if (result.authMode === 'SSO') {
        // Configure GoogleSignin with company's client ID
        if (result.googleClientId) {
          GoogleSignin.configure({
            webClientId: result.googleClientId,
            scopes: ['profile', 'email'],
          });
        }
        setStep('sso');
        setStatus(`Signing in to ${result.companyName} via Google...`);
        handleGoogleSignIn();
      } else if (result.authMode === 'PASSWORD') {
        setStep('password');
        setStatus('');
      } else {
        // REGISTER mode — no company found
        navigation.navigate('Register', { email: email.trim().toLowerCase() });
      }
    } catch (e: any) {
      // If domain not found, offer registration
      if (e.status === 404) {
        navigation.navigate('Register', { email: email.trim().toLowerCase() });
      } else {
        setStatus(e.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      if (tokens.idToken) {
        await loginWithGoogle(tokens.idToken);
        // AuthContext will detect the token and navigate
      }
    } catch (e: any) {
      setStatus(e.message || 'Google sign-in failed');
    }
  };

  const handlePasswordLogin = async (password: string) => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      await api.loginPassword(email.trim().toLowerCase(), password);
      // AuthContext will detect the token and navigate to Main
    } catch (e: any) {
      setStatus(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setDiscoverResult(null);
    setStatus('');
  };

  // PASSWORD mode — show password input
  if (step === 'password') {
    return (
      <PasswordStep
        email={email}
        companyName={discoverResult?.companyName}
        onLogin={handlePasswordLogin}
        onBack={handleBack}
        loading={loading}
        status={status}
      />
    );
  }

  // SSO mode — show Google sign-in
  if (step === 'sso') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>Internal Operations Hub</Text>
          <Text style={styles.subtitle}>Signing in to {discoverResult?.companyName}</Text>

          <Text style={styles.email}>{email}</Text>

          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#333" /> : <Text style={styles.googleBtnText}>G  Sign in with Google</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Use a different email</Text>
          </TouchableOpacity>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // EMAIL step — default
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

        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register', { email })}>
          <Text style={styles.registerBtnText}>Register your company</Text>
        </TouchableOpacity>

        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function PasswordStep({ email, companyName, onLogin, onBack, loading, status }: {
  email: string;
  companyName?: string;
  onLogin: (password: string) => void;
  onBack: () => void;
  loading: boolean;
  status: string;
}) {
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Internal Operations Hub</Text>
        <Text style={styles.subtitle}>Sign in to {companyName || 'your company'}</Text>

        <Text style={styles.email}>{email}</Text>

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoFocus
        />

        <TouchableOpacity
          style={[styles.continueBtn, loading && styles.buttonDisabled]}
          onPress={() => onLogin(password)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Use a different email</Text>
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
  registerBtn: { marginTop: 12, alignItems: 'center' },
  registerBtnText: { fontSize: 13, color: '#94a3b8' },
  buttonDisabled: { opacity: 0.6 },
  status: { fontSize: 12, color: '#6366f1', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});
