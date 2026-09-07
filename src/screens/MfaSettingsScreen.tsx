import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { api } from '../api/requests';

export function MfaSettingsScreen({ navigation }: any) {
  const [status, setStatus] = useState<{ enabled: boolean; backupCodesRemaining: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const s = await api.mfaStatus();
      setStatus(s);
    } catch (e: any) {
      setStatus({ enabled: false, backupCodesRemaining: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = () => {
    Alert.alert('Disable MFA', 'Are you sure? This will remove two-factor authentication from your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.mfaDisable();
            loadStatus();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to disable MFA');
          }
        },
      },
    ]);
  };

  const handleRegenerateBackupCodes = async () => {
    Alert.alert('Regenerate Backup Codes', 'Your old backup codes will be invalidated.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Regenerate',
        onPress: async () => {
          try {
            const result = await api.mfaRegenerateBackupCodes();
            Alert.alert('New Backup Codes', result.backupCodes.join('\n'), [{ text: 'OK' }]);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to regenerate codes');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Two-Factor Authentication</Text>

        {status?.enabled ? (
          <>
            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Enabled</Text>
              </View>
            </View>

            <Text style={styles.label}>Backup codes remaining: {status.backupCodesRemaining}</Text>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleRegenerateBackupCodes}>
              <Text style={styles.secondaryBtnText}>Regenerate Backup Codes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerBtn} onPress={handleDisable}>
              <Text style={styles.dangerBtnText}>Disable MFA</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.hint}>Add an extra layer of security to your account with two-factor authentication.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('MfaSetup')}>
              <Text style={styles.primaryBtnText}>Enable MFA</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 16 },
  hint: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, color: '#334155', marginBottom: 16 },
  statusRow: { alignItems: 'center', marginBottom: 20 },
  statusBadge: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 },
  statusText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  primaryBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  secondaryBtnText: { color: '#334155', fontSize: 14, fontWeight: '600' },
  dangerBtn: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  dangerBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
});
