import type { DayOfWeek, PaymentFrequency, PaymentSchedule } from '../types/loan.ts';

export const DAYS_OF_WEEK: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
];

export const PAYMENT_FREQUENCIES: { value: PaymentFrequency; label: string; periods: number }[] = [
  { value: 'MONTHLY', label: 'Monthly', periods: 12 },
  { value: 'BIWEEKLY', label: 'Bi-weekly', periods: 26 },
  { value: 'WEEKLY', label: 'Weekly', periods: 52 },
];

export function formatFrequencyLabel(frequency: PaymentFrequency): string {
  return PAYMENT_FREQUENCIES.find((option) => option.value === frequency)?.label ?? 'N/A';
}

export function formatScheduleDay(schedule: PaymentSchedule): string {
  if (schedule.frequency === 'MONTHLY') {
    const day = schedule.dayOfMonth || 15;
    const suffix =
      day === 1 || day === 21 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${day}${suffix} of each month`;
  }
  const day = schedule.dayOfWeek || 'FRIDAY';
  const name = day.charAt(0) + day.slice(1).toLowerCase();
  return schedule.frequency === 'BIWEEKLY' ? `Every other ${name}` : `Every ${name}`;
}
