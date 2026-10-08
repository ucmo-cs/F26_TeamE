// Prototype only — do not store raw bank data in browser storage in production.

import { INITIAL_MOCK_LOANS } from '../data/mockData.ts';
import type { AuthSession } from '../types/auth.ts';
import type { Loan } from '../types/loan.ts';

const STORAGE_KEYS = {
  LOANS: 'commerce_bank_loans',
  SESSION: 'commerce_bank_session',
  CUSTOMER_CREDENTIALS: 'commerce_bank_customer_credentials',
} as const;

export interface StoredCustomerCredential {
  email: string;
  passwordHashSimulated: string;
  customerId: string;
  loanId: string;
}

const DEFAULT_CUSTOMER_CREDENTIALS: StoredCustomerCredential[] = [
  {
    email: 'jane@example.com',
    passwordHashSimulated: 'customer123',
    customerId: 'cust-101',
    loanId: 'loan-101',
  },
  {
    email: 'robert@example.com',
    passwordHashSimulated: 'customer123',
    customerId: 'cust-102',
    loanId: 'loan-102',
  },
  {
    email: 'amanda@example.com',
    passwordHashSimulated: 'customer123',
    customerId: 'cust-103',
    loanId: 'loan-103',
  },
];

export function loadPrototypeLoans(): Loan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (!raw) {
      // First run: save and return initial mock dataset
      savePrototypeLoans(INITIAL_MOCK_LOANS);
      return structuredClone(INITIAL_MOCK_LOANS);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as Loan[];
    }
  } catch (err) {
    console.error('Failed to load prototype loans from localStorage:', err);
  }
  return structuredClone(INITIAL_MOCK_LOANS);
}

export function savePrototypeLoans(loans: Loan[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  } catch (err) {
    console.error('Failed to save prototype loans to localStorage:', err);
  }
}

export function loadPrototypeSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch (err) {
    console.error('Failed to load prototype session from localStorage:', err);
    return null;
  }
}

export function savePrototypeSession(session: AuthSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Failed to save prototype session to localStorage:', err);
  }
}

export function clearPrototypeSession(): void {
  savePrototypeSession(null);
}

export function loadCustomerCredentials(): StoredCustomerCredential[] {
  let credentials: StoredCustomerCredential[];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER_CREDENTIALS);
    if (!raw) {
      credentials = structuredClone(DEFAULT_CUSTOMER_CREDENTIALS);
    } else {
      const parsed: unknown = JSON.parse(raw);
      credentials = Array.isArray(parsed) ? parsed : structuredClone(DEFAULT_CUSTOMER_CREDENTIALS);
    }
  } catch {
    credentials = structuredClone(DEFAULT_CUSTOMER_CREDENTIALS);
  }

  // Ensure all existing loans in prototype storage have corresponding login credentials
  try {
    const loansRaw = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (loansRaw) {
      const loans = JSON.parse(loansRaw) as Loan[];
      let updated = false;
      for (const loan of loans) {
        if (!loan.customer?.email) continue;
        const exists = credentials.some(
          (c) => c.email.toLowerCase() === loan.customer.email.toLowerCase()
        );
        if (!exists) {
          credentials.push({
            email: loan.customer.email,
            passwordHashSimulated: 'customer123',
            customerId: loan.customer.id,
            loanId: loan.id,
          });
          updated = true;
        }
      }
      if (updated) {
        saveCustomerCredentials(credentials);
      }
    }
  } catch {
    // ignore
  }

  return credentials;
}

export function saveCustomerCredentials(credentials: StoredCustomerCredential[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_CREDENTIALS, JSON.stringify(credentials));
  } catch (err) {
    console.error('Failed to save customer credentials to localStorage:', err);
  }
}

export function addCustomerCredential(credential: StoredCustomerCredential): void {
  const current = loadCustomerCredentials();
  const filtered = current.filter((c) => c.email.toLowerCase() !== credential.email.toLowerCase());
  filtered.push(credential);
  saveCustomerCredentials(filtered);
}

export function updateCustomerCredentialEmail(
  customerId: string,
  oldEmail: string,
  newEmail: string
): void {
  const current = loadCustomerCredentials();
  const match = current.find(
    (c) => c.customerId === customerId || c.email.toLowerCase() === oldEmail.toLowerCase()
  );
  if (match) {
    match.email = newEmail;
    match.customerId = customerId;
    saveCustomerCredentials(current);
  } else {
    current.push({
      email: newEmail,
      passwordHashSimulated: 'customer123',
      customerId,
      loanId: '',
    });
    saveCustomerCredentials(current);
  }
}

/**
 * Resets prototype state:
 * 1. Clears saved prototype loans and credentials
 * 2. Restores initial mock data
 * 3. Clears mock session state
 */
export function resetPrototypeState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_CREDENTIALS);
    savePrototypeLoans(INITIAL_MOCK_LOANS);
    saveCustomerCredentials(DEFAULT_CUSTOMER_CREDENTIALS);
  } catch (err) {
    console.error('Error resetting prototype state:', err);
  }
}

// Expose reset helper in browser window during development for quick testing
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as unknown as { __resetDemoData: () => void }).__resetDemoData = () => {
    resetPrototypeState();
    window.location.reload();
  };
}
