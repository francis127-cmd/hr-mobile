import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../api/requests';
import { HrRequest, RequestStats, STATUS_COLORS, STATUS_LABELS } from '../types';
import { RequestCard } from '../components/RequestCard';
import { Loading, EmptyState } from '../components/Feedback';
import { useAuth } from '../auth/AuthContext';
import { RootNavigation } from '../navigation/types';

export function HomeScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { user, memberships } = useAuth();
  const [requests, setRequests] = useState<HrRequest[]>([]);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'dept' | 'claimed'>('my');

  const isStaff = memberships.length > 0 || user?.role === 'SYSTEM_ADMIN';
  const firstDept = memberships[0];

  const load = useCallback(async () => {
    try {
      const [reqs, st] = await Promise.all([api.listMyRequests(), api.getStats()]);
      setRequests(reqs);
      setStats(st);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadDeptQueue = useCallback(async (deptCode: string) => {
    try {
      setLoading(true);
      const reqs = await api.listDeptQueue(deptCode);
      setRequests(reqs);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadClaimed = useCallback(async () => {
    try {
      setLoading(true);
      const reqs = await api.listClaimed();
      setRequests(reqs);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (activeTab === 'dept' && firstDept) {
      loadDeptQueue(firstDept.department.code);
    } else if (activeTab === 'claimed') {
      loadClaimed();
    } else {
      load();
    }
  }, [activeTab, load, loadDeptQueue, loadClaimed, firstDept]));

  const switchTab = (tab: 'my' | 'dept' | 'claimed') => {
    setActiveTab(tab);
    setRequests([]);
    setLoading(true);
  };

  if (loading && requests.length === 0) return <Loading label="Loading..." />;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.displayName || user?.ssoSubject}</Text>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: STATUS_COLORS.PENDING }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: STATUS_COLORS.IN_PROGRESS }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: STATUS_COLORS.COMPLETED }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      )}

      {isStaff && memberships.length > 0 && (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.tabActive]}
            onPress={() => switchTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>My Requests</Text>
          </TouchableOpacity>
          {memberships.map((m) => (
            <TouchableOpacity
              key={m.departmentId}
              style={[styles.tab, activeTab === 'dept' && styles.tabActive]}
              onPress={() => switchTab('dept')}
            >
              <Text style={[styles.tabText, activeTab === 'dept' && styles.tabTextActive]}>{m.department.code} Queue</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.tab, activeTab === 'claimed' && styles.tabActive]}
            onPress={() => switchTab('claimed')}
          >
            <Text style={[styles.tabText, activeTab === 'claimed' && styles.tabTextActive]}>Claimed</Text>
          </TouchableOpacity>
          {user?.role === 'SYSTEM_ADMIN' && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'dept' && styles.tabActive]}
              onPress={() => switchTab('dept')}
            >
              <Text style={[styles.tabText, activeTab === 'dept' && styles.tabTextActive]}>All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {error ? (
        <View style={styles.center}>
          <EmptyState message={error} />
          <TouchableOpacity onPress={() => activeTab === 'dept' && firstDept ? loadDeptQueue(firstDept.department.code) : activeTab === 'claimed' ? loadClaimed() : load()}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            if (activeTab === 'dept' && firstDept) loadDeptQueue(firstDept.department.code);
            else if (activeTab === 'claimed') loadClaimed();
            else load();
          }}
            />
          }
          ListEmptyComponent={
            <EmptyState message={activeTab === 'dept' ? 'No requests in department queue.' : activeTab === 'claimed' ? 'No claimed requests yet.' : 'No requests yet. Tap + to create one.'} />
          }
          renderItem={({ item }) => (
            <RequestCard request={item} onPress={(id) => navigation.navigate('RequestDetail', { id })} />
          )}
        />
      )}

      {(user?.role === 'EMPLOYEE' || user?.role === 'SYSTEM_ADMIN') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateRequest', {})} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  list: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retry: { color: '#2563eb', fontWeight: '700', fontSize: 16, marginTop: 12 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '700' },
});
