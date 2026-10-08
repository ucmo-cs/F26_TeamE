import type { PaymentFrequency } from '../types/loan.ts';
import type { PayoffCalculationResult } from '../types/payment.ts';
import { formatProminentDate } from './formatting.ts';

/**
 * Default amortization term: 60 months
 * As defined in content specification Section 12
 */
export const DEFAULT_LOAN_TERM_MONTHS = 60;

/**
 * Gets the number of payment periods per year for a given frequency
 */
export function getPeriodsPerYear(frequency: PaymentFrequency): number {
  switch (frequency) {
    case 'WEEKLY':
      return 52;
    case 'BIWEEKLY':
      return 26;
    case 'MONTHLY':
    default:
      return 12;
  }
}

/**
 * Calculates standard fixed-payment monthly minimum payment
 * M = P × [ r(1+r)^n ] / [ (1+r)^n - 1 ]
 *
 * @param principal remaining principal balance ($)
 * @param annualRatePct annual interest rate in percent (e.g. 6.25 for 6.25%)
 * @param termMonths loan term in months (default: 60)
 */
export function calculateMonthlyMinimum(
  principal: number,
  annualRatePct: number,
  termMonths: number = DEFAULT_LOAN_TERM_MONTHS
): number {
  if (principal <= 0) return 0;
  if (termMonths <= 0) return principal;

  const r = annualRatePct / 100 / 12;
  if (r <= 0) {
    return Math.round((principal / termMonths) * 100) / 100;
  }

  const factor = Math.pow(1 + r, termMonths);
  const monthly = principal * ((r * factor) / (factor - 1));
  return Math.round(monthly * 100) / 100;
}

/**
 * Calculates the frequency-adjusted minimum payment
 *
 * @param principal remaining principal balance ($)
 * @param annualRatePct annual interest rate in percent (e.g. 6.25 for 6.25%)
 * @param frequency 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY'
 * @param termMonths loan term in months (default: 60)
 */
export function calculateScheduledMinimum(
  principal: number,
  annualRatePct: number,
  frequency: PaymentFrequency,
  termMonths: number = DEFAULT_LOAN_TERM_MONTHS
): number {
  if (principal <= 0) return 0;

  const periodsPerYear = getPeriodsPerYear(frequency);
  const totalPeriods = Math.round(termMonths * (periodsPerYear / 12));
  const r = annualRatePct / 100 / periodsPerYear;

  if (r <= 0) {
    return Math.round((principal / totalPeriods) * 100) / 100;
  }

  const factor = Math.pow(1 + r, totalPeriods);
  const payment = principal * ((r * factor) / (factor - 1));
  return Math.round(payment * 100) / 100;
}

/**
 * Calculates estimated payoff date and total payment periods
 * given the principal, interest rate, payment amount, and frequency.
 *
 * n = -ln(1 - (P * r) / M) / ln(1 + r)
 */
export function calculateEstimatedPayoffDate(
  principal: number,
  annualRatePct: number,
  paymentAmount: number,
  frequency: PaymentFrequency,
  startDate: Date = new Date()
): PayoffCalculationResult | null {
  if (principal <= 0) {
    const todayIso = startDate.toISOString().split('T')[0];
    return {
      estimatedPayoffDate: todayIso,
      payoffDateFormatted: formatProminentDate(todayIso),
      numberOfPayments: 0,
      totalInterestPaid: 0,
    };
  }

  const periodsPerYear = getPeriodsPerYear(frequency);
  const r = annualRatePct / 100 / periodsPerYear;

  // If payment does not cover periodic interest, loan cannot be paid off
  if (paymentAmount <= principal * r) {
    return null;
  }

  let numberOfPayments: number;
  if (r <= 0) {
    numberOfPayments = Math.ceil(principal / paymentAmount);
  } else {
    const n = -Math.log(1 - (principal * r) / paymentAmount) / Math.log(1 + r);
    numberOfPayments = Math.ceil(n);
  }

  // Calculate projected date
  const targetDate = new Date(startDate.getTime());
  if (frequency === 'MONTHLY') {
    targetDate.setMonth(targetDate.getMonth() + numberOfPayments);
  } else if (frequency === 'BIWEEKLY') {
    targetDate.setDate(targetDate.getDate() + numberOfPayments * 14);
  } else {
    // WEEKLY
    targetDate.setDate(targetDate.getDate() + numberOfPayments * 7);
  }

  const iso = targetDate.toISOString().split('T')[0];
  const totalPaid = numberOfPayments * paymentAmount;
  const totalInterestPaid = Math.max(0, Math.round((totalPaid - principal) * 100) / 100);

  return {
    estimatedPayoffDate: iso,
    payoffDateFormatted: formatProminentDate(iso),
    numberOfPayments,
    totalInterestPaid,
  };
}
