const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://neptune-backend-kappa.vercel.app').replace(/\/+$/, '');

export const TOKEN_KEY = 'neptune_admin_access_token';

/**
 * Raised when the backend rejects a request. `status` carries the HTTP status
 * code so callers can react to 401/403/409 etc. appropriately.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  body?: any;
}

/* --------------------------------------------------------------------------
 * Token persistence
 *
 * `localStorage` keeps the session across browser restarts ("remember me").
 * `sessionStorage` keeps it for the current tab only. Both share the same key.
 * ------------------------------------------------------------------------*/

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
}

export function persistToken(token: string, remember: boolean): void {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/* --------------------------------------------------------------------------
 * Error message mapping (NestJS style error bodies)
 * ------------------------------------------------------------------------*/

function messageFor(status: number, data: any): string {
  if (data && typeof data === 'object') {
    const message = data.message;
    if (Array.isArray(message)) {
      const text = message.map((m) => (m && typeof m === 'object' && m.constraints ? Object.values(m.constraints)[0] : String(m))).filter(Boolean).join(', ');
      if (text) return text;
    }
    if (typeof message === 'string' && message.trim()) return message;
    if (typeof data.error === 'string' && data.error.trim()) return data.error;
  }
  switch (status) {
    case 400:
      return 'Bad request. Please check the submitted data.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'The request conflicts with the current state of the data.';
    case 500:
      return 'The server could not process the request. Please try again later.';
    default:
      return `Request failed with status ${status}`;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers);

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      cache: options.method === 'GET' || !options.method ? 'no-store' : undefined,
    });
  } catch {
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
      0,
    );
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
      window.dispatchEvent(new CustomEvent('neptune:unauthorized'));
    }
    throw new ApiError(messageFor(response.status, data), response.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};