import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/requests';
import type { AppNotification } from '../types';

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listNotifications();
      setItems(data);
    } catch {
      // keep stale list on transient errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openItem = async (item: AppNotification) => {
    try {
      if (!item.readAt) await api.markNotificationRead(item.id);
    } catch {}
    if (item.requestId) {
      navigation.navigate('RequestDetail', { id: item.requestId });
    } else {
      load();
    }
  };

  const markAll = async () => {
    try {
      await api.markAllNotificationsRead();
      load();
    } catch {}
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <View style={styles.container}>
      {items.some((i) => !i.readAt) && (
        <TouchableOpacity style={styles.markAll} onPress={markAll}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.readAt && styles.cardUnread]}
            onPress={() => openItem(item)}
          >
            <View style={styles.row}>
              <Ionicons
                name={item.readAt ? 'mail-open-outline' : 'mail-unread-outline'}
                size={20}
                color={item.readAt ? '#94a3b8' : '#2563eb'}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.title, !item.readAt && styles.titleUnread]}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  markAll: { alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12 },
  markAllText: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardUnread: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  titleUnread: { fontWeight: '800' },
  body: { fontSize: 14, color: '#475569', marginTop: 4 },
  time: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});
