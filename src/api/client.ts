import { authStore } from '../auth/authStore';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithNetworkError(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    const base = url.split('/requests')[0] || url.split('/departments')[0] || url;
    throw new ApiError(0, `Cannot reach backend at ${base}. Check the URL and that the server is running.`);
  }
}

function authHeaders(): Record<string, string> {
  const { token } = authStore.get();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { apiBase } = authStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetchWithNetworkError(`${apiBase}${path}`, { ...options, headers });
  if (res.status === 204) return null as unknown as T;

  const contentType = res.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : null) || (typeof body === 'string' ? body : res.statusText);
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export async function apiDownload(path: string): Promise<{ filename: string; base64: string; contentType: string }> {
  const { apiBase, token } = authStore.get();
  const url = `${apiBase}${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(xhr.status, `Download failed (${xhr.status})`));
        return;
      }
      const disposition = xhr.getResponseHeader('content-disposition') ?? '';
      const match = disposition.match(/filename="?([^";]+)"?/);
      const filename = match ? match[1] : 'document';
      const contentType = xhr.getResponseHeader('content-type') || 'application/octet-stream';

      const bytes = new Uint8Array(xhr.response);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      resolve({ filename, base64: btoa(binary), contentType });
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error during download'));
    xhr.send();
  });
}

export function apiUpload<T = unknown>(path: string, form: FormData): Promise<T> {
  const { apiBase, token } = authStore.get();
  const url = `${apiBase}${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new ApiError(xhr.status, data.message || `Upload failed (${xhr.status})`));
      } catch {
        reject(new ApiError(xhr.status, `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'));

    xhr.send(form);
  });
}
