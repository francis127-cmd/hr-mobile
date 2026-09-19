import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { api } from '../api/requests';
import { ApiError } from '../api/client';
import { HrRequest, RequestStats, STATUS_COLORS, STATUS_LABELS } from '../types';
import { RequestCard } from '../components/RequestCard';
import { Loading, EmptyState } from '../components/Feedback';
import { useAuth } from '../auth/AuthContext';
import { RootNavigation } from '../navigation/types';

// expo-av has no strict .m4a preset, so recording options are pinned
// explicitly: AAC in MP4 container on both platforms. Backend accepts .m4a.
const VOICE_RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export function HomeScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { user, memberships, refreshMemberships } = useAuth();
  const [requests, setRequests] = useState<HrRequest[]>([]);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'dept' | 'claimed'>('my');
  const [unread, setUnread] = useState(0);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useSharedValue(1);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    shadowOpacity: 0.25 + (pulse.value - 1) * 2,
  }));

  const showVoiceToast = useCallback((msg: string) => {
    setVoiceToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setVoiceToast(null), 3200);
  }, []);

  const startVoiceRecording = useCallback(async () => {
    if (recordingRef.current || voiceUploading) return;
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone needed', 'Allow microphone access to create tickets by voice.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(VOICE_RECORDING_OPTIONS);
      recordingRef.current = recording;
      setVoiceRecording(true);
      pulse.value = withRepeat(withTiming(1.18, { duration: 650 }), -1, true);
    } catch (e: any) {
      Alert.alert('Recording failed', e?.message || 'Could not start recording.');
    }
  }, [voiceUploading, pulse]);

  // finishVoiceRecording lives below loadClaimed: it calls load(), which is
  // declared further down, and referencing it in a deps array up here would
  // crash on render (temporal dead zone).

  const isStaff = memberships.length > 0 || user?.role === 'SYSTEM_ADMIN';
  const firstDept = memberships[0];

  const load = useCallback(async () => {
    try {
      const [reqs, st] = await Promise.all([api.listMyRequests(), api.getStats()]);
      setRequests(reqs);
      setStats(st);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadDeptQueue = useCallback(async (deptCode: string) => {
    try {
      setLoading(true);
      const reqs = await api.listDeptQueue(deptCode);
      setRequests(reqs);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadClaimed = useCallback(async () => {
    try {
      setLoading(true);
      const reqs = await api.listClaimed();
      setRequests(reqs);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const finishVoiceRecording = useCallback(async () => {
    const rec = recordingRef.current;
    recordingRef.current = null;
    pulse.value = withTiming(1, { duration: 200 });
    if (!rec) return;
    setVoiceRecording(false);
    try {
      const status = await rec.getStatusAsync();
      await rec.stopAndUnloadAsync();
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch {}
      const uri = rec.getURI();
      if (!uri || (status.durationMillis ?? 0) < 800) {
        showVoiceToast('Hold the button and speak your request');
        return;
      }
      setVoiceUploading(true);
      const res = await api.generateTicketFromVoice(uri);
      showVoiceToast(`Ticket created: ${res.ticket.title}`);
      setActiveTab('my');
      await load();
    } catch (e: any) {
      Alert.alert('Voice ticket failed', e instanceof ApiError ? e.message : e?.message || 'Could not create ticket.');
    } finally {
      setVoiceUploading(false);
    }
  }, [pulse, showVoiceToast, load]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (rec) rec.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  useFocusEffect(useCallback(() => {
    refreshMemberships();
    api.unreadNotificationCount().then(setUnread).catch(() => {});
    if (activeTab === 'dept' && firstDept) {
      loadDeptQueue(firstDept.department.code);
    } else if (activeTab === 'claimed') {
      loadClaimed();
    } else {
      load();
    }
  }, [activeTab, load, loadDeptQueue, loadClaimed, firstDept, refreshMemberships]));

  const switchTab = (tab: 'my' | 'dept' | 'claimed') => {
    setActiveTab(tab);
    setRequests([]);
    setLoading(true);
  };

  if (loading && requests.length === 0) return <Loading label="Loading..." />;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.displayName || user?.ssoSubject}</Text>
        <TouchableOpacity
          style={styles.bell}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={24} color="#0f172a" />
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : String(unread)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: STATUS_COLORS.PENDING }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: STATUS_COLORS.IN_PROGRESS }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: STATUS_COLORS.COMPLETED }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          {isStaff && (
            <TouchableOpacity
              style={styles.stat}
              onPress={() => switchTab('claimed')}
              accessibilityLabel="View claimed requests"
            >
              <Text style={[styles.statNum, { color: STATUS_COLORS.IN_PROGRESS }]}>{stats.claimedActive ?? 0}</Text>
              <Text style={styles.statLabel}>Claimed</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isStaff && memberships.length > 0 && (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.tabActive]}
            onPress={() => switchTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>My Requests</Text>
          </TouchableOpacity>
          {memberships.map((m) => (
            <TouchableOpacity
              key={m.departmentId}
              style={[styles.tab, activeTab === 'dept' && styles.tabActive]}
              onPress={() => switchTab('dept')}
            >
              <Text style={[styles.tabText, activeTab === 'dept' && styles.tabTextActive]}>{m.department.code} Queue</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.tab, activeTab === 'claimed' && styles.tabActive]}
            onPress={() => switchTab('claimed')}
          >
            <Text style={[styles.tabText, activeTab === 'claimed' && styles.tabTextActive]}>Claimed</Text>
          </TouchableOpacity>
          {user?.role === 'SYSTEM_ADMIN' && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'dept' && styles.tabActive]}
              onPress={() => switchTab('dept')}
            >
              <Text style={[styles.tabText, activeTab === 'dept' && styles.tabTextActive]}>All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {error ? (
        <View style={styles.center}>
          <EmptyState message={error} />
          <TouchableOpacity onPress={() => activeTab === 'dept' && firstDept ? loadDeptQueue(firstDept.department.code) : activeTab === 'claimed' ? loadClaimed() : load()}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            if (activeTab === 'dept' && firstDept) loadDeptQueue(firstDept.department.code);
            else if (activeTab === 'claimed') loadClaimed();
            else load();
          }}
            />
          }
          ListEmptyComponent={
            <EmptyState message={activeTab === 'dept' ? 'No requests in department queue.' : activeTab === 'claimed' ? 'No claimed requests yet.' : 'No requests yet. Tap + to create one.'} />
          }
          renderItem={({ item }) => (
            <RequestCard request={item} onPress={(id) => navigation.navigate('RequestDetail', { id })} />
          )}
        />
      )}

      {(user?.role === 'EMPLOYEE' || user?.role === 'SYSTEM_ADMIN') && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateRequest', {})} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {(user?.role === 'EMPLOYEE' || user?.role === 'SYSTEM_ADMIN') && (
        <Animated.View style={[styles.voiceFabWrap, glowStyle]}>
          <Pressable
            style={styles.voiceFab}
            onPressIn={startVoiceRecording}
            onPressOut={finishVoiceRecording}
            accessibilityLabel="Hold to create a ticket by voice"
          >
            {voiceUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="sparkles" size={28} color="#fff" />
            )}
          </Pressable>
        </Animated.View>
      )}

      {voiceToast && (
        <Animated.View
          style={styles.voiceToast}
          entering={FadeInDown.duration(220)}
          exiting={FadeOutDown.duration(220)}
        >
          <Text style={styles.voiceToastText}>{voiceToast}</Text>
        </Animated.View>
      )}

      {voiceRecording && (
        <View style={styles.voiceHint}>
          <Text style={styles.voiceHintText}>Listening… release to create your ticket</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0f172a', flex: 1 },
  bell: { padding: 6 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#dc2626', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  list: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retry: { color: '#2563eb', fontWeight: '700', fontSize: 16, marginTop: 12 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '700' },
  voiceFabWrap: {
    position: 'absolute', right: 20, bottom: 92, width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed', shadowOpacity: 0.25, shadowRadius: 12,
    elevation: 6,
  },
  voiceFab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 32 },
  voiceToast: {
    position: 'absolute', left: 20, right: 20, bottom: 170,
    backgroundColor: '#0f172a', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  voiceToastText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  voiceHint: {
    position: 'absolute', left: 20, right: 20, bottom: 170,
    backgroundColor: '#7c3aed', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  voiceHintText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
