import { useEffect } from 'react';
import { InvitationsPage as InvitationsPageComponent } from '@sudobility/entity_pages';
import { SEO } from '@sudobility/seo_lib';
import { useEntityClient } from '../config/entityClient';
import { useQueryClient } from '@tanstack/react-query';
import { seoConfig } from '../config/seo';
import { analyticsService } from '../config/analytics';

function InvitationsPage() {
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
      <SEO config={seoConfig} title="Invitations" noIndex />
      <InvitationsPageComponent
        client={entityClient}
        onInvitationAccepted={handleInvitationAccepted}
      />
    </>
  );
}

export default InvitationsPage;
