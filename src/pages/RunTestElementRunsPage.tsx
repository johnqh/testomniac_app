import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunStructure } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';
import BackLink from '../components/navigation/BackLink';

function formatDuration(ms: number | null): string {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function RunTestElementRunsPage() {
  const { entitySlug, envId, runId, surfaceRunId, elementId } = useParams<{
    entitySlug: string;
    envId: string;
    runId: string;
    surfaceRunId: string;
    elementId: string;
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
  const surface =
    structure?.surfaces.find(candidate =>
      candidate.surfaceRuns.some(run => run.id === Number(surfaceRunId))
    ) ?? null;
  const testElement =
    surface?.testElements.find(candidate => candidate.id === Number(elementId)) ?? null;

  if (error) {
    return <div className="p-6 text-center text-red-600 dark:text-red-400">Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  if (!surface || !testElement) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Test element not found.
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title={`${testElement.title} Runs`} description="" noIndex />
      <BackLink
        label={`Back to ${surface.title}`}
        onClick={() => navigate(`${basePath}/surface-runs/${surfaceRunId}`)}
      />
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
        <button
          onClick={() => navigate(`${basePath}/surface-runs/${surfaceRunId}`)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {surface.title}
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{testElement.title}</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{testElement.title}</h1>
        <StatusBadge status={testElement.testType} />
      </div>

      {testElement.elementRuns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No element runs found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Run
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Duration
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Findings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {testElement.elementRuns.map(elementRun => (
                <tr
                  key={elementRun.id}
                  onClick={() =>
                    navigate(
                      `${basePath}/surface-runs/${surfaceRunId}/test-elements/${elementId}/element-runs/${elementRun.id}`
                    )
                  }
                  className="cursor-pointer bg-white transition-colors hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                    #{elementRun.id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={elementRun.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDuration(elementRun.durationMs)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {elementRun.findings.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
