import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type MenuItemConfig,
  type AuthActionProps,
  type TopBarConfig,
} from '@sudobility/building_blocks';
import { AuthAction, useAuthStatus } from '@sudobility/auth-components';
import { useCurrentEntityOptional } from '@sudobility/entity_client';
import type { ComponentType } from 'react';
import { DocumentTextIcon, ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { CONSTANTS, SUPPORTED_LANGUAGES, isLanguageSupported } from '../../config/constants';
import LocalizedLink from './LocalizedLink';

const LANGUAGE_INFO: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇺🇸' },
  ar: { name: 'العربية', flag: '🇸🇦' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  it: { name: 'Italiano', flag: '🇮🇹' },
  ja: { name: '日本語', flag: '🇯🇵' },
  ko: { name: '한국어', flag: '🇰🇷' },
  pt: { name: 'Português', flag: '🇧🇷' },
  ru: { name: 'Русский', flag: '🇷🇺' },
  sv: { name: 'Svenska', flag: '🇸🇪' },
  th: { name: 'ไทย', flag: '🇹🇭' },
  uk: { name: 'Українська', flag: '🇺🇦' },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
  zh: { name: '简体中文', flag: '🇨🇳' },
  'zh-hant': { name: '繁體中文', flag: '🇹🇼' },
};

const linkWrapper = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <LocalizedLink to={href} className={className}>
    {children}
  </LocalizedLink>
);

/**
 * Hook returning TopBar configuration for AppPageLayout.
 */
export function useTopBarConfig(): TopBarConfig {
  const { t } = useTranslation('common');
  const { navigate, switchLanguage, currentLanguage } = useLocalizedNavigate();
  const { user } = useAuthStatus();
  const entityContext = useCurrentEntityOptional();
  const entitySlug = entityContext?.currentEntitySlug ?? null;
  const isAuthenticated = !!user;

  const languages = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map(code => ({
        code,
        name: LANGUAGE_INFO[code]?.name || code.toUpperCase(),
        flag: LANGUAGE_INFO[code]?.flag || '🌐',
      })),
    []
  );

  const menuItems: MenuItemConfig[] = useMemo(() => {
    const items: MenuItemConfig[] = [
      {
        id: 'docs',
        label: t('nav.docs'),
        icon: DocumentTextIcon,
        href: '/docs',
      },
    ];

    if (isAuthenticated) {
      items.push(
        {
          id: 'histories',
          label: t('nav.histories'),
          icon: ClockIcon,
          href: entitySlug ? `/dashboard/${entitySlug}/histories` : '/dashboard',
        },
        {
          id: 'settings',
          label: t('nav.settings'),
          icon: Cog6ToothIcon,
          href: entitySlug ? `/dashboard/${entitySlug}/settings` : '/dashboard',
        }
      );
    }

    return items;
  }, [t, entitySlug, isAuthenticated]);

  const handleLanguageChange = (newLang: string) => {
    if (isLanguageSupported(newLang)) {
      switchLanguage(newLang);
    }
  };

  return {
    variant: 'firebase',
    logo: {
      src: '/logo.png',
      appName: CONSTANTS.APP_NAME,
      onClick: () => navigate('/'),
    },
    menuItems,
    languages,
    currentLanguage,
    onLanguageChange: handleLanguageChange,
    LinkComponent: linkWrapper,
    AuthActionComponent: AuthAction as ComponentType<AuthActionProps>,
    onLoginClick: () => navigate('/login'),
    authenticatedMenuItems: [],
    sticky: true,
  };
}
