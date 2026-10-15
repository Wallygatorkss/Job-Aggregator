import { createContext } from 'react';

export type AuthRole = 'ADMIN' | 'USER';

export type AuthContextValue = {
  token: string | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setSession: (token: string, role: string | null | undefined) => void;
  clearSession: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
