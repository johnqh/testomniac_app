import { useEffect } from 'react';
import { InvitationsPage as InvitationsPageComponent } from '@sudobility/entity_pages';
import SEOHead from '@/components/SEOHead';
import { useEntityClient } from '../../config/entityClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';

export default function ProfileInvitationsPage() {
  const entityClient = useEntityClient();
  const queryClient = useQueryClient();

  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/invitations', 'Profile Invitations');
  }, []);

  const handleInvitationAccepted = () => {
    analyticsService.trackEvent('invitation_accepted');
    queryClient.invalidateQueries({ queryKey: ['entities'] });
  };

  return (
    <>
      <SEOHead title="Invitations" description="" noIndex />
      <InvitationsPageComponent
        client={entityClient}
        onInvitationAccepted={handleInvitationAccepted}
      />
    </>
  );
}
