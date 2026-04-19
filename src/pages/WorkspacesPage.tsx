import { useEffect } from 'react';
import { EntityListPage } from '@sudobility/entity_pages';
import { SEO } from '@sudobility/seo_lib';
import { useEntityClient } from '../config/entityClient';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import type { EntityWithRole } from '@sudobility/entity_client';
import { useSetPageConfig } from '../hooks/usePageConfig';
import { seoConfig } from '../config/seo';
import { analyticsService } from '../config/analytics';

const LAST_ENTITY_KEY = 'testomniac_last_entity';

function WorkspacesPage() {
  const { navigate } = useLocalizedNavigate();
  const entityClient = useEntityClient();

  useSetPageConfig({ scrollable: false, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/workspaces', 'Workspaces');
  }, []);

  const handleSelectEntity = (entity: EntityWithRole) => {
    analyticsService.trackButtonClick('select_workspace', { entity_slug: entity.entitySlug });
    localStorage.setItem(LAST_ENTITY_KEY, entity.entitySlug);
    navigate(`/dashboard/${entity.entitySlug}`);
  };

  return (
    <>
      <SEO config={seoConfig} title="Workspaces" noIndex />
      <EntityListPage client={entityClient} onSelectEntity={handleSelectEntity} />
    </>
  );
}

export default WorkspacesPage;
