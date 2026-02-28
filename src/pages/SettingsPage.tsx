import { useTranslation } from 'react-i18next';
import { GlobalSettingsPage } from '@sudobility/building_blocks';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useTheme } from '@sudobility/components';

/** User settings page for theme and font size preferences. */
export default function SettingsPage() {
  const { t } = useTranslation('common');
  const { theme, fontSize, setTheme, setFontSize } = useTheme();

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-theme-text-primary mb-6">{t('nav.settings')}</h1>
        <GlobalSettingsPage
          theme={theme}
          fontSize={fontSize}
          onThemeChange={setTheme}
          onFontSizeChange={setFontSize}
        />
      </div>
    </ScreenContainer>
  );
}
