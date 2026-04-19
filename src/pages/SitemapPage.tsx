import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { SEO } from '@sudobility/seo_lib';
import { Section } from '@sudobility/components';
import { ui } from '@sudobility/design';
import LocalizedLink from '../components/layout/LocalizedLink';
import { SUPPORTED_LANGUAGES } from '../config/constants';
import { seoConfig } from '../config/seo';
import { analyticsService } from '../config/analytics';

const LANGUAGE_INFO: Record<string, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  ar: { label: 'العربية', flag: '🇸🇦' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  es: { label: 'Español', flag: '🇪🇸' },
  fr: { label: 'Français', flag: '🇫🇷' },
  it: { label: 'Italiano', flag: '🇮🇹' },
  ja: { label: '日本語', flag: '🇯🇵' },
  ko: { label: '한국어', flag: '🇰🇷' },
  pt: { label: 'Português', flag: '🇧🇷' },
  ru: { label: 'Русский', flag: '🇷🇺' },
  sv: { label: 'Svenska', flag: '🇸🇪' },
  th: { label: 'ไทย', flag: '🇹🇭' },
  uk: { label: 'Українська', flag: '🇺🇦' },
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
  zh: { label: '中文', flag: '🇨🇳' },
  'zh-hant': { label: '繁體中文', flag: '🇹🇼' },
};

/** Sitemap page listing all supported languages and main navigation links. */
export default function SitemapPage() {
  const { t } = useTranslation('common');
  const { lang } = useParams<{ lang: string }>();

  useEffect(() => {
    analyticsService.trackPageView('/sitemap', 'Sitemap');
  }, []);

  return (
    <Section spacing="md">
      <SEO
        config={seoConfig}
        title={t('nav.sitemap')}
        description="Site map with all pages and supported languages"
        canonical={`/${lang || 'en'}/sitemap`}
      />
      <h1 className="text-2xl font-bold text-theme-text-primary mb-8">{t('nav.sitemap')}</h1>

      {/* Languages */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-theme-text-primary mb-4">
          {t('sitemap.languages')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {SUPPORTED_LANGUAGES.map(code => {
            const info = LANGUAGE_INFO[code];
            return (
              <a
                key={code}
                href={`/${code}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-theme-border hover:bg-theme-hover-bg text-sm"
              >
                <span>{info?.flag}</span>
                <span className="text-theme-text-secondary">{info?.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Pages */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-theme-text-primary mb-4">
          {t('sitemap.mainPages')}
        </h2>
        <ul className="space-y-2">
          <li>
            <LocalizedLink to="/" className={ui.text.linkSubtle}>
              {t('nav.home')}
            </LocalizedLink>
          </li>
          <li>
            <LocalizedLink to="/docs" className={ui.text.linkSubtle}>
              {t('nav.docs')}
            </LocalizedLink>
          </li>
          <li>
            <LocalizedLink to="/dashboard" className={ui.text.linkSubtle}>
              {t('nav.histories')}
            </LocalizedLink>
          </li>
          <li>
            <LocalizedLink to="/login" className={ui.text.linkSubtle}>
              {t('nav.login')}
            </LocalizedLink>
          </li>
        </ul>
      </div>
    </Section>
  );
}
