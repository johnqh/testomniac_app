import { useTranslation } from 'react-i18next';
import ScreenContainer from '../components/layout/ScreenContainer';
import LocalizedLink from '../components/layout/LocalizedLink';

/** Landing page showcasing the application's key features and entry points. */
export default function HomePage() {
  const { t } = useTranslation('common');

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-theme-text-primary mb-6">{t('home.title')}</h1>
          <p className="text-lg text-theme-text-secondary mb-8">{t('home.description')}</p>
          <div className="flex gap-4 justify-center">
            <LocalizedLink
              to="/docs"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('home.viewDocs')}
            </LocalizedLink>
            <LocalizedLink
              to="/histories"
              className="px-6 py-3 border border-theme-border rounded-lg text-theme-text-primary hover:bg-theme-hover-bg transition-colors"
            >
              {t('home.viewHistories')}
            </LocalizedLink>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
      </div>
    </ScreenContainer>
  );
}
