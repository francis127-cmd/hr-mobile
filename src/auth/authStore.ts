import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_API_BASE = 'https://euriskoproject.onrender.com';
const CONFIGURED_API_BASE = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE).replace(/\/$/, '');

interface AuthState {
  ssoSubject: string;
  token: string;
  refreshToken: string;
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
  refreshToken: '',
  apiBase: CONFIGURED_API_BASE,
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
      // Keep the deployed endpoint controlled by build configuration. Older
      // builds may have persisted a dead/stale API URL and make every screen
      // look offline after an upgrade.
      state = { ...state, ...parsed, apiBase: CONFIGURED_API_BASE };
    }
  } catch {}
}

export const hydration = loadFromStorage();

export const authStore = {
  get(): AuthState {
    return state;
  },

  async set(partial: Partial<AuthState>) {
    state = { ...state, ...partial };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  async setToken(
    token: string,
    ssoSubject: string,
    role: string,
    apiBase: string,
    displayName?: string,
    email?: string,
    userId?: string,
    companyId?: string,
    newCompany?: boolean,
    refreshToken?: string,
  ) {
    state = {
      ...state,
      token,
      ssoSubject,
      role,
      apiBase,
      displayName: displayName || state.displayName,
      email: email || state.email,
      userId: userId || state.userId,
      companyId: companyId || state.companyId,
      newCompany: newCompany ?? state.newCompany,
      refreshToken: refreshToken || state.refreshToken,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  async logout() {
    state = {
      ssoSubject: '',
      token: '',
      refreshToken: '',
    apiBase: CONFIGURED_API_BASE,
      role: '',
      displayName: '',
      email: '',
      userId: '',
      companyId: '',
      newCompany: false,
    };
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
