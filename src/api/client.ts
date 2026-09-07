import { authStore } from '../auth/authStore';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public isOffline: boolean = false,
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Global listener for auth expiration (401)
type UnauthorizedHandler = () => void;
let unauthorizedListener: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedListener = handler;
}

function authHeaders(): Record<string, string> {
  const { token } = authStore.get();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Robust fetch wrapper with timeout, network detection, and offline fallback
 */
async function fetchWithNetworkResilience(
  url: string,
  init: RequestInit,
  timeoutMs = 12000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (err: any) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      throw new ApiError(
        408,
        'Request timed out. Please check your internet connection and try again.',
        true,
      );
    }

    const isOffline =
      /network|failed to fetch|internet|offline|connection refused/i.test(err.message || '');

    throw new ApiError(
      0,
      isOffline
        ? 'No network connection. Operating in offline mode.'
        : `Network error: unable to reach server.`,
      true,
    );
  }
}

/**
 * Enterprise API Request with automatic 401 handling, sanitized errors, and retry
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
  retries = 1,
): Promise<T> {
  const { apiBase } = authStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetchWithNetworkResilience(`${apiBase}${path}`, { ...options, headers });

    // Handle 401 — read body first to distinguish login failure from session expiration
    if (res.status === 401) {
      const errContentType = res.headers.get('content-type') ?? '';
      let errBody: any = null;
      try {
        errBody = errContentType.includes('application/json') ? await res.json() : await res.text();
      } catch { /* ignore parse errors */ }

      const errMsg = errBody && typeof errBody === 'object' && 'message' in errBody
        ? String(errBody.message)
        : typeof errBody === 'string' ? errBody : '';

      // Login failures return specific messages — don't clear the session for those
      const isLoginFailure = /invalid credentials|invalid token|unauthorized/i.test(errMsg);
      if (!isLoginFailure) {
        await authStore.logout();
        if (unauthorizedListener) {
          unauthorizedListener();
        }
      }

      throw new ApiError(401, errMsg || 'Your session has expired. Please sign in again.');
    }

    if (res.status === 204) return null as unknown as T;

    const contentType = res.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        (body && typeof body === 'object' && 'message' in body
          ? String((body as { message: unknown }).message)
          : null) || (typeof body === 'string' ? body : res.statusText);

      const reqId =
        body && typeof body === 'object' && 'requestId' in body
          ? String((body as { requestId: unknown }).requestId)
          : undefined;

      // Retry once on transient 503/504 if retries remaining
      if ((res.status === 503 || res.status === 504) && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return apiRequest<T>(path, options, retries - 1);
      }

      throw new ApiError(res.status, message, false, reqId);
    }

    return body as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(0, err.message || 'An unexpected error occurred.', true);
  }
}

export async function apiDownload(
  path: string,
): Promise<{ filename: string; base64: string; contentType: string }> {
  const { apiBase, token } = authStore.get();
  const url = `${apiBase}${path}`;

  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.timeout = 30000;
      xhr.responseType = 'arraybuffer';
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onload = () => {
        if (xhr.status === 401) {
          authStore.logout();
          if (unauthorizedListener) unauthorizedListener();
          reject(new ApiError(401, 'Session expired during download'));
          return;
        }

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

      xhr.ontimeout = () => reject(new ApiError(408, 'Download timed out', true));
      xhr.onerror = () => reject(new ApiError(0, 'Network error during download', true));
      xhr.send();
    } catch (e: any) {
      reject(new ApiError(0, e.message || 'Download error', true));
    }
  });
}

export function apiUpload<T = unknown>(path: string, form: FormData): Promise<T> {
  const { apiBase, token } = authStore.get();
  const url = `${apiBase}${path}`;

  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.timeout = 45000;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onload = () => {
        if (xhr.status === 401) {
          authStore.logout();
          if (unauthorizedListener) unauthorizedListener();
          reject(new ApiError(401, 'Session expired during upload'));
          return;
        }

        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new ApiError(xhr.status, data.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new ApiError(xhr.status, `Upload failed (${xhr.status})`));
        }
      };

      xhr.ontimeout = () => reject(new ApiError(408, 'Upload timed out', true));
      xhr.onerror = () => reject(new ApiError(0, 'Network error during upload', true));
      xhr.send(form);
    } catch (e: any) {
      reject(new ApiError(0, e.message || 'Upload error', true));
    }
  });
}
