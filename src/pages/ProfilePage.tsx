import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MasterDetailLayout } from '@sudobility/components';
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { useSetPageConfig } from '../hooks/usePageConfig';

export default function ProfilePage() {
  const [mobileView, setMobileView] = useState<'navigation' | 'content'>('content');

  useSetPageConfig({ scrollable: false, contentPadding: 'none', maxWidth: '7xl' });

  return (
    <MasterDetailLayout
      masterWidth={280}
      mobileView={mobileView}
      onBackToNavigation={() => setMobileView('navigation')}
      masterContent={<ProfileSidebar />}
      detailContent={
        <div className="min-h-[400px] overflow-y-auto">
          <Outlet />
        </div>
      }
    />
  );
}
