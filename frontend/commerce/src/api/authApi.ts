import type { AdminLoginCredentials, AuthUser, CustomerLoginCredentials } from '../types/auth.ts'
import { api } from './http.ts'

type BackendAuthUser = {
  id?: string
  userId?: number
  name?: string
  usernameOrEmail?: string
  username?: string
  role?: string
  loanId?: string
}

function mapUser(raw: BackendAuthUser): AuthUser {
  return {
    id: String(raw.id ?? raw.userId ?? ''),
    name: raw.name ?? raw.usernameOrEmail ?? raw.username ?? '',
    usernameOrEmail: raw.usernameOrEmail ?? raw.username ?? '',
    role: raw.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
    loanId: raw.loanId ? String(raw.loanId) : undefined,
  }
}

export const authApi = {
  async loginAdmin(credentials: AdminLoginCredentials): Promise<AuthUser> {
    const raw = await api<BackendAuthUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: credentials.username.trim(),
        password: credentials.password,
      }),
    })
    return mapUser(raw)
  },

  async loginCustomer(credentials: CustomerLoginCredentials): Promise<AuthUser> {
    const email = credentials.email.trim().toLowerCase() === 'customer'
      ? 'jane@example.com'
      : credentials.email.trim()
    const raw = await api<BackendAuthUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        username: email,
        password: credentials.password,
      }),
    })
    return mapUser(raw)
  },

  async me(): Promise<AuthUser> {
    const raw = await api<BackendAuthUser>('/api/auth/me')
    return mapUser(raw)
  },

  async logout(): Promise<void> {
    await api('/api/auth/logout', { method: 'POST' })
  },
}
