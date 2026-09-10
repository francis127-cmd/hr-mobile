import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Share } from 'react-native';
import { api } from '../api/requests';

export function InviteUserScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [platformRole, setPlatformRole] = useState('EMPLOYEE');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentRole, setDepartmentRole] = useState('AGENT');
  const [departments, setDepartments] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  useEffect(() => {
    api.adminListDepartments()
      .then((ds) => setDepartments([...new Map(ds.map((d) => [d.code, d])).values()]))
      .catch(() => {});
  }, []);

  const handleInvite = async () => {
    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    setLoading(true);
    setCreatedToken(null);
    try {
      const invite = await api.adminInviteUser({
        email: email.toLowerCase().trim(),
        platformRole,
        departmentCode: departmentCode || undefined,
        departmentRole: departmentCode ? departmentRole : undefined,
      });
      setCreatedToken(invite.token);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!createdToken) return;
    try {
      await Share.share({
        message: `You've been invited to join ${email} on Internal Operations Hub. Open the app, tap "Have an invitation code?" on the login screen, and enter this code:\n\n${createdToken}`,
      });
    } catch {}
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Invite User</Text>
      <Text style={styles.subtitle}>Only invited users can join. Share the invitation code with them after creating it.</Text>

      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="user@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Platform Role</Text>
      <View style={styles.roleRow}>
        {['EMPLOYEE', 'SYSTEM_ADMIN'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleBtn, platformRole === r && styles.roleBtnActive]}
            onPress={() => setPlatformRole(r)}
          >
            <Text style={[styles.roleText, platformRole === r && styles.roleTextActive]}>
              {r === 'EMPLOYEE' ? 'Employee' : 'Admin'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Invitation'}</Text>
      </TouchableOpacity>

      {createdToken && (
        <View style={styles.tokenBox}>
          <Text style={styles.tokenTitle}>Invitation created for {email}</Text>
          <Text style={styles.tokenLabel}>Share this code with them. They enter it via "Have an invitation code?" on the login screen, then set their password. Valid for 7 days.</Text>
          <Text style={styles.tokenValue} selectable>{createdToken}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
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
  tokenBox: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, padding: 16, marginTop: 24 },
  tokenTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  tokenLabel: { fontSize: 13, color: '#475569', marginBottom: 10, lineHeight: 19 },
  tokenValue: { fontSize: 13, fontWeight: '700', color: '#1d4ed8', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
  shareBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  doneBtn: { marginTop: 12, alignItems: 'center' },
  doneBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
});
