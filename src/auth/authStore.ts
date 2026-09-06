import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_API_BASE = 'https://euriskoproject.onrender.com';

interface AuthState {
  ssoSubject: string;
  token: string;
  apiBase: string;
  role: string;
  displayName: string;
  email: string;
  userId: string;
  companyId: string;
  newCompany: boolean;
}

let state: AuthState = {
  ssoSubject: '',
  token: '',
  apiBase: DEFAULT_API_BASE,
  role: '',
  displayName: '',
  email: '',
  userId: '',
  companyId: '',
  newCompany: false,
};

const STORAGE_KEY = 'hr_auth';

async function loadFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    }
  } catch {}
}

loadFromStorage();

export const authStore = {
  get(): AuthState {
    return state;
  },

  async set(partial: Partial<AuthState>) {
    state = { ...state, ...partial };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  async setToken(token: string, ssoSubject: string, role: string, apiBase: string, displayName?: string, email?: string, userId?: string, companyId?: string, newCompany?: boolean) {
    state = { ...state, token, ssoSubject, role, apiBase, displayName: displayName || state.displayName, email: email || state.email, userId: userId || state.userId, companyId: companyId || state.companyId, newCompany: newCompany ?? state.newCompany };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  async logout() {
    state = { ssoSubject: '', token: '', apiBase: DEFAULT_API_BASE, role: '', displayName: '', email: '', userId: '', companyId: '', newCompany: false };
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
