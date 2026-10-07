import { createContext } from 'react';
import type { AdminLoginCredentials, AuthUser, CustomerLoginCredentials } from '../types/auth.ts';

export interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  loginAdmin: (credentials: AdminLoginCredentials) => Promise<AuthUser>;
  loginCustomer: (credentials: CustomerLoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
