import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getLanguage, getLocale } from '../i18n/language.ts';

/**
 * Combines Tailwind CSS classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Currency: $12,345.67
 * Always dollar sign, comma thousands separator, exactly two decimals
 */
const currencyFormatters = {
  en: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  es: new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }),
};

export function formatCurrency(amount: number): string {
  return currencyFormatters[getLanguage()].format(Number.isFinite(amount) ? amount : 0);
}

/**
 * Interest Rate: 6.25%
 */
export function formatInterestRate(rate: number): string {
  if (!Number.isFinite(rate)) {
    return '0.00%';
  }
  return `${rate.toFixed(2)}%`;
}

/**
 * Table date format: MM/DD/YYYY
 */
export function formatTableDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return getLanguage() === 'es'
      ? `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
      : `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
  }
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return getLanguage() === 'es' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

/**
 * Prominent date format: October 7, 2026
 */
export function formatProminentDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return new Intl.DateTimeFormat(getLocale(), {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(getLocale(), {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Month Year format: September 2030
 */
export function formatMonthYear(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const date = new Date(year, month, 1);
    return new Intl.DateTimeFormat(getLocale(), {
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(getLocale(), {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Bank Account Masking: ••••••••4321
 * Outside edit/add mode, only last 4 digits visible
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return '••••';
  const clean = accountNumber.trim();
  if (clean.length <= 4) {
    return clean;
  }
  const lastFour = clean.slice(-4);
  const maskedPortion = '•'.repeat(Math.max(4, clean.length - 4));
  return `${maskedPortion}${lastFour}`;
}

/**
 * Routing Number Masking: •••••2345
 */
export function maskRoutingNumber(routingNumber: string): string {
  return maskAccountNumber(routingNumber);
}
