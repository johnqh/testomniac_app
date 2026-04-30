import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityListPage } from '@sudobility/entity_pages';
import SEOHead from '@/components/SEOHead';
import { useEntityClient } from '../config/entityClient';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import type { EntityWithRole } from '@sudobility/entity_client';
import { useSetPageConfig } from '../hooks/usePageConfig';
import { analyticsService } from '../config/analytics';

const LAST_ENTITY_KEY = 'testomniac_last_entity';

function WorkspacesPage() {
  const { t } = useTranslation('common');
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
      <SEOHead title={t('breadcrumbs.home')} description="" noIndex />
      <EntityListPage client={entityClient} onSelectEntity={handleSelectEntity} />
    </>
  );
}

export default WorkspacesPage;
