import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/auth';
import { clearTokens, setTokens } from '../api/client';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  permissions: string[];
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('coldflow_access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((me) => {
        setUser(me);
        setPermissions(me.permissions ?? []);
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      permissions,
      loading,
      login: async (identifier, password) => {
        const result = await loginRequest(identifier, password);
        setTokens(result.accessToken, result.refreshToken);
        setUser(result.user);
        setPermissions(result.permissions);
        return result.user;
      },
      logout: async () => {
        const refreshToken = localStorage.getItem('coldflow_refresh_token') ?? '';
        try {
          await logoutRequest(refreshToken);
        } finally {
          clearTokens();
          setUser(null);
          setPermissions([]);
        }
      },
      hasPermission: (key) => user?.role === 'super_admin' || permissions.includes(key),
    }),
    [user, permissions, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
