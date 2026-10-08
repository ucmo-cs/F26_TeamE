import type { Loan } from '../types/loan.ts';

// Prototype initial seed dataset
// Prototype only — do not store raw bank data in browser storage in production.
export const INITIAL_MOCK_LOANS: Loan[] = [
  {
    id: 'loan-101',
    customer: {
      id: 'cust-101',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '(555) 555-1234',
    },
    loanDate: '2026-08-14',
    originalAmount: 25000.0,
    remainingBalance: 18420.32,
    annualInterestRate: 6.25,
    bankAccount: {
      bankName: 'Example National Bank',
      accountType: 'CHECKING',
      routingNumber: '000012345',
      accountNumber: '000987654321',
    },
    paymentSchedule: {
      frequency: 'BIWEEKLY',
      paymentAmount: 250.0,
      dayOfWeek: 'FRIDAY',
      nextPaymentDate: '2026-10-16',
    },
  },
  {
    id: 'loan-102',
    customer: {
      id: 'cust-102',
      name: 'Robert Davis',
      email: 'robert@example.com',
      phone: '(555) 555-5678',
    },
    loanDate: '2026-05-10',
    originalAmount: 15000.0,
    remainingBalance: 11200.0,
    annualInterestRate: 5.75,
    // Partially repaid loan without bank account and payment schedule
  },
  {
    id: 'loan-103',
    customer: {
      id: 'cust-103',
      name: 'Amanda Miller',
      email: 'amanda@example.com',
      phone: '(555) 555-8765',
    },
    loanDate: '2026-09-01',
    originalAmount: 40000.0,
    remainingBalance: 38900.5,
    annualInterestRate: 7.1,
    bankAccount: {
      bankName: 'FivePoint Bank',
      accountType: 'SAVINGS',
      routingNumber: '000034567',
      accountNumber: '000112233445',
    },
    paymentSchedule: {
      frequency: 'MONTHLY',
      paymentAmount: 795.0,
      dayOfMonth: 15,
      nextPaymentDate: '2026-10-15',
    },
  },
  {
    id: 'loan-104',
    customer: {
      id: 'cust-104',
      name: 'Marcus Vance',
      email: 'marcus@example.com',
      phone: '(555) 555-4321',
    },
    loanDate: '2024-01-15',
    originalAmount: 10000.0,
    remainingBalance: 0.0, // Fully repaid loan: does not appear in Active Loans
    annualInterestRate: 4.5,
    bankAccount: {
      bankName: 'Metropolitan Credit Union',
      accountType: 'CHECKING',
      routingNumber: '000098765',
      accountNumber: '000554433221',
    },
  },
];

export const DEMO_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  name: 'System Administrator',
};

export const DEMO_CUSTOMER_CREDENTIALS = {
  email: 'jane@example.com',
  password: 'customer123',
};
