import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunnerTestRuns } from '@sudobility/testomniac_client';
import type { TestRunResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

export default function TestRunsListPage() {
  const { entitySlug, runnerId } = useParams<{ entitySlug: string; runnerId: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { testRuns, isLoading, error } = useRunnerTestRuns({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: Number(runnerId),
    token: token ?? '',
    enabled: !!runnerId && !!token,
  });

  const basePath = `/dashboard/${entitySlug}/runners/${runnerId}`;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Test Runs" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Test Runs</h1>

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading test runs...
        </div>
      )}

      {!isLoading && testRuns.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No test runs yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Test runs will appear here after tests are executed.
          </p>
        </div>
      )}

      {!isLoading && testRuns.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Device
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Duration
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {testRuns.map((run: TestRunResponse) => (
                <tr
                  key={run.id}
                  onClick={() => navigate(`${basePath}/test-runs/${run.id}`)}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                    #{run.id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={run.sizeClass} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDuration(run.totalDurationMs)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDate(run.createdAt)}
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
