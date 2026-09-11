import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/requests';
import type { LegalDocument } from '../types';

export function LegalScreen({ route }: any) {
  const kind = route?.params?.kind === 'terms' ? 'terms' : 'privacy';
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setDoc(await api.legal(kind));
    } catch (e: any) {
      setError(e?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  if (error || !doc) {
    return <View style={styles.center}><Text style={styles.error}>{error || 'Unavailable'}</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>{doc.title}</Text>
      <Text style={styles.updated}>Last updated: {doc.updatedAt}</Text>
      <Text style={styles.intro}>{doc.intro}</Text>
      {doc.sections.map((s, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.heading}>{s.heading}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: '#dc2626', fontSize: 14, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  updated: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  intro: { fontSize: 14, color: '#475569', lineHeight: 21, marginBottom: 8 },
  section: { marginTop: 16 },
  heading: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  body: { fontSize: 14, color: '#475569', lineHeight: 21 },
});
