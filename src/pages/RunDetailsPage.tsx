import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useRun,
  useRunComponents,
  useRunPages,
  useRunPersonas,
  useRunTestCases,
  useRunTestRuns,
} from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';

export default function RunDetailsPage() {
  const { entitySlug, runId } = useParams<{ entitySlug: string; runId: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const basePath = `/dashboard/${entitySlug}/runs/${runId}`;

  const queryConfig = {
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  };

  const { run, isLoading, error } = useRun(queryConfig);
  const { pages } = useRunPages(queryConfig);
  const { testCases } = useRunTestCases(queryConfig);
  const { testRuns } = useRunTestRuns(queryConfig);
  const { personas } = useRunPersonas(queryConfig);
  const { components } = useRunComponents(queryConfig);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  if (isLoading || !run) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading run...</div>
      </div>
    );
  }

  const subPages = [
    { label: 'Test Cases', path: `${basePath}/test-cases`, count: testCases.length },
    { label: 'Test Runs', path: `${basePath}/test-runs`, count: testRuns.length },
    { label: 'Issues', path: `${basePath}/issues`, count: 0 },
    { label: 'Pages', path: `${basePath}/pages`, count: pages.length },
    { label: 'Site Map', path: `${basePath}/map`, count: null },
    { label: 'Components', path: `${basePath}/components`, count: components.length },
    { label: 'Personas', path: `${basePath}/personas`, count: personas.length },
  ];

  return (
    <div className="p-6">
      <SEOHead title={`Run #${runId}`} description="" noIndex />
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Run #{runId}</h1>
        <StatusBadge status={run.status} size="md" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {run.pagesFound ?? pages.length}
          </div>
          <div className="text-xs text-gray-500">Pages Found</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {testCases.length}
          </div>
          <div className="text-xs text-gray-500">Test Cases</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {run.testRunsCompleted ?? testRuns.length}
          </div>
          <div className="text-xs text-gray-500">Passed</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">{run.pageStatesFound ?? 0}</div>
          <div className="text-xs text-gray-500">Issues</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Explore Results
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subPages.map(page => (
          <button
            key={page.path}
            onClick={() => navigate(page.path)}
            className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{page.label}</div>
            {page.count !== null && (
              <div className="text-xs text-gray-500 mt-1">{page.count} items</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
