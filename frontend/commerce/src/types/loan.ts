export type BankAccountType = 'CHECKING' | 'SAVINGS';

export interface BankAccount {
  bankName: string;
  accountType: BankAccountType;
  routingNumber: string;
  accountNumber: string;
}

export type PaymentFrequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface PaymentSchedule {
  frequency: PaymentFrequency;
  paymentAmount: number;
  dayOfMonth?: number;
  dayOfWeek?: DayOfWeek;
  nextPaymentDate?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface LoanSummary {
  id: string;
  customerName: string;
  loanDate: string;
  remainingBalance: number;
  originalAmount: number;
  annualInterestRate: number;
}

export interface Loan {
  id: string;
  customer: CustomerProfile;
  loanDate: string;
  originalAmount: number;
  remainingBalance: number;
  annualInterestRate: number;
  bankAccount?: BankAccount;
  paymentSchedule?: PaymentSchedule;
}

export interface CreateLoanInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  originalAmount: number;
  annualInterestRate: number;
  loanDate: string;
}
