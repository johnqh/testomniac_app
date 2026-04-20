import { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { MasterDetailLayout } from '@sudobility/components';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { useSetPageConfig } from '../hooks/usePageConfig';

export default function DashboardPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const [mobileView, setMobileView] = useState<'navigation' | 'content'>('content');

  // Prevent outer layout from scrolling; constrain width
  useSetPageConfig({ scrollable: false, contentPadding: 'none', maxWidth: '7xl' });

  return (
    <MasterDetailLayout
      masterWidth={280}
      mobileView={mobileView}
      onBackToNavigation={() => setMobileView('navigation')}
      masterContent={<DashboardSidebar entitySlug={entitySlug || ''} />}
      detailContent={
        <div className="min-h-[400px] overflow-y-auto">
          <Outlet />
        </div>
      }
    />
  );
}
