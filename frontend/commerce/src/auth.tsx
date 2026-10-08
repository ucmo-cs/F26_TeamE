import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'

export type AuthUser = {
  userId?: number
  username: string
  name?: string
  role: 'ADMIN' | 'USER' | 'CUSTOMER'
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<AuthUser>('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(username: string, password: string) {
    const loggedIn = await api<AuthUser>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    const nextUser: AuthUser = {
      username: loggedIn.username || username,
      role: loggedIn.role === 'ADMIN' ? 'ADMIN' : 'USER',
    }
    setUser(nextUser)
    return nextUser
  }

  async function logout() {
    await api('/api/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {loading ? <div className="page loading">Loading…</div> : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}

export function homePath(role?: string) {
  return role === 'ADMIN' ? '/admin/loans' : '/customer/loan'
}
