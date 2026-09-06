import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../api/requests';

export function AcceptInviteScreen({ navigation, route }: any) {
  const token = route?.params?.token;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError('No invitation token provided');
      setValidating(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const info = await api.validateInviteToken(token);
      setInviteInfo(info);
    } catch (e: any) {
      setError(e.message || 'Invalid invitation');
    } finally {
      setValidating(false);
    }
  };

  const handleAccept = async () => {
    if (!password || password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.acceptInvite(token, password);
      // AuthContext will detect the token and navigate
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Validating invitation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Invalid Invitation</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Accept Invitation</Text>
        <Text style={styles.subtitle}>You've been invited to join {inviteInfo?.companyName}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{inviteInfo?.email}</Text>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{inviteInfo?.role}</Text>
          {inviteInfo?.department && (
            <>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{inviteInfo?.department}</Text>
            </>
          )}
        </View>

        <Text style={styles.label}>Set Password *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          autoFocus
        />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
          secureTextEntry
        />

        <TouchableOpacity style={[styles.acceptBtn, loading && styles.acceptBtnDisabled]} onPress={handleAccept} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptBtnText}>Accept & Sign In</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#dc2626', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  infoBox: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 14, marginBottom: 20 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: '#f8fafc' },
  acceptBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  acceptBtnDisabled: { opacity: 0.6 },
  acceptBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
});
