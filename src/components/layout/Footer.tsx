import { useTranslation } from 'react-i18next';
import {
  AppFooter,
  AppFooterForHomePage,
  type FooterLinkSection,
} from '@sudobility/building_blocks';
import { CONSTANTS } from '../../config/constants';
import LocalizedLink from './LocalizedLink';

interface FooterProps {
  variant?: 'full' | 'compact';
}

const LinkWrapper = ({
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

export default function Footer({ variant = 'compact' }: FooterProps) {
  const { t } = useTranslation();
  const currentYear = String(new Date().getFullYear());

  if (variant === 'compact') {
    return (
      <AppFooter
        version={__APP_VERSION__}
        copyrightYear={currentYear}
        companyName={CONSTANTS.COMPANY_NAME}
        companyUrl="/"
        links={[
          { label: t('nav.docs'), href: '/docs' },
          { label: t('nav.sitemap'), href: '/sitemap' },
        ]}
        LinkComponent={LinkWrapper}
        sticky
      />
    );
  }

  const linkSections: FooterLinkSection[] = [
    {
      title: t('nav.docs'),
      links: [{ label: t('docs.title'), href: '/docs' }],
    },
    {
      title: t('nav.histories'),
      links: [{ label: t('histories.title'), href: '/histories' }],
    },
    {
      title: t('nav.settings'),
      links: [{ label: t('nav.settings'), href: '/settings' }],
    },
  ];

  return (
    <AppFooterForHomePage
      logo={{
        appName: t('app.name'),
      }}
      linkSections={linkSections}
      version={__APP_VERSION__}
      copyrightYear={currentYear}
      companyName={CONSTANTS.COMPANY_NAME}
      companyUrl="/"
      description={t('app.tagline')}
      LinkComponent={LinkWrapper}
      gridColumns={3}
    />
  );
}
