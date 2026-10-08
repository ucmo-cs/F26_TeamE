import { useLanguage } from '../../i18n/useLanguage.ts';
import type { Language } from '../../i18n/language.ts';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className="inline-flex items-center gap-2 text-xs text-[#5E6B7A] whitespace-nowrap">
      <span>{t('Language')}</span>
      <select
        aria-label={t('Language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="h-8 rounded-[4px] border border-[#D7DEE7] bg-white px-2 text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12345B]"
      >
        <option value="en" lang="en">English</option>
        <option value="es" lang="es">Español</option>
      </select>
    </label>
  );
}
