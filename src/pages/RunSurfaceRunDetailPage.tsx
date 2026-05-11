import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunStructure } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';
import BackLink from '../components/navigation/BackLink';

export default function RunSurfaceRunDetailPage() {
  const { entitySlug, envId, runId, surfaceRunId } = useParams<{
    entitySlug: string;
    envId: string;
    runId: string;
    surfaceRunId: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { structure, isLoading, error } = useRunStructure({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  const basePath = `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}`;
  const match =
    structure?.surfaces.find(surface =>
      surface.surfaceRuns.some(surfaceRun => surfaceRun.id === Number(surfaceRunId))
    ) ?? null;
  const selectedRun =
    match?.surfaceRuns.find(surfaceRun => surfaceRun.id === Number(surfaceRunId)) ?? null;

  if (error) {
    return <div className="p-6 text-center text-red-600 dark:text-red-400">Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  if (!match || !selectedRun) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">Surface run not found.</div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title={`${match.title} Run`} description="" noIndex />
      <BackLink label="Back to Surface Runs" onClick={() => navigate(`${basePath}/surface-runs`)} />
      <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <button
          onClick={() => navigate(basePath)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Run #{runId}
        </button>
        <span>/</span>
        <button
          onClick={() => navigate(`${basePath}/surface-runs`)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Surface Runs
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{match.title}</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{match.title}</h1>
        <StatusBadge status={selectedRun.status} />
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Surface run #{selectedRun.id} with {match.testElements.length} test elements.
        </div>
      </div>

      <div className="space-y-3">
        {match.testElements.map(testElement => (
          <button
            key={testElement.id}
            onClick={() =>
              navigate(`${basePath}/surface-runs/${surfaceRunId}/test-elements/${testElement.id}`)
            }
            className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {testElement.title}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {testElement.elementRuns.length} element run
                  {testElement.elementRuns.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={testElement.testType} />
                <StatusBadge
                  status={
                    testElement.elementRuns[0]?.status ?? match.surfaceRuns[0]?.status ?? 'pending'
                  }
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
