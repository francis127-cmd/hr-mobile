import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authStore, hydration } from './authStore';
import { api } from '../api/requests';
import { registerUnauthorizedHandler } from '../api/client';
import { DepartmentMember } from '../types';

interface AuthUser {
  ssoSubject: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  apiBase: string;
  companyId: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  memberships: DepartmentMember[];
  newCompany: boolean;
  mfaRequired: boolean;
  mfaToken: string | null;
  loginWithGoogle: (idToken: string) => Promise<void>;
  completeSetup: (companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  handleMfaChallenge: (mfaCode: string) => Promise<void>;
  clearMfaChallenge: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  memberships: [],
  newCompany: false,
  mfaRequired: false,
  mfaToken: null,
  loginWithGoogle: async () => {},
  completeSetup: async () => {},
  logout: async () => {},
  refreshMemberships: async () => {},
  handleMfaChallenge: async () => {},
  clearMfaChallenge: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<DepartmentMember[]>([]);
  const [newCompany, setNewCompany] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  const handleSessionExpired = useCallback(async () => {
    await authStore.logout();
    setUser(null);
    setMemberships([]);
    setNewCompany(false);
    setMfaRequired(false);
    setMfaToken(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const unregisterUnauthorizedHandler = registerUnauthorizedHandler(handleSessionExpired);

    void (async () => {
      await hydration;
      if (!mounted) return;
      const s = authStore.get();
      if (s.token && s.ssoSubject) {
        setUser({
          ssoSubject: s.ssoSubject, userId: s.userId, displayName: s.displayName,
          email: s.email, role: s.role, apiBase: s.apiBase, companyId: s.companyId || '',
        });
        setNewCompany(s.newCompany);
        try {
          const m = await api.myMemberships();
          if (mounted) setMemberships(m as any);
        } catch (err: any) {
          if (err?.status === 401) await handleSessionExpired();
        }
      }
      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
      unregisterUnauthorizedHandler();
    };
  }, [handleSessionExpired]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const result = await api.loginGoogle(idToken);
    const s = authStore.get();
    setUser({
      ssoSubject: s.ssoSubject,
      userId: s.userId,
      displayName: s.displayName,
      email: s.email,
      role: s.role,
      apiBase: s.apiBase,
      companyId: s.companyId || '',
    });
    setNewCompany(result.newCompany);
    await authStore.set({ newCompany: result.newCompany });
    try {
      const m = await api.myMemberships();
      setMemberships(m as any);
    } catch {}
  }, []);

  const completeSetup = useCallback(async (companyName: string) => {
    if (user?.companyId) {
      await api.updateCompany(user.companyId, companyName);
    }
    setNewCompany(false);
    await authStore.set({ newCompany: false });
  }, [user]);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    try {
      const mod = require('@react-native-google-signin/google-signin');
      await mod.GoogleSignin.signOut();
    } catch {}
    await authStore.logout();
    setUser(null);
    setMemberships([]);
    setNewCompany(false);
    setMfaRequired(false);
    setMfaToken(null);
  }, []);

  const refreshMemberships = useCallback(async () => {
    try {
      const m = await api.myMemberships();
      setMemberships(m as any);
    } catch (err: any) {
      if (err?.status === 401) {
        await handleSessionExpired();
      }
    }
  }, [handleSessionExpired]);

  const handleMfaChallenge = useCallback(async (mfaCode: string) => {
    if (!mfaToken) throw new Error('No MFA session');
    await api.completeMfa(mfaToken, mfaCode);
    const s = authStore.get();
    setUser({
      ssoSubject: s.ssoSubject,
      userId: s.userId,
      displayName: s.displayName,
      email: s.email,
      role: s.role,
      apiBase: s.apiBase,
      companyId: s.companyId || '',
    });
    setMfaRequired(false);
    setMfaToken(null);
    try {
      const m = await api.myMemberships();
      setMemberships(m as any);
    } catch {}
  }, [mfaToken]);

  const clearMfaChallenge = useCallback(() => {
    setMfaRequired(false);
    setMfaToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        memberships,
        newCompany,
        mfaRequired,
        mfaToken,
        loginWithGoogle,
        completeSetup,
        logout,
        refreshMemberships,
        handleMfaChallenge,
        clearMfaChallenge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function canManageAll(user: AuthUser | null): boolean {
  return user?.role === 'SYSTEM_ADMIN';
}

export function isDeptMember(memberships: DepartmentMember[], departmentId: string): boolean {
  return memberships.some((m) => m.departmentId === departmentId);
}

export function isDeptManager(memberships: DepartmentMember[], departmentId: string): boolean {
  return memberships.some((m) => m.departmentId === departmentId && m.departmentRole === 'MANAGER');
}
