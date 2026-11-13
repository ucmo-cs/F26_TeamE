import type { BankAccount, CustomerProfile, Loan, PaymentSchedule } from '../types/loan.ts'
import { api } from './http.ts'
import { mapLoanDetail, type BackendLoan } from './loanMapper.ts'

export const customerApi = {
  async getCustomerLoan(): Promise<Loan | null> {
    const data = await api<BackendLoan>('/api/customer/loan')
    return mapLoanDetail(data)
  },

  async updateCustomerProfile(profile: Partial<CustomerProfile> & {
    bankName?: string
    routingNumber?: string
    accountNumber?: string
    accountHolderName?: string
    accountType?: string
  }): Promise<Loan | null> {
    const data = await api<BackendLoan>('/api/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    })
    return mapLoanDetail(data)
  },

  async updateCustomerBankAccount(
    profile: CustomerProfile,
    bankAccount: BankAccount
  ): Promise<Loan | null> {
    return this.updateCustomerProfile({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      bankName: bankAccount.bankName,
      routingNumber: bankAccount.routingNumber,
      accountNumber: bankAccount.accountNumber,
      accountHolderName: profile.name,
      accountType: bankAccount.accountType,
    })
  },

  async savePaymentSchedule(schedule: PaymentSchedule): Promise<Loan | null> {
    const data = await api<BackendLoan>('/api/customer/schedule', {
      method: 'POST',
      body: JSON.stringify({
        frequency: schedule.frequency,
        paymentAmount: schedule.paymentAmount,
        dayOfMonth: schedule.dayOfMonth,
        dayOfWeek: schedule.dayOfWeek,
        startDate: schedule.nextPaymentDate,
      }),
    })
    return mapLoanDetail(data)
  },
}
