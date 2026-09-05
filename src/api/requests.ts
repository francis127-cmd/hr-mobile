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
  async login(ssoSubject: string): Promise<void> {
    authStore.set({ ssoSubject, token: '' });
    const res = await apiRequest<{ accessToken: string }>('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ ssoSubject }),
    });
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    authStore.setToken(res.accessToken, ssoSubject, payload.role, authStore.get().apiBase, payload.name, payload.email, payload.sub);
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
};
