import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HrRequest, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '../types';

interface Props {
  request: HrRequest;
  onPress: (id: string) => void;
}

export function RequestCard({ request, onPress }: Props) {
  return (
    <View style={styles.card} onTouchEnd={() => onPress(request.id)}>
      <View style={styles.headerRow}>
        <Text style={styles.dept}>{request.department?.code || '?'}</Text>
        <Text style={[styles.status, { color: STATUS_COLORS[request.status] }]}>
          {STATUS_LABELS[request.status]}
        </Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>{request.title}</Text>
      <Text style={styles.type}>{request.requestType?.name || request.requestTypeId}</Text>
      <View style={styles.footer}>
        <Text style={[styles.priority, { color: PRIORITY_COLORS[request.priority] }]}>
          {PRIORITY_LABELS[request.priority]}
        </Text>
        <Text style={styles.date}>{new Date(request.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dept: { fontSize: 12, fontWeight: '800', color: '#2563eb', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  status: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  type: { fontSize: 13, color: '#64748b' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  priority: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 12, color: '#94a3b8' },
});
