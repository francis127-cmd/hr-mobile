import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';

interface Props {
  label: string;
  value: string;
  options: string[];
  optionLabels?: (value: string) => string;
  onSelect: (value: string) => void;
}

export function PickerField({ label, value, options, optionLabels, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const labelFn = optionLabels || ((v: string) => v);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.picker} onPress={() => setOpen(true)}>
        <Text style={styles.pickerText}>{value ? labelFn(value) : 'Select...'}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item === value && styles.optionActive]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextActive]}>
                    {labelFn(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, backgroundColor: '#fff',
  },
  pickerText: { fontSize: 15, color: '#1e293b' },
  arrow: { fontSize: 12, color: '#94a3b8' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%', padding: 20 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  option: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 2 },
  optionActive: { backgroundColor: '#eff6ff' },
  optionText: { fontSize: 15, color: '#334155' },
  optionTextActive: { color: '#2563eb', fontWeight: '700' },
});
