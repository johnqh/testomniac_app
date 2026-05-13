import { useState } from 'react';
import {
  useRunnerTestSurfaceBundles,
  useBundleSurfaces,
  useBundleInteractions,
  useBundleScenarios,
} from '@sudobility/testomniac_client';
import type {
  TestSurfaceBundleResponse,
  TestSurfaceResponse,
  TestInteractionResponse,
  TestScenarioResponse,
} from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

type ContentTab = 'surfaces' | 'interactions' | 'scenarios';

function BundleContents({
  runnerId,
  bundle,
}: {
  runnerId: number;
  bundle: TestSurfaceBundleResponse;
}) {
  const [tab, setTab] = useState<ContentTab>('surfaces');
  const { networkClient, token } = useDashboardEnvironmentContext();

  const { surfaces, isLoading: surfacesLoading } = useBundleSurfaces({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    bundleId: bundle.id,
    token,
    enabled: tab === 'surfaces',
  });

  const { interactions, isLoading: interactionsLoading } = useBundleInteractions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    bundleId: bundle.id,
    token,
    enabled: tab === 'interactions',
  });

  const { scenarios, isLoading: scenariosLoading } = useBundleScenarios({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    bundleId: bundle.id,
    token,
    enabled: tab === 'scenarios',
  });

  const tabs: { key: ContentTab; label: string; count: number }[] = [
    { key: 'surfaces', label: 'Surfaces', count: surfaces.length },
    { key: 'interactions', label: 'Interactions', count: interactions.length },
    { key: 'scenarios', label: 'Scenarios', count: scenarios.length },
  ];

  return (
    <div className="mt-3">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-500">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-1">
        {tab === 'surfaces' && (
          <>
            {surfacesLoading && <LoadingRow />}
            {!surfacesLoading && surfaces.length === 0 && <EmptyRow label="surfaces" />}
            {surfaces.map((s: TestSurfaceResponse) => (
              <div
                key={s.id}
                className="px-3 py-2 rounded border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200"
              >
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {s.startingPath || '/'} · priority {s.priority}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'interactions' && (
          <>
            {interactionsLoading && <LoadingRow />}
            {!interactionsLoading && interactions.length === 0 && <EmptyRow label="interactions" />}
            {interactions.map((i: TestInteractionResponse) => (
              <div
                key={i.id}
                className="px-3 py-2 rounded border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200"
              >
                <div className="font-medium">{i.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {i.testType} · {i.startingPath || '/'}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'scenarios' && (
          <>
            {scenariosLoading && <LoadingRow />}
            {!scenariosLoading && scenarios.length === 0 && <EmptyRow label="scenarios" />}
            {scenarios.map((s: TestScenarioResponse) => (
              <div
                key={s.id}
                className="px-3 py-2 rounded border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200"
              >
                <div className="font-medium">{s.title}</div>
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

function LoadingRow() {
  return (
    <div className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">Loading...</div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">
      No {label} in this bundle
    </div>
  );
}

export default function BundlesPage() {
  const {
    networkClient,
    token,
    primaryRunner,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { bundles, isLoading, error } = useRunnerTestSurfaceBundles({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: primaryRunner?.id ?? 0,
    token,
    enabled: !!token && !!primaryRunner,
  });

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Test Bundles</h1>

      {bundles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No bundles yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Bundles are created during discovery scans or can be composed manually.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bundles.map((bundle: TestSurfaceBundleResponse) => (
            <div
              key={bundle.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <button
                onClick={() => setExpandedId(expandedId === bundle.id ? null : bundle.id)}
                className="w-full px-4 py-3 text-left flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {bundle.title}
                  </div>
                  {bundle.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {bundle.description}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {expandedId === bundle.id ? '▲' : '▼'}
                </span>
              </button>

              {expandedId === bundle.id && primaryRunner && (
                <div className="px-4 pb-4">
                  <BundleContents runnerId={primaryRunner.id} bundle={bundle} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
