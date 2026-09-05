import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/requests';
import { ApiError } from '../api/client';
import { Department, PRIORITY_OPTIONS, PRIORITY_LABELS } from '../types';
import { PickerField } from '../components/PickerField';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRequest'>;

export function CreateRequestScreen({ route, navigation }: Props) {
  const { departmentCode: presetDept, requestTypeCode: presetType } = route.params || {};
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState(presetDept || '');
  const [selectedType, setSelectedType] = useState(presetType || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('STANDARD');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.catalog().then((depts) => {
      setDepartments(depts);
      if (!selectedDept && depts.length > 0) {
        setSelectedDept(depts[0].code);
        if (depts[0].requestTypes.length > 0) {
          setSelectedType(depts[0].requestTypes[0].code);
        }
      }
    });
  }, []);

  const dept = departments.find((d) => d.code === selectedDept);
  const reqTypes = dept?.requestTypes || [];

  const submit = async () => {
    if (!selectedDept) return Alert.alert('Required', 'Choose a department.');
    if (!selectedType) return Alert.alert('Required', 'Choose a request type.');
    if (!title.trim()) return Alert.alert('Required', 'Enter a title.');

    setSubmitting(true);
    try {
      await api.createRequest({
        departmentCode: selectedDept,
        requestTypeCode: selectedType,
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority as any,
      });
      navigation.goBack();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : e?.message || 'Could not create request';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <PickerField
          label="Department *"
          value={selectedDept}
          options={departments.map((d) => d.code)}
          optionLabels={(code) => departments.find((d) => d.code === code)?.name || code}
          onSelect={(code) => {
            setSelectedDept(code);
            const d = departments.find((d) => d.code === code);
            setSelectedType(d?.requestTypes[0]?.code || '');
          }}
        />

        {reqTypes.length > 0 && (
          <PickerField
            label="Request Type *"
            value={selectedType}
            options={reqTypes.map((rt) => rt.code)}
            optionLabels={(code) => reqTypes.find((rt) => rt.code === code)?.name || code}
            onSelect={setSelectedType}
          />
        )}

        {reqTypes.find((rt) => rt.code === selectedType)?.description && (
          <Text style={styles.hint}>{reqTypes.find((rt) => rt.code === selectedType)?.description}</Text>
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief description of your request"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional details (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                {PRIORITY_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 14 },
  hint: { color: '#64748b', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 14, fontSize: 15, backgroundColor: '#fff',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  priorityBtn: {
    flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    padding: 10, alignItems: 'center',
  },
  priorityBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  priorityText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  priorityTextActive: { color: '#2563eb' },
  button: {
    backgroundColor: '#2563eb', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
