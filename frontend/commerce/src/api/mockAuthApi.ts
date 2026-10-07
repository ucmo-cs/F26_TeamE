import { DEMO_ADMIN_CREDENTIALS } from '../data/mockData.ts';
import type { AdminLoginCredentials, AuthSession, AuthUser, CustomerLoginCredentials } from '../types/auth.ts';
import {
  clearPrototypeSession,
  loadCustomerCredentials,
  loadPrototypeLoans,
  loadPrototypeSession,
  savePrototypeSession,
} from '../utils/prototypeStorage.ts';
import { fakeDelay } from './fakeDelay.ts';

export const mockAuthApi = {
  async loginAdmin(credentials: AdminLoginCredentials): Promise<AuthUser> {
    await fakeDelay();

    if (
      credentials.username.trim() === DEMO_ADMIN_CREDENTIALS.username &&
      credentials.password === DEMO_ADMIN_CREDENTIALS.password
    ) {
      const user: AuthUser = {
        id: 'admin-001',
        name: DEMO_ADMIN_CREDENTIALS.name,
        usernameOrEmail: credentials.username,
        role: 'ADMIN',
      };
      const session: AuthSession = {
        user,
        token: 'mock-admin-token-' + Date.now(),
      };
      savePrototypeSession(session);
      return user;
    }

    throw new Error('Invalid username or password.');
  },

  async loginCustomer(credentials: CustomerLoginCredentials): Promise<AuthUser> {
    await fakeDelay();

    const rawInput = credentials.email.trim();
    const normalizedInput = rawInput.toLowerCase();
    const password = credentials.password.trim();

    // Map demo username shortcut 'customer' to default demo customer 'jane@example.com'
    const targetEmail = normalizedInput === 'customer' ? 'jane@example.com' : normalizedInput;

    const storedCreds = loadCustomerCredentials();
    let match = storedCreds.find((c) => c.email.toLowerCase() === targetEmail);

    // If target is default demo and not found in storage, fallback to default demo
    if (!match && (targetEmail === 'jane@example.com' || normalizedInput === 'customer')) {
      match = {
        email: 'jane@example.com',
        passwordHashSimulated: 'customer123',
        customerId: 'cust-101',
        loanId: 'loan-101',
      };
    }

    if (match && match.passwordHashSimulated.trim() === password) {
      // Find customer details from loans
      const loans = loadPrototypeLoans();
      const customerLoan = loans.find(
        (l) => l.customer.email.toLowerCase() === match!.email.toLowerCase()
      );
      const name = customerLoan?.customer.name || 'Customer';

      const user: AuthUser = {
        id: match.customerId,
        name,
        usernameOrEmail: match.email,
        role: 'CUSTOMER',
        loanId: match.loanId || customerLoan?.id || 'loan-101',
      };

      const session: AuthSession = {
        user,
        token: 'mock-customer-token-' + Date.now(),
      };
      savePrototypeSession(session);
      return user;
    }

    throw new Error('Invalid email or password.');
  },

  async getCurrentSession(): Promise<AuthSession | null> {
    await fakeDelay(100);
    return loadPrototypeSession();
  },

  async logout(): Promise<void> {
    await fakeDelay(100);
    clearPrototypeSession();
  },
};
