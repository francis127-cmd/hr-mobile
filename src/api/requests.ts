import { apiRequest, apiUpload, apiDownload } from './client';
import {
  CreateRequestDto,
  Department,
  DocumentRef,
  HrRequest,
  RequestStats,
  UpdateRequestStatusDto,
} from '../types';
import { authStore } from '../auth/authStore';

export const api = {
  async discover(email: string): Promise<{ authMode: string; companySlug?: string; companyName?: string; companyId?: string; provider?: string; googleClientId?: string }> {
    return apiRequest('/auth/discover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async loginPassword(email: string, password: string): Promise<{ accessToken: string }> {
    const res = await apiRequest<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, false);
    return res;
  },

  async registerPassword(dto: { email: string; password: string; displayName?: string; companyName?: string; companySlug?: string }): Promise<{ accessToken: string; newCompany: boolean }> {
    const res = await apiRequest<{ accessToken: string; newCompany: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, res.newCompany || false);
    return res;
  },

  async acceptInvite(token: string, password: string): Promise<{ accessToken: string }> {
    const res = await apiRequest<{ accessToken: string }>('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, false);
    return res;
  },

  async validateInviteToken(token: string): Promise<{ email: string; role: string; department?: string; companyName: string; companySlug: string; expiresAt: string }> {
    return apiRequest(`/auth/invitations/${token}`);
  },

  async loginGoogle(idToken: string): Promise<{ newCompany: boolean }> {
    authStore.set({ ssoSubject: '', token: '' });
    const res = await apiRequest<{ accessToken: string; newCompany: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, payload.email, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub, payload.companyId, res.newCompany || false);
    return { newCompany: res.newCompany || false };
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

  // Admin endpoints
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

  updateCompany(companyId: string, name: string): Promise<{ id: string; name: string; slug: string }> {
    return apiRequest<{ id: string; name: string; slug: string }>(`/companies/${companyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  getCompanySettings(): Promise<{ id: string; name: string; slug: string; domain: string; authMode: string; ssoProvider: string; googleClientId: string }> {
    return apiRequest(`/companies/${authStore.get().companyId}/settings`);
  },

  updateCompanySso(dto: { domain?: string; googleClientId?: string; authMode?: string }): Promise<{ id: string; name: string; slug: string; domain: string; authMode: string; ssoProvider: string; googleClientId: string }> {
    return apiRequest(`/companies/${authStore.get().companyId}/sso`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },
};
