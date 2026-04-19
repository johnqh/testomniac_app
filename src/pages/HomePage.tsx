import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { SEO } from '@sudobility/seo_lib';
import { Section } from '@sudobility/components';
import { buttonVariant } from '@sudobility/design';
import LocalizedLink from '../components/layout/LocalizedLink';
import { seoConfig } from '../config/seo';
import { analyticsService } from '../config/analytics';

/** Landing page showcasing the application's key features and entry points. */
export default function HomePage() {
  const { t } = useTranslation('common');
  const { lang } = useParams<{ lang: string }>();

  useEffect(() => {
    analyticsService.trackPageView('/', 'Home');
  }, []);

  return (
    <>
      <SEO
        config={seoConfig}
        title={t('home.title')}
        description={t('home.description')}
        canonical={`/${lang || 'en'}`}
        ogType="website"
      />
      <Section spacing="5xl" variant="hero" maxWidth="3xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-theme-text-primary mb-6">{t('home.title')}</h1>
          <p className="text-lg text-theme-text-secondary mb-8">{t('home.description')}</p>
          <div className="flex gap-4 justify-center">
            <LocalizedLink
              to="/docs"
              className={`px-6 py-3 rounded-lg ${buttonVariant('primary')}`}
            >
              {t('home.viewDocs')}
            </LocalizedLink>
            <LocalizedLink
              to="/dashboard"
              className={`px-6 py-3 rounded-lg ${buttonVariant('outline')}`}
            >
              {t('home.viewHistories')}
            </LocalizedLink>
          </div>
        </div>
      </Section>

      <Section spacing="3xl" maxWidth="4xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border border-theme-border">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
              {t('home.feature1Title')}
            </h3>
            <p className="text-sm text-theme-text-secondary">{t('home.feature1Desc')}</p>
          </div>
          <div className="p-6 rounded-lg border border-theme-border">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
              {t('home.feature2Title')}
            </h3>
            <p className="text-sm text-theme-text-secondary">{t('home.feature2Desc')}</p>
          </div>
          <div className="p-6 rounded-lg border border-theme-border">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
              {t('home.feature3Title')}
            </h3>
            <p className="text-sm text-theme-text-secondary">{t('home.feature3Desc')}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
