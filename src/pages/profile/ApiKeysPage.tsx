import { useEffect, useMemo, useState } from 'react';
import { EntitySelector } from '@sudobility/entity-components';
import { useCurrentEntity } from '@sudobility/entity_client';
import type { EntityWithRole } from '@sudobility/entity_client';
import { EntityType } from '@sudobility/types';
import { useApi } from '@sudobility/building_blocks/firebase';
import { variants } from '@sudobility/design';
import SEOHead from '@/components/SEOHead';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';
import { CONSTANTS } from '../../config/constants';
import {
  useEntityApiKeys,
  useCreateEntityApiKey,
  useDeleteEntityApiKey,
  type EntityApiKeyResponse,
} from '../../hooks/useEntityApiKeys';

export default function ApiKeysPage() {
  const { networkClient, token } = useApi();
  const { currentEntity, entities, isLoading: entitiesLoading } = useCurrentEntity();
  const [overrideEntity, setOverrideEntity] = useState<EntityWithRole | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [associatePersonal, setAssociatePersonal] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/api-keys', 'API Keys');
  }, []);

  const selectedEntity = useMemo(
    () => overrideEntity ?? currentEntity,
    [overrideEntity, currentEntity]
  );

  const hookConfig = {
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug: selectedEntity?.entitySlug ?? '',
    token: token ?? '',
  };

  const {
    apiKeys,
    isLoading: keysLoading,
    error: fetchError,
  } = useEntityApiKeys({
    ...hookConfig,
    enabled: !!selectedEntity && !!token,
  });
  const { createApiKey, isCreating } = useCreateEntityApiKey(hookConfig);
  const { deleteApiKey } = useDeleteEntityApiKey(hookConfig);

  // Find user's personal entity
  const personalEntity = entities.find(e => e.entityType === EntityType.PERSONAL);

  // Filter: show keys that are not associated with a personal entity, or associated with the user's personal entity
  const visibleKeys = apiKeys.filter(
    key =>
      key.associatedPersonalEntityId === null ||
      (personalEntity && key.associatedPersonalEntityId === personalEntity.id)
  );

  const error = mutationError || fetchError;

  function openForm() {
    setTitle('');
    setAssociatePersonal(false);
    setMutationError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setTitle('');
    setAssociatePersonal(false);
    setMutationError(null);
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setMutationError(null);
    try {
      await createApiKey({
        title: title.trim(),
        associatedPersonalEntityId: associatePersonal && personalEntity ? personalEntity.id : null,
      });
      cancelForm();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setMutationError(null);
    try {
      await deleteApiKey(id);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setDeletingId(null);
    }
  }

  if (entitiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={variants.loading.spinner.default()} />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="API Keys" description="" noIndex />
      <div className="px-4 py-4">
        <div className="mb-4 max-w-xs">
          <EntitySelector
            entities={entities}
            currentEntity={selectedEntity}
            onSelect={entity => {
              setOverrideEntity(entity);
              setShowForm(false);
            }}
            isLoading={entitiesLoading}
          />
        </div>

        {selectedEntity && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">API Keys</h2>
              {!showForm && (
                <button
                  type="button"
                  onClick={openForm}
                  className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Create Key
                </button>
              )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

            {/* Create Form */}
            {showForm && (
              <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  New API Key
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. CI Pipeline Key"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {personalEntity && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={associatePersonal}
                        onChange={e => setAssociatePersonal(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Associate with my personal account
                      </span>
                    </label>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isCreating || !title.trim()}
                      className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors"
                    >
                      {isCreating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Keys List */}
            {keysLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading API keys...</p>
            ) : visibleKeys.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No API keys for this workspace.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleKeys.map(key => (
                  <ApiKeyRow
                    key={key.id}
                    apiKey={key}
                    isPersonal={
                      personalEntity ? key.associatedPersonalEntityId === personalEntity.id : false
                    }
                    onDelete={() => handleDelete(key.id)}
                    isDeleting={deletingId === key.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedEntity && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a workspace to manage API keys.
          </p>
        )}
      </div>
    </>
  );
}

function ApiKeyRow({
  apiKey,
  isPersonal,
  onDelete,
  isDeleting,
}: {
  apiKey: EntityApiKeyResponse;
  isPersonal: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const maskedKey = apiKey.apiKey ? `${apiKey.apiKey.slice(0, 8)}${'*'.repeat(24)}` : '********';

  const createdAt = apiKey.createdAt
    ? new Date(apiKey.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {apiKey.title}
          </span>
          {isPersonal && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
              Personal
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">{maskedKey}</p>
        {createdAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Created {createdAt}</p>
        )}
      </div>
      <div className="ml-3 shrink-0">
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="px-2.5 py-1 text-xs rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
