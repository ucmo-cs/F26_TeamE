import { useSyncExternalStore } from 'react';
import { getLanguage, setLanguage, subscribe, translate } from './language.ts';

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getLanguage, () => 'en' as const);
  return { language, setLanguage, t: translate };
}
