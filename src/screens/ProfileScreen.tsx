import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, memberships, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.displayName || 'Unknown'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>Role: {user?.role === 'SYSTEM_ADMIN' ? 'Administrator' : user?.role === 'EMPLOYEE' ? 'Employee' : 'Staff'}</Text>
        <Text style={styles.sso}>SSO: {user?.ssoSubject}</Text>
      </View>

      {memberships.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Department Memberships</Text>
          {memberships.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <Text style={styles.deptCode}>{m.department.code}</Text>
              <Text style={styles.deptName}>{m.department.name}</Text>
              <Text style={styles.deptRole}>{m.departmentRole}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.securityBtn}
        onPress={() => navigation.navigate('MfaSettings')}
      >
        <Ionicons name="shield-checkmark-outline" size={20} color="#2563eb" style={{ marginRight: 10 }} />
        <Text style={styles.securityBtnText}>Two-Factor Authentication (MFA)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  email: { fontSize: 14, color: '#64748b', marginTop: 4 },
  role: { fontSize: 14, color: '#2563eb', fontWeight: '600', marginTop: 8 },
  sso: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  deptCode: { fontSize: 14, fontWeight: '800', color: '#2563eb', width: 50 },
  deptName: { fontSize: 14, color: '#334155', flex: 1 },
  deptRole: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  logoutBtn: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 16 },
  securityBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 10, padding: 16, marginTop: 4, borderWidth: 1, borderColor: '#bfdbfe' },
  securityBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 15 },
});
