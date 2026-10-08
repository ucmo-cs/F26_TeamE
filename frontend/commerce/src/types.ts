export type LoanSummary = {
  id: number
  customerName: string
  originationDate: string
  amountOwed: number
  originalAmount: number
  interestRate: number
}

export type LoanDetail = LoanSummary & {
  customerEmail?: string
  customerPhone?: string
  bankName?: string | null
  routingNumber?: string | null
  accountNumber?: string | null
  accountHolderName?: string | null
  paymentFrequency?: string | null
  paymentAmount?: number | null
  paymentDayOfMonth?: number | null
  paymentDayOfWeek?: number | null
  paymentDayOfWeekName?: string | null
  paymentStartDate?: string | null
  minimumMonthlyPayment?: number | null
  payoffDate?: string | null
}

export type CreatedLoan = {
  loanId: number
  username: string
  temporaryPassword: string
  message: string
}

export type MinimumPayment = {
  frequency: string
  paymentsPerYear: number
  minimumPayment: number
}
