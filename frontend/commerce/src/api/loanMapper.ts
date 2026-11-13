import type { BankAccountType, DayOfWeek, Loan, LoanSummary, PaymentFrequency } from '../types/loan.ts'

export type BackendLoan = {
  id?: number | string | null
  customerId?: number | string | null
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  originationDate?: string
  amountOwed?: number | string
  originalAmount?: number | string
  interestRate?: number | string
  bankName?: string | null
  routingNumber?: string | null
  accountNumber?: string | null
  accountHolderName?: string | null
  accountType?: string | null
  paymentFrequency?: string | null
  paymentAmount?: number | string | null
  paymentDayOfMonth?: number | null
  paymentDayOfWeekName?: string | null
  paymentStartDate?: string | null
}

export function mapLoanSummary(raw: Record<string, unknown>): LoanSummary {
  return {
    id: String(raw.id),
    customerName: String(raw.customerName ?? ''),
    loanDate: String(raw.originationDate ?? ''),
    remainingBalance: Number(raw.amountOwed ?? 0),
    originalAmount: Number(raw.originalAmount ?? 0),
    annualInterestRate: Number(raw.interestRate ?? 0),
  }
}

export function mapLoanDetail(raw: BackendLoan | null): Loan | null {
  if (!raw || raw.id == null || raw.id === '') {
    return null
  }

  const loan: Loan = {
    id: String(raw.id),
    customer: {
      id: String(raw.customerId ?? raw.id),
      name: raw.customerName ?? '',
      email: raw.customerEmail ?? '',
      phone: raw.customerPhone ?? '',
    },
    loanDate: raw.originationDate ?? '',
    originalAmount: Number(raw.originalAmount ?? 0),
    remainingBalance: Number(raw.amountOwed ?? 0),
    annualInterestRate: Number(raw.interestRate ?? 0),
  }

  if (raw.bankName) {
    loan.bankAccount = {
      bankName: raw.bankName,
      accountType: raw.accountType === 'SAVINGS' ? 'SAVINGS' : 'CHECKING' as BankAccountType,
      routingNumber: raw.routingNumber ?? '',
      accountNumber: raw.accountNumber ?? '',
    }
  }

  if (raw.paymentFrequency) {
    loan.paymentSchedule = {
      frequency: raw.paymentFrequency as PaymentFrequency,
      paymentAmount: Number(raw.paymentAmount ?? 0),
      dayOfMonth: raw.paymentDayOfMonth ?? undefined,
      dayOfWeek: (raw.paymentDayOfWeekName as DayOfWeek | undefined) ?? undefined,
      nextPaymentDate: raw.paymentStartDate ?? undefined,
    }
  }

  return loan
}
