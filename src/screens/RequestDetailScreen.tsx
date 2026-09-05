import React, { useCallback, useState } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api } from '../api/requests';
import { ApiError } from '../api/client';
import {
  HrRequest,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  RequestStatus,
} from '../types';
import { Badge } from '../components/Badge';
import { Loading } from '../components/Feedback';
import { useAuth, isDeptMember } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;

export function RequestDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user, memberships } = useAuth();
  const [request, setRequest] = useState<HrRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.getRequest(id);
      setRequest(r);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  const isStaff = isDeptMember(memberships, request?.departmentId || '') || user?.role === 'SYSTEM_ADMIN';
  const isClaimant = request?.claimedBy === user?.userId;
  const owns = request?.employeeId === user?.userId;

  const handleClaim = async () => {
    if (!request) return;
    setSaving(true);
    try {
      await api.claimRequest(request.id);
      await load();
      Alert.alert('Claimed', 'You are now working on this request.');
    } catch (e: any) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not claim');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!request) return;
    setSaving(true);
    try {
      await api.updateStatus(request.id, { status: 'COMPLETED', resolutionNote: resolutionNote.trim() || undefined });
      await load();
      Alert.alert('Completed', 'Request marked as completed.');
    } catch (e: any) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not complete');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason.');
      return;
    }
    setSaving(true);
    try {
      await api.updateStatus(request.id, { status: 'REJECTED', rejectionReason: rejectionReason.trim() });
      await load();
      setShowReject(false);
      Alert.alert('Rejected', 'Request has been rejected.');
    } catch (e: any) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not reject');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel request', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          if (!request) return;
          try {
            await api.cancelRequest(request.id);
            await load();
          } catch (e: any) {
            Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not cancel');
          }
        },
      },
    ]);
  };

  const handleUpload = async () => {
    if (!request) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      setSaving(true);
      await api.uploadDocument(request.id, { uri: asset.uri, name: asset.name, type: asset.mimeType ?? undefined });
      await load();
      Alert.alert('Uploaded', 'Document attached.');
    } catch (e: any) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!request) return;
    try {
      setSaving(true);
      const { filename, base64 } = await api.downloadDocument(request.id);
      const fileUri = (FileSystem as any).cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: `Save ${filename}` });
      } else {
        Alert.alert('Saved', `${filename} saved to cache.`);
      }
    } catch (e: any) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Download failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = () => {
    Alert.alert('Delete document', 'Remove the attached document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!request) return;
          try {
            await api.deleteDocument(request.id);
            await load();
          } catch (e: any) {
            Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not delete');
          }
        },
      },
    ]);
  };

  if (loading) return <Loading label="Loading request..." />;
  if (error && !request) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={load}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
      </View>
    );
  }
  if (!request) return null;

  const canClaim = isStaff && request.status === RequestStatus.PENDING && !request.claimedBy;
  const canWork = isStaff && request.status === RequestStatus.IN_PROGRESS && isClaimant;
  const canCancel = owns && request.status === RequestStatus.PENDING;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Badge label={STATUS_LABELS[request.status]} color={STATUS_COLORS[request.status]} />
          <Badge label={`${PRIORITY_LABELS[request.priority]}`} color={PRIORITY_COLORS[request.priority]} outline />
        </View>

        <Text style={styles.title}>{request.title}</Text>
        <Text style={styles.meta}>Department: {request.department?.name || request.departmentId}</Text>
        <Text style={styles.meta}>Type: {request.requestType?.name || request.requestTypeId}</Text>
        <Text style={styles.meta}>From: {request.employee?.displayName || request.employeeId}</Text>
        {request.description ? <Text style={styles.desc}>{request.description}</Text> : null}

        {request.claimedBy && (
          <Text style={styles.meta}>Claimed by: {request.claimedBy === user?.ssoSubject ? 'You' : request.claimedBy}</Text>
        )}

        {request.resolutionNote && (
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Resolution</Text>
            <Text style={styles.noteText}>{request.resolutionNote}</Text>
          </View>
        )}

        {request.rejectionReason && (
          <View style={[styles.noteBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={[styles.noteTitle, { color: '#dc2626' }]}>Rejection Reason</Text>
            <Text style={styles.noteText}>{request.rejectionReason}</Text>
          </View>
        )}

        {/* Documents */}
        <View style={styles.docSection}>
          {request.documents && request.documents.length > 0 ? (
            request.documents.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <TouchableOpacity style={styles.linkBtn} onPress={handleDownload}>
                  <Text style={styles.linkText}>Download {doc.originalFilename}</Text>
                </TouchableOpacity>
                {isStaff && (
                  <TouchableOpacity style={styles.linkBtn} onPress={handleDeleteDoc}>
                    <Text style={[styles.linkText, { color: '#dc2626' }]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : null}
          {isStaff && request.claimedBy && (
            <TouchableOpacity style={styles.linkBtn} onPress={handleUpload}>
              <Text style={styles.linkText}>{request.documents?.length ? 'Replace document' : 'Attach document'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        {canClaim && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleClaim} disabled={saving}>
            <Text style={styles.actionBtnText}>{saving ? 'Claiming...' : 'Claim Request'}</Text>
          </TouchableOpacity>
        )}

        {canWork && (
          <>
            {!showReject ? (
              <>
                <Text style={styles.label}>Resolution note</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the resolution..."
                  value={resolutionNote}
                  onChangeText={setResolutionNote}
                  multiline
                />
                <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} disabled={saving}>
                  <Text style={styles.completeBtnText}>{saving ? 'Saving...' : 'Mark Complete'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectToggleBtn} onPress={() => setShowReject(true)}>
                  <Text style={styles.rejectToggleText}>Reject instead</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Rejection reason *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Explain why this request is rejected..."
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                />
                <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} disabled={saving}>
                  <Text style={styles.rejectBtnText}>{saving ? 'Rejecting...' : 'Reject Request'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectToggleBtn} onPress={() => setShowReject(false)}>
                  <Text style={styles.rejectToggleText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {!isStaff && !owns && (
          <View style={styles.readonly}>
            <Text style={styles.readonlyText}>You can view but not edit this request.</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  headerRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  meta: { color: '#64748b', fontSize: 14, marginTop: 3 },
  desc: { color: '#334155', fontSize: 14, marginTop: 8, lineHeight: 20 },
  noteBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 10, padding: 14, marginTop: 14 },
  noteTitle: { fontSize: 12, fontWeight: '700', color: '#d97706', marginBottom: 4 },
  noteText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  docSection: { marginTop: 16, gap: 8 },
  docRow: { flexDirection: 'row', gap: 12 },
  linkBtn: { paddingVertical: 4 },
  linkText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: '#fff' },
  textArea: { height: 90, textAlignVertical: 'top' },
  actionBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  completeBtn: { backgroundColor: '#22c55e', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12 },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rejectToggleBtn: { alignItems: 'center', padding: 12, marginTop: 8 },
  rejectToggleText: { color: '#dc2626', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#dc2626', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12 },
  rejectBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 12 },
  cancelText: { color: '#dc2626', fontWeight: '700' },
  readonly: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  readonlyText: { color: '#64748b' },
  errorText: { color: '#dc2626', fontSize: 15, marginBottom: 12 },
  retry: { color: '#2563eb', fontWeight: '700', fontSize: 16 },
});
