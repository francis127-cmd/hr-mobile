import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.empty}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  label: { marginTop: 12, fontSize: 14, color: '#64748b' },
  empty: { fontSize: 15, color: '#94a3b8', textAlign: 'center' },
});
