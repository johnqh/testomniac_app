import { useTranslation } from 'react-i18next';
import { type FooterConfig, type FooterLinkSection } from '@sudobility/building_blocks';
import { useCurrentEntityOptional } from '@sudobility/entity_client';
import { CONSTANTS } from '../../config/constants';
import LocalizedLink from './LocalizedLink';

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

export function useFooterConfig(variant: 'full' | 'compact'): FooterConfig {
  const { t } = useTranslation();
  const currentYear = String(new Date().getFullYear());
  const entityContext = useCurrentEntityOptional();
  const entitySlug = entityContext?.currentEntitySlug ?? null;

  if (variant === 'compact') {
    return {
      variant: 'compact',
      version: __APP_VERSION__,
      copyrightYear: currentYear,
      companyName: CONSTANTS.COMPANY_NAME,
      companyUrl: '/',
      links: [
        { label: t('nav.docs'), href: '/docs' },
        { label: t('nav.sitemap'), href: '/sitemap' },
      ],
      LinkComponent: linkWrapper,
      sticky: true,
    };
  }

  const linkSections: FooterLinkSection[] = [
    {
      title: t('nav.docs'),
      links: [{ label: t('docs.title'), href: '/docs' }],
    },
    {
      title: t('nav.histories'),
      links: [
        {
          label: t('histories.title'),
          href: entitySlug ? `/dashboard/${entitySlug}/histories` : '/dashboard',
        },
      ],
    },
    {
      title: t('nav.settings'),
      links: [
        {
          label: t('nav.settings'),
          href: entitySlug ? `/dashboard/${entitySlug}/settings` : '/dashboard',
        },
      ],
    },
  ];

  return {
    variant: 'full',
    logo: {
      appName: t('app.name'),
    },
    linkSections,
    version: __APP_VERSION__,
    copyrightYear: currentYear,
    companyName: CONSTANTS.COMPANY_NAME,
    companyUrl: '/',
    description: t('app.tagline'),
    LinkComponent: linkWrapper,
  };
}
