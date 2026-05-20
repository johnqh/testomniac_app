import { useEffect, useMemo, useState } from 'react';
import { MembersManagementPage } from '@sudobility/entity_pages';
import { EntitySelector } from '@sudobility/entity-components';
import { useAuthStatus } from '@sudobility/auth-components';
import { useCurrentEntity } from '@sudobility/entity_client';
import type { EntityWithRole } from '@sudobility/entity_client';
import SEOHead from '@/components/SEOHead';
import { useEntityClient } from '../../config/entityClient';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';
import { variants } from '@sudobility/design';

export default function ProfileMembersPage() {
  const entityClient = useEntityClient();
  const { currentEntity, entities, isLoading } = useCurrentEntity();
  const { user } = useAuthStatus();
  const [overrideEntity, setOverrideEntity] = useState<EntityWithRole | null>(null);

  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/members', 'Profile Members');
  }, []);

  const selectedEntity = useMemo(
    () => overrideEntity ?? currentEntity,
    [overrideEntity, currentEntity]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={variants.loading.spinner.default()} />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Members" description="" noIndex />
      <div className="px-4 py-4">
        <div className="mb-4 max-w-xs">
          <EntitySelector
            entities={entities}
            currentEntity={selectedEntity}
            onSelect={setOverrideEntity}
            isLoading={isLoading}
          />
        </div>
        {selectedEntity && user?.uid ? (
          <MembersManagementPage
            client={entityClient}
            entity={selectedEntity}
            currentUserId={user.uid}
          />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a workspace to manage members.
          </p>
        )}
      </div>
    </>
  );
}
