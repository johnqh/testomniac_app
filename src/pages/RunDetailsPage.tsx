import { useParams } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { StatusBadge } from '../components/scanner/StatusBadge';

export default function RunDetailsPage() {
  const { entitySlug, runId } = useParams<{ entitySlug: string; runId: string }>();
  const { navigate } = useLocalizedNavigate();
  const basePath = `/dashboard/${entitySlug}/runs/${runId}`;

  // TODO: fetch run data via useRunManager once API endpoints are live
  const run = {
    id: Number(runId),
    status: 'completed',
    phase: null,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  const subPages = [
    { label: 'Test Cases', path: `${basePath}/test-cases`, count: 0 },
    { label: 'Test Runs', path: `${basePath}/test-runs`, count: 0 },
    { label: 'Issues', path: `${basePath}/issues`, count: 0 },
    { label: 'Pages', path: `${basePath}/pages`, count: 0 },
    { label: 'Site Map', path: `${basePath}/map`, count: null },
    { label: 'Components', path: `${basePath}/components`, count: 0 },
    { label: 'Personas', path: `${basePath}/personas`, count: 0 },
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
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</div>
          <div className="text-xs text-gray-500">Pages Found</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</div>
          <div className="text-xs text-gray-500">Test Cases</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="text-xs text-gray-500">Passed</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">0</div>
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
