import enTranslations from './en.json';
import hiTranslations from './hi.json';

export type TranslationKeys = typeof enTranslations;

export const SUPPORTED_LOCALES = ['en', 'hi', 'mr', 'gu', 'bn'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const translations: Record<string, Record<string, unknown>> = {
  en: enTranslations,
  hi: hiTranslations,
  // mr, gu, bn — add translation files as providers are onboarded
};

/**
 * Resolve the translation for a given key path, interpolating {{variables}}.
 * Falls back to English if locale is unavailable.
 * Language is passed in dynamically — never hardcoded.
 */
export function t(
  keyPath: string,
  locale: SupportedLocale,
  variables?: Record<string, string>
): string {
  const bundle = translations[locale] ?? translations['en'];
  const keys = keyPath.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = bundle;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }

  // Fallback to English if key not found in locale
  if (typeof value !== 'string') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fallback: any = translations['en'];
    for (const key of keys) {
      fallback = fallback?.[key];
    }
    value = typeof fallback === 'string' ? fallback : keyPath;
  }

  // Interpolate {{variable}} placeholders
  if (variables) {
    Object.entries(variables).forEach(([k, v]) => {
      value = value.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
  }

  return value as string;
}

/** Map a BCP-47 language tag to a human-readable label in that language */
export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  bn: 'বাংলা',
  pa: 'ਪੰਜਾਬੀ',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  or: 'ଓଡ଼ିଆ',
};
