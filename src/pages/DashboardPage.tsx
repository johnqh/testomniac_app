import { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { MasterDetailLayout } from '@sudobility/components';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';

export default function DashboardPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const [mobileView, setMobileView] = useState<'navigation' | 'content'>('content');

  return (
    <MasterDetailLayout
      masterWidth={260}
      mobileView={mobileView}
      onBackToNavigation={() => setMobileView('navigation')}
      masterContent={<DashboardSidebar entitySlug={entitySlug || ''} />}
      detailContent={<Outlet />}
    />
  );
}
