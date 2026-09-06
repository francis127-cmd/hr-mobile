import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../auth/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://euriskoproject.onrender.com';
const GOOGLE_WEB_CLIENT_ID = '804630899699-d6eceuaat3io3p1f65ihvsejfgpnatcn.apps.googleusercontent.com';
const BACKEND_CALLBACK = `${API_BASE}/auth/google/callback`;
const DEEP_LINK_SCHEME = 'eurisko-hub://auth';

export function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith(DEEP_LINK_SCHEME)) {
        const parsed = new URL(url);
        const token = parsed.searchParams.get('token');
        if (token) {
          handleGoogleLogin(token);
        }
      }
    });
    return () => sub.remove();
  }, []);

  const handleGoogleLogin = async (accessToken: string) => {
    setLoading(true);
    try {
      await loginWithGoogle(accessToken);
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const state = Math.random().toString(36).slice(2);
      const params = new URLSearchParams({
        client_id: GOOGLE_WEB_CLIENT_ID,
        redirect_uri: BACKEND_CALLBACK,
        response_type: 'code',
        scope: 'openid profile email',
        state,
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, DEEP_LINK_SCHEME);

      if (result.type === 'success' && result.url) {
        const parsed = new URL(result.url);
        const token = parsed.searchParams.get('token');
        if (token) {
          await handleGoogleLogin(token);
        } else {
          Alert.alert('Login failed', 'No token received from authentication');
        }
      }
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Google authentication failed');
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
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Text style={styles.googleBtnText}>G  Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 16, alignItems: 'center' },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
  buttonDisabled: { opacity: 0.6 },
});
