import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { api } from '../api/requests';
import { Ionicons } from '@expo/vector-icons';

interface OidcProvider {
  id: string;
  name: string;
  issuer: string;
  discoveryUrl: string;
  redirectUri: string;
  scopes: string;
  iconUrl: string | null;
  active: boolean;
  createdAt: string;
}

export function OidcProvidersScreen({ navigation }: any) {
  const [providers, setProviders] = useState<OidcProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [scopes, setScopes] = useState('openid email profile');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await api.oidcListProviders();
      setProviders(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !issuer.trim() || !clientId.trim() || !clientSecret.trim()) {
      Alert.alert('Error', 'Name, Issuer, Client ID, and Client Secret are required');
      return;
    }
    setSaving(true);
    try {
      await api.oidcCreateProvider({
        name: name.trim(),
        issuer: issuer.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        discoveryUrl: discoveryUrl.trim() || `${issuer.trim()}/.well-known/openid-configuration`,
        redirectUri: redirectUri.trim() || 'eurisko-hub://oidc-callback',
        scopes: scopes.trim() || 'openid email profile',
      });
      setShowAdd(false);
      resetForm();
      loadProviders();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create provider');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (provider: OidcProvider) => {
    Alert.alert('Delete Provider', `Delete ${provider.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.oidcDeleteProvider(provider.id);
            loadProviders();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleToggleActive = async (provider: OidcProvider) => {
    try {
      await api.oidcUpdateProvider(provider.id, { active: !provider.active });
      loadProviders();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const resetForm = () => {
    setName('');
    setIssuer('');
    setClientId('');
    setClientSecret('');
    setDiscoveryUrl('');
    setRedirectUri('');
    setScopes('openid email profile');
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OIDC Providers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Ionicons name={showAdd ? 'close' : 'add'} size={20} color="#fff" />
          <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : 'Add Provider'}</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.addForm}>
          <Text style={styles.label}>Provider Name *</Text>
          <AppTextInput style={styles.input} value={name} onChangeText={setName} placeholder="Okta, Azure AD, etc." />

          <Text style={styles.label}>Issuer URL *</Text>
          <AppTextInput style={styles.input} value={issuer} onChangeText={setIssuer} placeholder="https://your-idp.com" autoCapitalize="none" />

          <Text style={styles.label}>Discovery URL</Text>
          <AppTextInput style={styles.input} value={discoveryUrl} onChangeText={setDiscoveryUrl} placeholder="Auto-generated from issuer" autoCapitalize="none" />

          <Text style={styles.label}>Client ID *</Text>
          <AppTextInput style={styles.input} value={clientId} onChangeText={setClientId} placeholder="your-client-id" autoCapitalize="none" />

          <Text style={styles.label}>Client Secret *</Text>
          <AppTextInput style={styles.input} value={clientSecret} onChangeText={setClientSecret} placeholder="your-client-secret" secureTextEntry autoCapitalize="none" />

          <Text style={styles.label}>Redirect URI</Text>
          <AppTextInput style={styles.input} value={redirectUri} onChangeText={setRedirectUri} placeholder="eurisko-hub://oidc-callback" autoCapitalize="none" />
          <Text style={styles.hint}>Register this exact URI in your identity provider. Mobile login uses the app scheme: eurisko-hub://oidc-callback</Text>

          <Text style={styles.label}>Scopes</Text>
          <AppTextInput style={styles.input} value={scopes} onChangeText={setScopes} placeholder="openid email profile" autoCapitalize="none" />

          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleAdd} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Provider</Text>}
          </TouchableOpacity>
        </View>
      )}

      {providers.length === 0 && !showAdd && (
        <View style={styles.emptyContainer}>
          <Ionicons name="key-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No OIDC providers configured</Text>
          <Text style={styles.emptyHint}>Add an external identity provider (Okta, Azure AD, etc.) to enable SSO</Text>
        </View>
      )}

      {providers.map((provider) => (
        <View key={provider.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerIssuer}>{provider.issuer}</Text>
            </View>
            <View style={[styles.badge, !provider.active && styles.badgeInactive]}>
              <Text style={[styles.badgeText, !provider.active && styles.badgeTextInactive]}>
                {provider.active ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDetails}>
            <Text style={styles.detailLabel}>Discovery:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{provider.discoveryUrl}</Text>
          </View>
          <View style={styles.cardDetails}>
            <Text style={styles.detailLabel}>Scopes:</Text>
            <Text style={styles.detailValue}>{provider.scopes}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleActive(provider)}>
              <Ionicons name={provider.active ? 'pause-outline' : 'play-outline'} size={16} color="#2563eb" />
              <Text style={styles.actionText}>{provider.active ? 'Disable' : 'Enable'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(provider)}>
              <Ionicons name="trash-outline" size={16} color="#dc2626" />
              <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>About OIDC Providers</Text>
        <Text style={styles.infoText}>
          OpenID Connect (OIDC) providers allow your employees to sign in using external identity providers like Okta, Azure AD, Auth0, or OneLogin.{'\n\n'}To configure:{'\n'}1. Register an application in your identity provider{'\n'}2. Set the redirect URI to your callback URL{'\n'}3. Enter the provider's discovery URL or issuer URL{'\n'}4. Copy the Client ID and Client Secret
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  addForm: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, paddingHorizontal: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  providerName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  providerIssuer: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeInactive: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  badgeTextInactive: { color: '#94a3b8' },
  cardDetails: { flexDirection: 'row', marginTop: 8 },
  detailLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', width: 80 },
  detailValue: { fontSize: 12, color: '#334155', flex: 1 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  infoBox: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 16, marginTop: 20, marginBottom: 40 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#475569', lineHeight: 20 },
});
