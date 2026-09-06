import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authStore, DEFAULT_API_BASE } from './authStore';
import { api } from '../api/requests';
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
  loginWithGoogle: (idToken: string) => Promise<void>;
  completeSetup: (companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  memberships: [],
  newCompany: false,
  loginWithGoogle: async () => {},
  completeSetup: async () => {},
  logout: async () => {},
  refreshMemberships: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<DepartmentMember[]>([]);
  const [newCompany, setNewCompany] = useState(false);

  useEffect(() => {
    const s = authStore.get();
    if (s.token && s.ssoSubject) {
      setUser({
        ssoSubject: s.ssoSubject,
        userId: s.userId,
        displayName: s.displayName,
        email: s.email,
        role: s.role,
        apiBase: s.apiBase,
        companyId: s.companyId || '',
      });
      setNewCompany(s.newCompany);
      api.myMemberships().then((m) => setMemberships(m as any)).catch(() => {});
    }
    setLoading(false);
  }, []);

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
    try {
      const mod = require('@react-native-google-signin/google-signin');
      await mod.GoogleSignin.signOut();
    } catch {}
    await authStore.logout();
    setUser(null);
    setMemberships([]);
    setNewCompany(false);
  }, []);

  const refreshMemberships = useCallback(async () => {
    try {
      const m = await api.myMemberships();
      setMemberships(m as any);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, memberships, newCompany, loginWithGoogle, completeSetup, logout, refreshMemberships }}>
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
