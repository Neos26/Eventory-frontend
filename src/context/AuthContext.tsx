import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/authApi';
import { getToken } from '../api/tokenStorage';
import type { LoginPayload, RegisterPayload, User, UserRole } from '../types/user';

interface AuthContextValue {
  user: User | null;
  /** 'loading' while the stored token is validated on first render. */
  status: 'loading' | 'ready';
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Where each role lands after signing in (and when hitting "/").
export function homeForRole(role: UserRole): string {
  return role === 'booker' ? '/booker/dashboard' : '/management/dashboard';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  // Validate any stored token once on app start.
  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setStatus('ready');
      return;
    }
    fetchMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        apiLogout();
      })
      .finally(() => {
        if (!cancelled) setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    const data = await apiLogin(payload);
    setUser(data.user);
    return data.user;
  }, []);

  // Creates the account and signs the new user in in one step.
  const register = useCallback(async (payload: RegisterPayload): Promise<User> => {
    const data = await apiRegister(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
