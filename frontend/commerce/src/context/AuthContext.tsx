import React, { useEffect, useState } from 'react'
import { authApi } from '../api/authApi.ts'
import type { AdminLoginCredentials, AuthUser, CustomerLoginCredentials } from '../types/auth.ts'
import { AuthContext } from './authContextDef.ts'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const user = await authApi.me()
      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    }
  }

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false))
  }, [])

  const loginAdmin = async (credentials: AdminLoginCredentials): Promise<AuthUser> => {
    setIsLoading(true)
    try {
      const user = await authApi.loginAdmin(credentials)
      setCurrentUser(user)
      return user
    } finally {
      setIsLoading(false)
    }
  }

  const loginCustomer = async (credentials: CustomerLoginCredentials): Promise<AuthUser> => {
    setIsLoading(true)
    try {
      const user = await authApi.loginCustomer(credentials)
      setCurrentUser(user)
      return user
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authApi.logout()
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        loginAdmin,
        loginCustomer,
        logout,
        refreshSession: () => { void refreshSession() },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
