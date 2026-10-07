import type { PaymentFrequency } from './loan.ts';

export interface PayoffCalculationResult {
  estimatedPayoffDate: string;
  payoffDateFormatted: string;
  numberOfPayments: number;
  totalInterestPaid: number;
}

export interface PaymentScheduleFormValues {
  frequency: PaymentFrequency;
  paymentAmount: number;
  dayOfMonth?: number;
  dayOfWeek?: string;
}
