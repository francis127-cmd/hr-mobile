import { apiRequest, apiUpload, apiDownload } from './client';
import {
  AppNotification,
  CreateRequestDto,
  Department,
  DocumentRef,
  HrRequest,
  LegalDocument,
  RequestStats,
  UpdateRequestStatusDto,
} from '../types';
import { authStore } from '../auth/authStore';

export const api = {
  async registerCompany(dto: {
    name: string; slug: string; domain?: string; authMode?: string;
    googleClientId?: string; adminEmail: string; adminPassword?: string; adminName?: string;
  }): Promise<any> {
    return apiRequest('/companies/register', { method: 'POST', body: JSON.stringify(dto) });
  },
  async discover(email: string): Promise<{ authMode: string; companySlug?: string; companyName?: string; companyId?: string; provider?: string; googleClientId?: string }> {
    return apiRequest('/auth/discover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async loginPassword(email: string, password: string, companySlug?: string): Promise<{ accessToken: string; refreshToken?: string; mfaRequired?: boolean; mfaToken?: string }> {
    const res = await apiRequest<{ accessToken: string; refreshToken?: string; mfaRequired?: boolean; mfaToken?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, companySlug }),
    });
    if (res.mfaRequired) return res;
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, false, res.refreshToken);
    return res;
  },

  async completeMfa(mfaToken: string, mfaCode: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await apiRequest<{ accessToken: string; refreshToken?: string }>('/auth/mfa/challenge', {
      method: 'POST',
      body: JSON.stringify({ mfaToken, mfaCode }),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, false, res.refreshToken);
    return res;
  },

  async acceptInvite(token: string, password: string, displayName?: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await apiRequest<{ accessToken: string; refreshToken?: string }>('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password, displayName: displayName || undefined }),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, false, res.refreshToken);
    return res;
  },

  async validateInviteToken(token: string): Promise<{ email: string; role: string; department?: string; companyName: string; companySlug: string; expiresAt: string }> {
    return apiRequest(`/auth/invitations/${token}`);
  },

  async loginGoogle(idToken: string): Promise<{ newCompany: boolean; refreshToken?: string }> {
    authStore.set({ ssoSubject: '', token: '' });
    const res = await apiRequest<{ accessToken: string; refreshToken?: string; newCompany: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, res.newCompany || false, res.refreshToken);
    return { newCompany: res.newCompany || false, refreshToken: res.refreshToken };
  },

  async logout(): Promise<void> {
    const { refreshToken } = authStore.get();
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
  },

  async mfaSetup(): Promise<{ secret: string; otpauthUrl: string; backupCodes: string[] }> {
    return apiRequest('/auth/mfa/setup', { method: 'POST', body: JSON.stringify({}) });
  },

  async mfaVerify(token: string): Promise<boolean> {
    return apiRequest('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async mfaDisable(): Promise<void> {
    await apiRequest('/auth/mfa/disable', { method: 'POST', body: JSON.stringify({}) });
  },

  async mfaStatus(): Promise<{ enabled: boolean; backupCodesRemaining: number }> {
    return apiRequest('/auth/mfa/status');
  },

  async mfaRegenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
    return apiRequest('/auth/mfa/regenerate-backup-codes', { method: 'POST', body: JSON.stringify({}) });
  },

  catalog(): Promise<Department[]> {
    return apiRequest<Department[]>('/catalog');
  },

  listMyRequests(): Promise<HrRequest[]> {
    return apiRequest<HrRequest[]>('/requests');
  },

  listDeptQueue(departmentCode: string): Promise<HrRequest[]> {
    return apiRequest<HrRequest[]>(`/requests?department=${departmentCode}`);
  },

  listClaimed(): Promise<HrRequest[]> {
    return apiRequest<HrRequest[]>('/requests?view=claimed');
  },

  getRequest(id: string): Promise<HrRequest> {
    return apiRequest<HrRequest>(`/requests/${id}`);
  },

  getStats(): Promise<RequestStats> {
    return apiRequest<RequestStats>('/requests/stats');
  },

  createRequest(dto: CreateRequestDto): Promise<HrRequest> {
    return apiRequest<HrRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async generateTicketFromVoice(uri: string): Promise<{ ticket: HrRequest; transcript: string }> {
    const form = new FormData();
    form.append('file', {
      uri,
      name: 'voice.m4a',
      type: 'audio/m4a',
    } as any);
    return apiUpload<{ ticket: HrRequest; transcript: string }>('/requests/ai-generate', form);
  },

  claimRequest(id: string): Promise<HrRequest> {
    return apiRequest<HrRequest>(`/requests/${id}/claim`, { method: 'POST' });
  },

  updateStatus(id: string, dto: UpdateRequestStatusDto): Promise<HrRequest> {
    return apiRequest<HrRequest>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  cancelRequest(id: string): Promise<HrRequest> {
    return apiRequest<HrRequest>(`/requests/${id}/cancel`, { method: 'POST' });
  },

  async uploadDocument(requestId: string, file: { uri: string; name: string; type?: string }): Promise<DocumentRef> {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type ?? 'application/octet-stream',
    } as any);
    return apiUpload<DocumentRef>(`/requests/${requestId}/document`, form);
  },

  downloadDocument(requestId: string): Promise<{ filename: string; base64: string; contentType: string }> {
    return apiDownload(`/requests/${requestId}/document`);
  },

  deleteDocument(requestId: string): Promise<{ deleted: boolean }> {
    return apiRequest<{ deleted: boolean }>(`/requests/${requestId}/document`, { method: 'DELETE' });
  },

  myMemberships(): Promise<{ departmentId: string; departmentRole: string; department: Department }[]> {
    return apiRequest('/departments/me/memberships');
  },

  adminListUsers(): Promise<any[]> {
    return apiRequest<any[]>('/admin/users');
  },

  adminListDepartments(): Promise<{ id: string; code: string; name: string }[]> {
    return apiRequest<{ id: string; code: string; name: string }[]>('/admin/departments');
  },

  adminInviteUser(dto: { email: string; platformRole?: string; departmentCode?: string; departmentRole?: string }): Promise<any> {
    return apiRequest<any>('/invitations', {
      method: 'POST',
      body: JSON.stringify({
        email: dto.email,
        platformRole: dto.platformRole,
        departmentCode: dto.departmentCode,
        departmentRole: dto.departmentRole,
      }),
    });
  },

  adminUpdateUser(userId: string, dto: { departmentCode?: string; departmentRole?: string; platformRole?: string }): Promise<any> {
    return apiRequest<any>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  adminDeactivateUser(userId: string): Promise<any> {
    return apiRequest<any>(`/admin/users/${userId}`, { method: 'DELETE' });
  },

  adminReactivateUser(userId: string): Promise<any> {
    return apiRequest<any>(`/admin/users/${userId}/reactivate`, { method: 'POST' });
  },

  updateCompany(companyId: string, name: string): Promise<{ id: string; name: string; slug: string }> {
    return apiRequest<{ id: string; name: string; slug: string }>(`/companies/${companyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  getCompanySettings(): Promise<{ id: string; name: string; slug: string; domain: string; authMode: string; ssoProvider: string; googleClientId: string; mfaRequired: boolean; refreshTokenExpiryDays: number }> {
    return apiRequest(`/companies/${authStore.get().companyId}/settings`);
  },

  updateCompanySso(dto: { domain?: string; googleClientId?: string; authMode?: string; mfaRequired?: boolean; refreshTokenExpiryDays?: number }): Promise<{ id: string; name: string; slug: string; domain: string; authMode: string; ssoProvider: string; googleClientId: string; mfaRequired: boolean; refreshTokenExpiryDays: number }> {
    return apiRequest(`/companies/${authStore.get().companyId}/sso`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  oidcListProviders(): Promise<any[]> {
    return apiRequest<any[]>('/oidc/providers');
  },

  oidcCreateProvider(dto: { name: string; issuer: string; clientId: string; clientSecret: string; discoveryUrl: string; redirectUri: string; scopes?: string }): Promise<any> {
    return apiRequest<any>('/oidc/providers', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  oidcUpdateProvider(id: string, dto: { name?: string; clientId?: string; clientSecret?: string; scopes?: string; active?: boolean }): Promise<any> {
    return apiRequest<any>(`/oidc/providers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  oidcDeleteProvider(id: string): Promise<void> {
    return apiRequest<void>(`/oidc/providers/${id}`, { method: 'DELETE' });
  },

  oidcDiscoverProviders(companySlug: string): Promise<{ providers: any[] }> {
    return apiRequest(`/oidc/discover/${companySlug}`);
  },

  async oidcInitiateLogin(companySlug: string, providerName: string, redirectUri: string): Promise<{ authorizationUrl: string; state: string; codeVerifier: string }> {
    return apiRequest<{ authorizationUrl: string; state: string; codeVerifier: string }>('/oidc/authorize', {
      method: 'POST',
      body: JSON.stringify({ companySlug, providerName, redirectUri }),
    });
  },

  async oidcCallback(dto: { companySlug: string; providerName: string; code: string; codeVerifier: string; state: string }): Promise<{ isNewUser: boolean }> {
    authStore.set({ ssoSubject: '', token: '' });
    const res = await apiRequest<{ accessToken: string; refreshToken?: string; isNewUser: boolean }>('/oidc/callback', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, false, res.refreshToken);
    return { isNewUser: res.isNewUser || false };
  },

  async listNotifications(): Promise<AppNotification[]> {
    return apiRequest<AppNotification[]>('/notifications');
  },

  async unreadNotificationCount(): Promise<number> {
    const res = await apiRequest<{ count: number }>('/notifications/unread-count');
    return res.count;
  },

  async markNotificationRead(id: string): Promise<void> {
    await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead(): Promise<void> {
    await apiRequest('/notifications/read-all', { method: 'PATCH' });
  },

  async legal(kind: 'privacy' | 'terms'): Promise<LegalDocument> {
    return apiRequest<LegalDocument>(`/legal/${kind}`);
  },
};
