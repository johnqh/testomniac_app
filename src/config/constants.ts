/** Application-wide constants sourced from environment variables with sensible defaults. */
export const CONSTANTS = {
  // Branding
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Starter',
  APP_DOMAIN: import.meta.env.VITE_APP_DOMAIN || 'localhost',
  COMPANY_NAME: import.meta.env.VITE_COMPANY_NAME || 'Sudobility',
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com',

  // API
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8027',

  // Feature flags
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
  SHOW_PERFORMANCE_MONITOR: import.meta.env.VITE_SHOW_PERFORMANCE_MONITOR === 'true',

  // SEO
  TWITTER_HANDLE: import.meta.env.VITE_TWITTER_HANDLE || '',
} as const;

/** All language codes the application supports for i18n routing. */
export const SUPPORTED_LANGUAGES = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'pt',
  'ru',
  'sv',
  'th',
  'uk',
  'vi',
  'zh',
  'zh-hant',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Type guard that checks whether a string is one of the supported language codes.
 *
 * @param lang - The language code to validate.
 * @returns `true` if the code is a member of {@link SUPPORTED_LANGUAGES}.
 */
export const isLanguageSupported = (lang: string): lang is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
};
