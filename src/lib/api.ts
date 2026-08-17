const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://neptune-backend-kappa.vercel.app').replace(/\/+$/, '');

export const TOKEN_KEY = 'neptune_admin_access_token';

interface RequestOptions extends RequestInit {
  body?: any;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers);
  
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, {
  ...options,
  headers,
  cache: options.method === 'GET' || !options.method ? 'no-store' : undefined,
});
  
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
    const errorMsg = (data && typeof data === 'object' ? data.message || data.error : null) || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  
  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
