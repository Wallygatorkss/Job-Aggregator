import { useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthRole } from './auth-context';

const TOKEN_STORAGE_KEY = 'token';
const ROLE_STORAGE_KEY = 'role';

const normalizeRole = (role: string | null | undefined): AuthRole | null => {
  if (!role) return null;

  const normalized = role.trim().toUpperCase();
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'USER') return 'USER';
  return null;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  const [role, setRole] = useState<AuthRole | null>(normalizeRole(localStorage.getItem(ROLE_STORAGE_KEY)));

  const setSession = (nextToken: string, nextRole: string | null | undefined) => {
    const normalizedRole = normalizeRole(nextRole);

    setToken(nextToken);
    setRole(normalizedRole);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);

    if (normalizedRole) {
      localStorage.setItem(ROLE_STORAGE_KEY, normalizedRole);
      return;
    }

    localStorage.removeItem(ROLE_STORAGE_KEY);
  };

  const clearSession = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token),
      isAdmin: role === 'ADMIN',
      setSession,
      clearSession,
    }),
    [role, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
