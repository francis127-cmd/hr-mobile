import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../api/requests';

export function RegisterScreen({ navigation, route }: any) {
  const prefilledEmail = route?.params?.email || '';
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'join' | 'create'>('join');

  const generateSlug = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleCompanyNameChange = (text: string) => {
    setCompanyName(text);
    if (!companySlug || companySlug === generateSlug(companyName)) {
      setCompanySlug(generateSlug(text));
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Enter a valid email');
      return;
    }
    if (!password || password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (mode === 'create') {
      if (!companyName.trim() || companyName.trim().length < 2) {
        Alert.alert('Error', 'Company name must be at least 2 characters');
        return;
      }
      if (!companySlug.trim() || companySlug.trim().length < 2) {
        Alert.alert('Error', 'Company slug must be at least 2 characters');
        return;
      }
    }

    setLoading(true);
    try {
      const result = await api.registerPassword({
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName.trim() || undefined,
        companyName: mode === 'create' ? companyName.trim() : undefined,
        companySlug: mode === 'create' ? companySlug.trim().toLowerCase() : undefined,
      });
      // AuthContext will detect the token and navigate
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join your company or create a new one</Text>

        {/* Mode Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'join' && styles.toggleBtnActive]}
            onPress={() => setMode('join')}
          >
            <Text style={[styles.toggleText, mode === 'join' && styles.toggleTextActive]}>Join Company</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'create' && styles.toggleBtnActive]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.toggleText, mode === 'create' && styles.toggleTextActive]}>Create Company</Text>
          </TouchableOpacity>
        </View>

        {mode === 'join' ? (
          <Text style={styles.hint}>Your email must match a company domain, or you must have an invitation.</Text>
        ) : (
          <Text style={styles.hint}>Register a new company. You'll be the admin.</Text>
        )}

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
          secureTextEntry
        />

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your Name"
          autoCapitalize="words"
        />

        {mode === 'create' && (
          <>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={handleCompanyNameChange}
              placeholder="Acme Corp"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Company Slug *</Text>
            <TextInput
              style={styles.input}
              value={companySlug}
              onChangeText={setCompanySlug}
              placeholder="acme-corp"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        )}

        <TouchableOpacity style={[styles.registerBtn, loading && styles.registerBtnDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>{mode === 'create' ? 'Create Company' : 'Create Account'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toggleBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#fff' },
  hint: { fontSize: 12, color: '#94a3b8', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16 },
  registerBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
});
