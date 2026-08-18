import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AdminProfile, LoginResponse, MeResponse } from '../types';
import { api, clearStoredToken, getStoredToken, persistToken } from '../lib/api';

const USER_KEY = 'neptune_admin_user';

interface AuthContextValue {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  login: (loginId: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AdminProfile | null {
  const savedUser = localStorage.getItem(USER_KEY);
  if (!savedUser || !getStoredToken()) return null;
  try {
    const parsed = JSON.parse(savedUser) as AdminProfile;
    if (parsed && parsed.role === 'ADMIN') return parsed;
  } catch {
    // Corrupt stored user — treat as signed out.
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(loadStoredUser);

  // Any 401 from the API clears the stored session automatically.
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(USER_KEY);
      setAdmin(null);
    };
    window.addEventListener('neptune:unauthorized', onUnauthorized);
    return () => window.removeEventListener('neptune:unauthorized', onUnauthorized);
  }, []);

  // Validate any restored session against the backend.
  useEffect(() => {
    if (!getStoredToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await api.get<MeResponse>('/auth/me');
        if (cancelled) return;
        if (me.role !== 'ADMIN') {
          // Token is valid but belongs to a non-admin account.
          clearStoredToken();
          localStorage.removeItem(USER_KEY);
          setAdmin(null);
        }
      } catch {
        if (!cancelled) {
          // The 401 handler already cleared the token; clear the user too.
          localStorage.removeItem(USER_KEY);
          setAdmin(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (loginId: string, password: string, remember = true) => {
    const data = await api.post<LoginResponse>('/auth/login', { loginId, password });

    if (data.user.role !== 'ADMIN') {
      throw new Error('Access denied. Only administrators are allowed.');
    }

    persistToken(data.accessToken, remember);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setAdmin(data.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    localStorage.removeItem(USER_KEY);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, isAuthenticated: admin !== null, login, logout }),
    [admin, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}