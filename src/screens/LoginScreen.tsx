import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { api } from '../api/requests';
import { useAuth } from '../auth/AuthContext';
import { AppTextInput } from '../components/AppTextInput';
import * as WebBrowser from 'expo-web-browser';

// Single global Google web client ID for the entire app. The backend verifies
// token audience against this same value, so per-company reconfiguration is
// intentionally NOT done — it would cause "Invalid Google token" mismatches.
const GLOBAL_GOOGLE_WEB_CLIENT_ID =
  '804630899699-d6eceuaat3io3p1f65ihvsejfgpnatcn.apps.googleusercontent.com';

let GoogleSignin: any = null;
let nativeGoogleAvailable = false;

try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;
  if (GoogleSignin && typeof GoogleSignin.configure === 'function') {
    GoogleSignin.configure({
      webClientId: GLOBAL_GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
    });
    nativeGoogleAvailable = true;
  }
} catch {
  nativeGoogleAvailable = false;
}

export function LoginScreen({ navigation }: any) {
  const { loginWithGoogle, loginWithOidc, loginWithPassword, handleMfaChallenge } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [step, setStep] = useState<'email' | 'sso' | 'password' | 'mfa'>('email');
  const [discoverResult, setDiscoverResult] = useState<any>(null);
  const [mfaToken, setMfaToken] = useState<string>('');
  const [mfaCode, setMfaCode] = useState('');
  const [oidcProviders, setOidcProviders] = useState<any[]>([]);

  const loadOidcProviders = async (companySlug: string) => {
    try {
      const result = await api.oidcDiscoverProviders(companySlug);
      setOidcProviders(result.providers || []);
    } catch {
      setOidcProviders([]);
    }
  };

  const handleDiscover = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      const result = await api.discover(email.trim().toLowerCase());
      setDiscoverResult(result);

      if (result.authMode === 'SSO') {
        // Keep the global webClientId configured above. Reconfiguring with a
        // per-company value would change the token audience and the backend
        // would reject it as an invalid Google token.
        setStep('sso');
        setStatus(`Signing in to ${result.companyName} via Google...`);
        if (result.companySlug) void loadOidcProviders(result.companySlug);
        handleGoogleSignIn();
      } else if (result.authMode === 'OIDC') {
        setStep('sso');
        setStatus('');
        if (result.companySlug) await loadOidcProviders(result.companySlug);
      } else if (result.authMode === 'PASSWORD') {
        setStep('password');
        setStatus('');
      } else {
        navigation.navigate('Register', { email: email.trim().toLowerCase() });
      }
    } catch (e: any) {
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
    if (!nativeGoogleAvailable || !GoogleSignin) {
      Alert.alert(
        'Native Google Sign-In',
        'Google Play Services native sign-in requires an EAS development build. When testing in Expo Go or Web, you can sign in with Email & Password.',
        [
          { text: 'Use Password', onPress: () => setStep('password') },
          { text: 'OK' },
        ],
      );
      return;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      if (tokens.idToken) {
        await loginWithGoogle(tokens.idToken);
      }
    } catch (e: any) {
      setStatus(e.message || 'Google sign-in failed');
    }
  };

  const handleUpfrontGoogleSignIn = async () => {
    if (!nativeGoogleAvailable || !GoogleSignin) {
      Alert.alert(
        'Native Google Sign-In',
        'Google Play Services native sign-in requires an EAS development build.',
        [{ text: 'OK' }],
      );
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.idToken) {
        setStatus('Google sign-in failed');
        return;
      }
      // Route by company like the email flow: SSO companies sign straight
      // in, PASSWORD companies land on the password step, unknown emails
      // go to registration.
      const idPayload = JSON.parse(atob(tokens.idToken.split('.')[1]));
      const googleEmail = String(idPayload.email || '').toLowerCase();
      if (!googleEmail) {
        setStatus('Google sign-in failed');
        return;
      }
      setEmail(googleEmail);
      const result = await api.discover(googleEmail);
      setDiscoverResult(result);
      if (result.authMode === 'SSO') {
        await loginWithGoogle(tokens.idToken);
      } else if (result.authMode === 'PASSWORD' || result.authMode === 'OIDC') {
        setStep(result.authMode === 'OIDC' ? 'sso' : 'password');
        if (result.authMode === 'OIDC' && result.companySlug) {
          await loadOidcProviders(result.companySlug);
        }
        setStatus('');
      } else {
        navigation.navigate('Register', { email: googleEmail });
      }
    } catch (e: any) {
      setStatus(e.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOidcSignIn = async (provider: any) => {
    const companySlug = discoverResult?.companySlug;
    if (!companySlug) {
      setStatus('Company not resolved');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const redirectUri = 'eurisko-hub://oidc-callback';
      const { authorizationUrl, state, codeVerifier } = await api.oidcInitiateLogin(
        companySlug,
        provider.name,
        redirectUri,
      );
      const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, redirectUri);
      if (result.type !== 'success' || !result.url) {
        setStatus('Sign-in cancelled');
        return;
      }
      const params = new URL(result.url).searchParams;
      const code = params.get('code');
      const returnedState = params.get('state');
      if (!code || !returnedState) {
        setStatus('Sign-in failed: no authorization code returned');
        return;
      }
      await loginWithOidc({ companySlug, providerName: provider.name, code, codeVerifier, state: returnedState });
    } catch (e: any) {
      setStatus(e.message || 'Sign-in with provider failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (password: string) => {
    if (!password.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      const result = await api.loginPassword(email.trim().toLowerCase(), password, discoverResult?.companySlug);
      if (result.mfaRequired && result.mfaToken) {
        setMfaToken(result.mfaToken);
        setStep('mfa');
        setStatus('');
      } else {
        loginWithPassword();
      }
    } catch (e: any) {
      setStatus(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async () => {
    if (!mfaCode.trim() || mfaCode.length < 6) {
      Alert.alert('Error', 'Enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await handleMfaChallenge(mfaCode);
    } catch (e: any) {
      setStatus(e.message || 'Invalid MFA code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setDiscoverResult(null);
    setOidcProviders([]);
    setStatus('');
    setMfaToken('');
    setMfaCode('');
  };

  if (step === 'mfa') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>Two-Factor Verification</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code from your authenticator app</Text>

          <Text style={styles.email}>{email}</Text>

          <Text style={styles.label}>MFA Code</Text>
          <AppTextInput
            style={styles.mfaInput}
            value={mfaCode}
            onChangeText={setMfaCode}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.continueBtn, loading && styles.buttonDisabled]}
            onPress={handleMfaSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>Verify</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Use a different email</Text>
          </TouchableOpacity>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (step === 'password') {
    return (
      <PasswordStep
        email={email}
        companyName={discoverResult?.companyName}
        onLogin={handlePasswordLogin}
        onBack={handleBack}
        onSso={handleGoogleSignIn}
        hasSso={discoverResult?.authMode === 'SSO'}
        loading={loading}
        status={status}
      />
    );
  }

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

          {oidcProviders.map((provider) => (
            <TouchableOpacity
              key={provider.name}
              style={[styles.googleBtn, styles.oidcBtn, loading && styles.buttonDisabled]}
              onPress={() => handleOidcSignIn(provider)}
              disabled={loading}
            >
              <Text style={styles.googleBtnText}>Continue with {provider.name}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Use a different email</Text>
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
        <Text style={styles.ssoHint}>Enter your work email and we'll route you to your company's sign-in — or continue with Google below.</Text>

        <Text style={styles.label}>Work Email</Text>
        <AppTextInput
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

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          <Text style={{ marginHorizontal: 12, color: '#94a3b8', fontSize: 13 }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
        </View>

        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.buttonDisabled]}
          onPress={handleUpfrontGoogleSignIn}
          disabled={loading}
        >
          <Text style={styles.googleBtnText}>G  Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register', { email })}>
          <Text style={styles.registerBtnText}>Register your company</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('AcceptInvite')}>
          <Text style={styles.registerBtnText}>Have an invitation code?</Text>
        </TouchableOpacity>

        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function PasswordStep({ email, companyName, onLogin, onBack, onSso, hasSso, loading, status }: {
  email: string;
  companyName?: string;
  onLogin: (password: string) => void;
  onBack: () => void;
  onSso: () => void;
  hasSso: boolean;
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
        <AppTextInput
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

        {hasSso && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              <Text style={{ marginHorizontal: 12, color: '#94a3b8', fontSize: 13 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, loading && styles.buttonDisabled]}
              onPress={onSso}
              disabled={loading}
            >
              <Text style={styles.googleBtnText}>G  Sign in with Google</Text>
            </TouchableOpacity>
          </>
        )}

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
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 8 },
  ssoHint: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  email: { fontSize: 14, color: '#111827', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 20, backgroundColor: '#f8fafc' },
  mfaInput: { borderWidth: 2, borderColor: '#2563eb', borderRadius: 12, padding: 18, fontSize: 28, textAlign: 'center', marginBottom: 20, fontWeight: '700', letterSpacing: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 16, alignItems: 'center' },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
  oidcBtn: { marginTop: 12 },
  continueBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  registerBtn: { marginTop: 12, alignItems: 'center' },
  registerBtnText: { fontSize: 13, color: '#94a3b8' },
  buttonDisabled: { opacity: 0.6 },
  status: { fontSize: 12, color: '#6366f1', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});
