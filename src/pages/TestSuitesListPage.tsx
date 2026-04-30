import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useAppTestSuites } from '@sudobility/testomniac_client';
import type { TestSuiteResponse } from '@sudobility/testomniac_types';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';

function FolderIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.06-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
      />
    </svg>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const label =
    priority >= 8 ? 'critical' : priority >= 5 ? 'high' : priority >= 3 ? 'medium' : 'low';
  const colors =
    priority >= 8
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      : priority >= 5
        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
        : priority >= 3
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}
    >
      P{priority} {label}
    </span>
  );
}

export default function TestSuitesListPage() {
  const { entitySlug, appId } = useParams<{ entitySlug: string; appId: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { testSuites, isLoading, error } = useAppTestSuites({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: Number(appId),
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  const basePath = `/dashboard/${entitySlug}/apps/${appId}`;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Test Suites</h1>

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading test suites...
        </div>
      )}

      {!isLoading && testSuites.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No test suites yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Test suites will appear here after a scan generates them.
          </p>
        </div>
      )}

      {!isLoading && testSuites.length > 0 && (
        <div className="space-y-2">
          {testSuites.map((suite: TestSuiteResponse) => (
            <button
              key={suite.id}
              onClick={() => navigate(`${basePath}/test-suites/${suite.id}`)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <FolderIcon />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {suite.title}
                </div>
                {suite.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {suite.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={suite.priority} />
                <StatusBadge status={suite.sizeClass} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
