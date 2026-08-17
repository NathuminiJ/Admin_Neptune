import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AdminProfile } from '../types';
import { api, TOKEN_KEY } from '../lib/api';

const USER_KEY = 'neptune_admin_user';

interface AuthContextValue {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser) as AdminProfile;
        if (parsed.role === 'ADMIN') {
          return parsed;
        }
      } catch {
        // Ignore parsing errors
      }
    }
    return null;
  });

  const login = useCallback(async (loginId: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: AdminProfile }>('/auth/login', {
      loginId,
      password,
    });

    if (data.user.role !== 'ADMIN') {
      throw new Error('Access denied. Only administrators are allowed.');
    }

    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setAdmin(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
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