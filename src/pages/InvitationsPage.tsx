import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InvitationsPage as InvitationsPageComponent } from '@sudobility/entity_pages';
import SEOHead from '@/components/SEOHead';
import { useEntityClient } from '../config/entityClient';
import { useQueryClient } from '@tanstack/react-query';
import { analyticsService } from '../config/analytics';

function InvitationsPage() {
  const { t } = useTranslation('common');
  const entityClient = useEntityClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    analyticsService.trackPageView('/invitations', 'Invitations');
  }, []);

  const handleInvitationAccepted = () => {
    analyticsService.trackEvent('invitation_accepted');
    queryClient.invalidateQueries({ queryKey: ['entities'] });
  };

  return (
    <>
      <SEOHead title={t('breadcrumbs.home')} description="" noIndex />
      <InvitationsPageComponent
        client={entityClient}
        onInvitationAccepted={handleInvitationAccepted}
      />
    </>
  );
}

export default InvitationsPage;
