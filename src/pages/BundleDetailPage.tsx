import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useRunnerTestSurfaceBundles,
  useBundleSurfaces,
  useBundleInteractions,
  useBundleScenarios,
  useUpdateTestSurfaceBundle,
  useDeleteTestSurfaceBundle,
} from '@sudobility/testomniac_client';
import type {
  TestSurfaceResponse,
  TestInteractionResponse,
  TestScenarioResponse,
} from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

type ContentTab = 'surfaces' | 'interactions' | 'scenarios';

export default function BundleDetailPage() {
  const { entitySlug, envId, bundleId } = useParams<{
    entitySlug: string;
    envId: string;
    bundleId: string;
  }>();
  const { navigate } = useLocalizedNavigate();
  const {
    networkClient,
    token,
    primaryRunner,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const numericBundleId = Number(bundleId);
  const runnerId = primaryRunner?.id ?? 0;
  const basePath = `/dashboard/${entitySlug}/environments/${envId}`;

  const {
    bundles,
    isLoading: bundlesLoading,
    refetch,
  } = useRunnerTestSurfaceBundles({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    token,
    enabled: !!token && !!primaryRunner,
  });

  const bundle = bundles.find(b => b.id === numericBundleId);
  const isDiscovery = bundle?.title === 'Discovery';

  const [tab, setTab] = useState<ContentTab>('surfaces');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { updateBundle, isUpdating } = useUpdateTestSurfaceBundle({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    token,
  });

  const { deleteBundle } = useDeleteTestSurfaceBundle({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    token,
  });

  const { surfaces, isLoading: surfacesLoading } = useBundleSurfaces({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    bundleId: numericBundleId,
    token,
    enabled: !!token && !!primaryRunner && tab === 'surfaces',
  });

  const { interactions, isLoading: interactionsLoading } = useBundleInteractions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    bundleId: numericBundleId,
    token,
    enabled: !!token && !!primaryRunner && tab === 'interactions',
  });

  const { scenarios, isLoading: scenariosLoading } = useBundleScenarios({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    bundleId: numericBundleId,
    token,
    enabled: !!token && !!primaryRunner && tab === 'scenarios',
  });

  const startEdit = () => {
    if (!bundle) return;
    setEditTitle(bundle.title);
    setEditDescription(bundle.description ?? '');
    setEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setError(null);
    try {
      await updateBundle({
        bundleId: numericBundleId,
        data: { title: editTitle.trim(), description: editDescription.trim() || undefined },
      });
      setEditing(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bundle');
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteBundle(numericBundleId);
      navigate(`${basePath}/bundles`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bundle');
    }
  };

  if (contextLoading || bundlesLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {contextError}</div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Bundle not found</div>
      </div>
    );
  }

  const tabs: { key: ContentTab; label: string; count: number }[] = [
    { key: 'surfaces', label: 'Surfaces', count: surfaces.length },
    { key: 'interactions', label: 'Interactions', count: interactions.length },
    { key: 'scenarios', label: 'Scenarios', count: scenarios.length },
  ];

  return (
    <div className="p-6">
      <SEOHead title={bundle.title} description="" noIndex />

      {/* Header */}
      <div className="mb-6">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-lg font-bold"
            />
            <input
              type="text"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isUpdating || !editTitle.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {bundle.title}
              </h1>
              {bundle.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {bundle.description}
                </p>
              )}
            </div>
            {!isDiscovery && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
        {!editing && error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {tab === 'surfaces' && (
          <>
            {surfacesLoading && <LoadingState />}
            {!surfacesLoading && surfaces.length === 0 && <EmptyState label="surfaces" />}
            {surfaces.map((s: TestSurfaceResponse) => (
              <div
                key={s.id}
                className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {s.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {s.startingPath || '/'} · priority {s.priority}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'interactions' && (
          <>
            {interactionsLoading && <LoadingState />}
            {!interactionsLoading && interactions.length === 0 && (
              <EmptyState label="interactions" />
            )}
            {interactions.map((i: TestInteractionResponse) => (
              <div
                key={i.id}
                className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {i.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {i.testType} · {i.startingPath || '/'}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'scenarios' && (
          <>
            {scenariosLoading && <LoadingState />}
            {!scenariosLoading && scenarios.length === 0 && <EmptyState label="scenarios" />}
            {scenarios.map((s: TestScenarioResponse) => (
              <div
                key={s.id}
                className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {s.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {s.startingPath} · {s.sizeClass}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Loading...</div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
      No {label} in this bundle
    </div>
  );
}
