import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../api/requests';
import { Ionicons } from '@expo/vector-icons';

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  platformRole: string;
  active: boolean;
  memberships: { departmentRole: string; department: { code: string; name: string } }[];
}

export function ManageUsersScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const data = await api.adminListUsers();
      setUsers(data as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadUsers(); }, []));

  const toggleRole = async (user: UserRecord) => {
    const newRole = user.platformRole === 'SYSTEM_ADMIN' ? 'EMPLOYEE' : 'SYSTEM_ADMIN';
    Alert.alert(
      'Change Platform Role',
      `Set ${user.displayName} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.adminUpdateUser(user.id, { platformRole: newRole });
              loadUsers();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ],
    );
  };

  const deactivate = async (user: UserRecord) => {
    Alert.alert('Deactivate User', `Deactivate ${user.displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.adminDeactivateUser(user.id);
            loadUsers();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: UserRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.displayName}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <View style={[styles.badge, !item.active && styles.badgeInactive]}>
          <Text style={[styles.badgeText, !item.active && styles.badgeTextInactive]}>
            {item.platformRole === 'SYSTEM_ADMIN' ? 'ADMIN' : item.active ? 'USER' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      {item.memberships.length > 0 && (
        <View style={styles.deptRow}>
          {item.memberships.map((m, i) => (
            <Text key={i} style={styles.deptTag}>
              {m.department.code} · {m.departmentRole}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleRole(item)}>
          <Ionicons name="shield-outline" size={16} color="#2563eb" />
          <Text style={styles.actionText}>Role</Text>
        </TouchableOpacity>
        {item.active && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => deactivate(item)}>
            <Ionicons name="ban-outline" size={16} color="#dc2626" />
            <Text style={[styles.actionText, { color: '#dc2626' }]}>Deactivate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.inviteBtn} onPress={() => navigation.navigate('InviteUser' as never)}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={styles.inviteBtnText}>Invite User</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, paddingBottom: 0 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  inviteBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  email: { fontSize: 13, color: '#64748b', marginTop: 2 },
  badge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeInactive: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  badgeTextInactive: { color: '#94a3b8' },
  deptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  deptTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, color: '#334155' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});
