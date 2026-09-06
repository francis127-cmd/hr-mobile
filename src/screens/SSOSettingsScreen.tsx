import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../api/requests';
import { useAuth } from '../auth/AuthContext';

export function SSOSettingsScreen() {
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getCompanySettings();
      setCompanyName(data.name || '');
      setCompanySlug(data.slug || '');
      setDomain(data.domain || '');
      setGoogleClientId(data.googleClientId || '');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!domain.trim()) {
      Alert.alert('Error', 'Company domain is required for SSO');
      return;
    }

    setSaving(true);
    try {
      await api.updateCompanySso({
        domain: domain.trim().toLowerCase(),
        googleClientId: googleClientId.trim() || undefined,
      });
      Alert.alert('Success', 'SSO settings updated');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SSO Settings</Text>
      <Text style={styles.subtitle}>Configure how your team signs in. Users with your company domain will be directed to your identity provider.</Text>

      <Text style={styles.label}>Company Name</Text>
      <TextInput style={styles.input} value={companyName} editable={false} />

      <Text style={styles.label}>Company Slug</Text>
      <TextInput style={styles.input} value={companySlug} editable={false} />

      <Text style={styles.label}>Company Domain *</Text>
      <TextInput
        style={styles.input}
        value={domain}
        onChangeText={setDomain}
        placeholder="company.com"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>Users with emails @company.com will be routed to your SSO provider</Text>

      <Text style={styles.label}>Google OAuth Client ID</Text>
      <TextInput
        style={styles.input}
        value={googleClientId}
        onChangeText={setGoogleClientId}
        placeholder="123456789-abcdef.apps.googleusercontent.com"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>Create OAuth 2.0 credentials in Google Cloud Console for your domain. This verifies users belong to your organization.</Text>

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How SSO Works</Text>
        <Text style={styles.infoText}>
          1. Employee enters their work email{'\n'}
          2. App looks up your company by domain{'\n'}
          3. Employee signs in with Google using your OAuth credentials{'\n'}
          4. Server validates the token belongs to your domain{'\n'}
          5. Account is created (or matched to an existing invitation)
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Google Cloud Console Setup</Text>
        <Text style={styles.infoText}>
          1. Go to console.cloud.google.com{'\n'}
          2. Create OAuth 2.0 Client ID (Web application){'\n'}
          3. Add authorized redirect URI:{'\n'}
          {'   '}https://euriskoproject.onrender.com/auth/google/callback{'\n'}
          4. Copy the Client ID and paste above
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 4, marginBottom: 4 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoBox: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 16, marginTop: 20 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#475569', lineHeight: 20 },
});
