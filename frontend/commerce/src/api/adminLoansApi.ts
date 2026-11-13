import type { CreateLoanInput, Loan, LoanSummary } from '../types/loan.ts'
import { api } from './http.ts'
import { mapLoanDetail, mapLoanSummary, type BackendLoan } from './loanMapper.ts'

export type CreatedLoan = {
  id: string
  loanId: number
  username: string
  temporaryPassword: string
  message: string
  customerEmail?: string
}

export const adminLoansApi = {
  async getActiveLoans(): Promise<LoanSummary[]> {
    const data = await api<Record<string, unknown>[] | { loans: Record<string, unknown>[] }>('/api/admin/loans')
    const rows = Array.isArray(data) ? data : data.loans
    return rows.map(mapLoanSummary)
  },

  async getLoanById(loanId: string): Promise<Loan | null> {
    const data = await api<BackendLoan>(`/api/admin/loans/${loanId}`)
    return mapLoanDetail(data)
  },

  async createLoan(input: CreateLoanInput): Promise<CreatedLoan> {
    return api<CreatedLoan>('/api/admin/loans', {
      method: 'POST',
      body: JSON.stringify({
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        originationDate: input.loanDate,
        loanDate: input.loanDate,
        originalAmount: input.originalAmount,
        interestRate: input.annualInterestRate,
      }),
    })
  },

  async updateLoan(loanId: string, updates: Partial<Loan>): Promise<Loan> {
    const body: Record<string, unknown> = {
      originalAmount: updates.originalAmount,
      interestRate: updates.annualInterestRate,
      originationDate: updates.loanDate,
      customerName: updates.customer?.name,
      customerEmail: updates.customer?.email,
      customerPhone: updates.customer?.phone,
      clearSchedule: !updates.paymentSchedule,
    }

    if (updates.bankAccount) {
      body.bankName = updates.bankAccount.bankName
      body.accountType = updates.bankAccount.accountType
      body.routingNumber = updates.bankAccount.routingNumber
      body.accountNumber = updates.bankAccount.accountNumber
      body.accountHolderName = updates.customer?.name
    }

    if (updates.paymentSchedule) {
      body.frequency = updates.paymentSchedule.frequency
      body.paymentAmount = updates.paymentSchedule.paymentAmount
      body.dayOfMonth = updates.paymentSchedule.dayOfMonth
      body.dayOfWeek = updates.paymentSchedule.dayOfWeek
      body.startDate = updates.paymentSchedule.nextPaymentDate
    }

    const data = await api<BackendLoan>(`/api/admin/loans/${loanId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    const mapped = mapLoanDetail(data)
    if (!mapped) {
      throw new Error('Loan not found')
    }
    return mapped
  },

  async setCustomerPassword(
    loanId: string,
    input: { password?: string; generate?: boolean } = {}
  ): Promise<{ password: string; message: string }> {
    return api(`/api/admin/loans/${loanId}/password`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
}
