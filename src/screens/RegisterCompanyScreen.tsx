import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://euriskoproject.onrender.com';

export function RegisterCompanyScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSlug = (companyName: string) => {
    return companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(text));
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Error', 'Company name must be at least 2 characters');
      return;
    }
    if (!slug.trim() || slug.trim().length < 2) {
      Alert.alert('Error', 'Slug must be at least 2 characters');
      return;
    }
    if (!domain.trim() || !domain.includes('.')) {
      Alert.alert('Error', 'Enter a valid company domain (e.g. company.com)');
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      Alert.alert('Error', 'Enter a valid admin email');
      return;
    }
    if (!adminEmail.toLowerCase().endsWith(`@${domain.trim().toLowerCase()}`)) {
      Alert.alert('Error', 'Admin email must match your company domain');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/companies/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          domain: domain.trim().toLowerCase(),
          adminEmail: adminEmail.trim().toLowerCase(),
          adminName: adminName.trim() || adminEmail.split('@')[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      Alert.alert(
        'Company Registered!',
        `Your company "${data.company.name}" has been created.\n\nAdmin: ${data.admin.email}\n\nYou can now sign in with Google using your @${domain} email.`,
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }],
      );
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Failed to register company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Register Your Company</Text>
        <Text style={styles.subtitle}>Set up your organization for Internal Operations Hub. You'll be the admin.</Text>

        <Text style={styles.label}>Company Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Acme Corp"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Company Slug *</Text>
        <TextInput
          style={styles.input}
          value={slug}
          onChangeText={setSlug}
          placeholder="acme-corp"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Email Domain *</Text>
        <TextInput
          style={styles.input}
          value={domain}
          onChangeText={setDomain}
          placeholder="acme.com"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>Your employees' email domain (e.g. acme.com)</Text>

        <Text style={styles.label}>Admin Email *</Text>
        <TextInput
          style={styles.input}
          value={adminEmail}
          onChangeText={setAdminEmail}
          placeholder="admin@acme.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>Must match your company domain. You'll sign in with this email.</Text>

        <Text style={styles.label}>Admin Display Name</Text>
        <TextInput
          style={styles.input}
          value={adminName}
          onChangeText={setAdminName}
          placeholder="Your Name"
          autoCapitalize="words"
        />

        <TouchableOpacity style={[styles.registerBtn, loading && styles.registerBtnDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Register Company</Text>}
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
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  registerBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
});
