import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/requests';
import { Department, PRIORITY_LABELS, PRIORITY_COLORS } from '../types';
import { Loading } from '../components/Feedback';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRequest'>;

export function DepartmentScreen({ navigation }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.catalog().then(setDepartments).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading departments..." />;

  return (
    <View style={styles.container}>
      {departments.map((dept) => (
        <View key={dept.id} style={styles.deptSection}>
          <Text style={styles.deptName}>{dept.name}</Text>
          <Text style={styles.deptDesc}>{dept.description}</Text>
          {dept.requestTypes.map((rt) => (
            <TouchableOpacity
              key={rt.id}
              style={styles.typeBtn}
              onPress={() => navigation.navigate('CreateRequest', {
                departmentCode: dept.code,
                requestTypeCode: rt.code,
              })}
            >
              <Text style={styles.typeName}>{rt.name}</Text>
              <Text style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[rt.defaultPriority] + '20', color: PRIORITY_COLORS[rt.defaultPriority] }]}>
                {PRIORITY_LABELS[rt.defaultPriority]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  deptSection: { marginBottom: 20 },
  deptName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  deptDesc: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  typeBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  typeName: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 },
  priorityBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
});
