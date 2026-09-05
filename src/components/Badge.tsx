import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  color: string;
  outline?: boolean;
}

export function Badge({ label, color, outline }: BadgeProps) {
  return (
    <View style={[styles.badge, outline ? { borderColor: color, borderWidth: 1 } : { backgroundColor: color + '20' }]}>
      <Text style={[styles.text, { color: outline ? color : color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});
