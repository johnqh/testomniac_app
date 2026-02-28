import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppPageLayout } from '@sudobility/building_blocks';
import { useTopBarConfig } from './TopBar';
import { useFooterConfig } from './Footer';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

interface ScreenContainerProps {
  children: ReactNode;
}

/**
 * Page layout shell providing consistent navigation, breadcrumbs, and footer.
 *
 * Breadcrumbs are hidden on the home page. The footer switches between
 * "full" (home page) and "compact" (all other pages) variants.
 */
export default function ScreenContainer({ children }: ScreenContainerProps) {
  const location = useLocation();
  const { items: breadcrumbItems } = useBreadcrumbs();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isHomePage = pathParts.length <= 1;

  const topBarConfig = useTopBarConfig();
  const footerConfig = useFooterConfig(isHomePage ? 'full' : 'compact');

  return (
    <AppPageLayout
      topBar={topBarConfig}
      breadcrumbs={
        !isHomePage
          ? {
              items: breadcrumbItems,
            }
          : undefined
      }
      footer={footerConfig}
      page={{ maxWidth: 'full', contentPadding: 'none' }}
    >
      {children}
    </AppPageLayout>
  );
}
