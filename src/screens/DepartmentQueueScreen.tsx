import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../api/requests';
import { HrRequest } from '../types';
import { RequestCard } from '../components/RequestCard';
import { Loading, EmptyState } from '../components/Feedback';
import { RootStackParamList, RootNavigation } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DepartmentQueue'>;

export function DepartmentQueueScreen({ route }: Props) {
  const { departmentCode, departmentName } = route.params;
  const navigation = useNavigation<RootNavigation>();
  const [requests, setRequests] = useState<HrRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = departmentCode === '_all'
        ? await api.listMyRequests()
        : await api.listDeptQueue(departmentCode);
      setRequests(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [departmentCode]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading label={`Loading ${departmentName} queue...`} />;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>{departmentName}</Text>
        <Text style={styles.count}>{requests.length} requests</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <EmptyState message={error} />
          <TouchableOpacity onPress={load}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState message="No requests in this queue." />}
          renderItem={({ item }) => (
            <RequestCard request={item} onPress={(itemId) => navigation.navigate('RequestDetail', { id: itemId })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  count: { fontSize: 13, color: '#64748b', marginTop: 2 },
  list: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retry: { color: '#2563eb', fontWeight: '700', fontSize: 16, marginTop: 12 },
});
