import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { api } from '../api/requests';

export function SSOSettingsScreen() {
  const [domain, setDomain] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [authMode, setAuthMode] = useState('PASSWORD');
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
      setAuthMode(data.authMode || 'PASSWORD');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCompanySso({
        domain: domain.trim().toLowerCase() || undefined,
        googleClientId: googleClientId.trim() || undefined,
        authMode,
      });
      Alert.alert('Success', 'Settings updated');
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
      <Text style={styles.title}>Company Settings</Text>
      <Text style={styles.subtitle}>Configure authentication and SSO for your organization.</Text>

      <Text style={styles.label}>Company Name</Text>
      <TextInput style={[styles.input, styles.inputDisabled]} value={companyName} editable={false} />

      <Text style={styles.label}>Company Slug</Text>
      <TextInput style={[styles.input, styles.inputDisabled]} value={companySlug} editable={false} />

      {/* Auth Mode Toggle */}
      <Text style={styles.label}>Authentication Mode</Text>
      <View style={styles.authModeRow}>
        <TouchableOpacity
          style={[styles.authModeBtn, authMode === 'PASSWORD' && styles.authModeBtnActive]}
          onPress={() => setAuthMode('PASSWORD')}
        >
          <Text style={[styles.authModeText, authMode === 'PASSWORD' && styles.authModeTextActive]}>
            Email + Password
          </Text>
          <Text style={styles.authModeDesc}>Employees sign in with email and password</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.authModeBtn, authMode === 'SSO' && styles.authModeBtnActive]}
          onPress={() => setAuthMode('SSO')}
        >
          <Text style={[styles.authModeText, authMode === 'SSO' && styles.authModeTextActive]}>
            Google SSO
          </Text>
          <Text style={styles.authModeDesc}>Employees sign in via Google OAuth</Text>
        </TouchableOpacity>
      </View>

      {authMode === 'SSO' && (
        <>
          <Text style={styles.label}>Company Domain</Text>
          <TextInput
            style={styles.input}
            value={domain}
            onChangeText={setDomain}
            placeholder="company.com"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>Users with emails @company.com will be routed to Google SSO</Text>

          <Text style={styles.label}>Google OAuth Client ID</Text>
          <TextInput
            style={styles.input}
            value={googleClientId}
            onChangeText={setGoogleClientId}
            placeholder="123456789-abcdef.apps.googleusercontent.com"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>Create OAuth 2.0 credentials in Google Cloud Console</Text>
        </>
      )}

      {authMode === 'PASSWORD' && (
        <Text style={styles.hint}>
          Employees will sign in with their email and password. Admin can invite users from the Manage Users screen.
        </Text>
      )}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How Authentication Works</Text>
        <Text style={styles.infoText}>
          {authMode === 'PASSWORD' ? (
            `Password Mode:\n• Employees sign in with email + password\n• Admin invites users by email\n• Users set their password on first login\n• No external identity provider needed`
          ) : (
            `SSO Mode:\n• Employees enter their work email\n• App looks up your company by domain\n• Employee signs in with Google\n• Server validates the token belongs to your domain`
          )}
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
  inputDisabled: { backgroundColor: '#f1f5f9', color: '#94a3b8' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 4, marginBottom: 4 },
  authModeRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  authModeBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  authModeBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  authModeText: { fontSize: 14, fontWeight: '700', color: '#64748b', textAlign: 'center' },
  authModeTextActive: { color: '#2563eb' },
  authModeDesc: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoBox: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 16, marginTop: 20 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#475569', lineHeight: 20 },
});
