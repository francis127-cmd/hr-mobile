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
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../auth/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '804630899699-bneivotrnm10s65vddkv8cmgl9jk0apc.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export function LoginScreen() {
  const { loginWithGoogle, loginWithSso } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testUser, setTestUser] = useState('francis.king');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'eurisko-hub' }),
    },
    discovery,
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleLogin(id_token);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      await loginWithGoogle(idToken);
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    if (!testUser.trim()) return;
    setLoading(true);
    try {
      await loginWithSso(testUser.trim());
    } catch (e: any) {
      Alert.alert('Test Login Failed', e?.message || 'Could not log in with test user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Internal Operations Hub</Text>
        <Text style={styles.subtitle}>Sign in with your company account</Text>

        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.buttonDisabled]}
          onPress={() => promptAsync()}
          disabled={!request || loading}
        >
          <Text style={styles.googleBtnText}>G  Sign in with Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR TEST / DEV MODE</Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.devLabel}>SSO Username or Email:</Text>
        <TextInput
          style={styles.devInput}
          value={testUser}
          onChangeText={setTestUser}
          placeholder="e.g. francis.king or admin@fakecompany.com"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.devBtn, loading && styles.buttonDisabled]}
          onPress={handleTestLogin}
          disabled={loading}
        >
          <Text style={styles.devBtnText}>{loading ? 'Signing in...' : 'Sign In (Test Mode)'}</Text>
        </TouchableOpacity>
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 10, fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  devLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  devInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12, backgroundColor: '#f8fafc' },
  devBtn: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, alignItems: 'center' },
  devBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
