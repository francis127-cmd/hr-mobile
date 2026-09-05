import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { api } from '../api/requests';
import { useAuth } from '../auth/AuthContext';

export function InviteUserScreen({ navigation }: any) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentRole, setDepartmentRole] = useState('AGENT');
  const [departments, setDepartments] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.adminListDepartments().then(setDepartments).catch(() => {});
  }, []);

  const handleInvite = async () => {
    if (!email || !displayName) {
      Alert.alert('Error', 'Email and name are required');
      return;
    }
    setLoading(true);
    try {
      await api.adminInviteUser({
        email: email.toLowerCase().trim(),
        displayName: displayName.trim(),
        departmentCode: departmentCode || undefined,
        departmentRole: departmentCode ? departmentRole : undefined,
      });
      Alert.alert('Success', `Invite sent to ${email}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Invite User</Text>
      <Text style={styles.subtitle}>User will sign in via Google SSO</Text>

      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="user@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Display Name *</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="John Doe"
      />

      <Text style={styles.label}>Department (optional)</Text>
      <View style={styles.picker}>
        {departments.map((d) => (
          <TouchableOpacity
            key={d.code}
            style={[styles.pickerItem, departmentCode === d.code && styles.pickerItemActive]}
            onPress={() => setDepartmentCode(departmentCode === d.code ? '' : d.code)}
          >
            <Text style={[styles.pickerText, departmentCode === d.code && styles.pickerTextActive]}>
              {d.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {departmentCode && (
        <>
          <Text style={styles.label}>Role in Department</Text>
          <View style={styles.roleRow}>
            {['AGENT', 'MANAGER'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, departmentRole === r && styles.roleBtnActive]}
                onPress={() => setDepartmentRole(r)}
              >
                <Text style={[styles.roleText, departmentRole === r && styles.roleTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleInvite} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Invite'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerItem: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  pickerItemActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pickerText: { fontSize: 13, color: '#334155' },
  pickerTextActive: { color: '#fff' },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  roleTextActive: { color: '#fff' },
  btn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
