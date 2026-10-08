import spanish from './es.json';

export type Language = 'en' | 'es';
const STORAGE_KEY = 'fivepoint_language';
const catalog: Record<string, string> = spanish;
const listeners = new Set<() => void>();

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch { /* The selector still works when browser storage is unavailable. */ }
  return typeof navigator !== 'undefined' && navigator.language.startsWith('es') ? 'es' : 'en';
}

let language = initialLanguage();
export const getLanguage = (): Language => language;
export const getLocale = (): string => language === 'es' ? 'es-US' : 'en-US';

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function setLanguage(next: Language): void {
  if (next !== 'en' && next !== 'es') return;
  language = next;
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Keep the in-memory preference. */ }
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && (event.newValue === 'en' || event.newValue === 'es')) {
      language = event.newValue;
      listeners.forEach((listener) => listener());
    }
  });
}

type Values = Record<string, string | number>;
const interpolate = (text: string, values: Values): string =>
  text.replace(/\{(\w+)\}/g, (token, key: string) => String(values[key] ?? token));

// Errors remain English message keys in state, so an already visible error can
// be translated when the language changes without clearing the user's form.
const errorPatterns = [
  'Payment must be at least {amount}.',
  'Loan with ID "{id}" not found.',
  'Customer with ID "{id}" not found.',
].map((key) => {
  const names: string[] = [];
  const pattern = key.split(/(\{\w+\})/).map((part) => {
    if (part.startsWith('{')) {
      names.push(part.slice(1, -1));
      return '(.+)';
    }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return { key, names, pattern: new RegExp(`^${pattern}$`) };
});

export function translate(message: string, values: Values = {}): string {
  if (language === 'en') return interpolate(message, values);
  if (catalog[message]) return interpolate(catalog[message], values);
  for (const { key, names, pattern } of errorPatterns) {
    const match = message.match(pattern);
    if (match) {
      return interpolate(catalog[key], Object.fromEntries(names.map((name, i) => [name, match[i + 1]])));
    }
  }
  return interpolate(message, values);
}
