import React, { useState } from 'react';
import { mockAuthApi } from '../api/mockAuthApi.ts';
import type { AdminLoginCredentials, AuthUser, CustomerLoginCredentials } from '../types/auth.ts';
import { loadPrototypeSession } from '../utils/prototypeStorage.ts';
import { AuthContext } from './authContextDef.ts';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const session = loadPrototypeSession();
      return session?.user ?? null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loginAdmin = async (credentials: AdminLoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const user = await mockAuthApi.loginAdmin(credentials);
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginCustomer = async (credentials: CustomerLoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const user = await mockAuthApi.loginCustomer(credentials);
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await mockAuthApi.logout();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = () => {
    try {
      const session = loadPrototypeSession();
      setCurrentUser(session?.user ?? null);
    } catch {
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        loginAdmin,
        loginCustomer,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
