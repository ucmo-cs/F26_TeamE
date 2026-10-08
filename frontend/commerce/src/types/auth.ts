export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  name: string;
  usernameOrEmail: string;
  role: UserRole;
  loanId?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export interface AdminLoginCredentials {
  username: string;
  password: string;
}

export interface CustomerLoginCredentials {
  email: string;
  password: string;
}
