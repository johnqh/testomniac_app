import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useRunnerTestSurfaceBundles,
  useCreateTestSurfaceBundle,
} from '@sudobility/testomniac_client';
import type { TestSurfaceBundleResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export default function BundlesPage() {
  const { entitySlug, envId } = useParams<{ entitySlug: string; envId: string }>();
  const { navigate } = useLocalizedNavigate();
  const {
    networkClient,
    token,
    primaryRunner,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const runnerId = primaryRunner?.id ?? 0;
  const basePath = `/dashboard/${entitySlug}/environments/${envId}`;

  const { bundles, isLoading, error, refetch } = useRunnerTestSurfaceBundles({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    token,
    enabled: !!token && !!primaryRunner,
  });

  const { createBundle, isCreating } = useCreateTestSurfaceBundle({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    token,
  });

  const handleCreate = async () => {
    if (!title.trim()) return;
    setFormError(null);
    try {
      await createBundle({
        runnerId,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setShowForm(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create bundle');
    }
  };

  if (contextLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (contextError || error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {contextError || error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Bundles" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Bundles</h1>
        {primaryRunner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : 'New Bundle'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Checkout Flow Tests"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Bundle'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {bundles.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No bundles yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Bundles are created during discovery scans or can be composed manually.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bundles.map((bundle: TestSurfaceBundleResponse) => (
            <button
              key={bundle.id}
              onClick={() => navigate(`${basePath}/bundles/${bundle.id}`)}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {bundle.title}
                  {bundle.title === 'Discovery' && (
                    <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      auto
                    </span>
                  )}
                </div>
                {bundle.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {bundle.description}
                  </div>
                )}
              </div>
              <span className="text-gray-400 dark:text-gray-500 text-xs">&rarr;</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
