import type { DayOfWeek, PaymentFrequency, PaymentSchedule } from '../types/loan.ts';
import { getLanguage, translate as t } from '../i18n/language.ts';

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
  return t(PAYMENT_FREQUENCIES.find((option) => option.value === frequency)?.label ?? 'N/A');
}

export function formatMonthDay(day: number): string {
  if (getLanguage() === 'es') return t('{day} of each month', { day });
  const suffix = day === 1 || day === 21 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${day}${suffix} of each month`;
}

export function formatScheduleDay(schedule: PaymentSchedule): string {
  if (schedule.frequency === 'MONTHLY') {
    const day = schedule.dayOfMonth || 15;
    return formatMonthDay(day);
  }
  const day = schedule.dayOfWeek || 'FRIDAY';
  const name = day.charAt(0) + day.slice(1).toLowerCase();
  return t(schedule.frequency === 'BIWEEKLY' ? 'Every other {day}' : 'Every {day}', { day: t(name) });
}
