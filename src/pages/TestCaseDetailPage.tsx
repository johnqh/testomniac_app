import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useTestCaseActions } from '@sudobility/testomniac_client';
import type { TestActionResponse } from '@sudobility/testomniac_types';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';

function ActionRow({ action }: { action: TestActionResponse }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-8 flex-shrink-0 text-right">
          #{action.stepOrder}
        </span>
        <StatusBadge status={action.actionType} />
        <span className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-100 truncate">
          {action.description}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && action.playwrightCode && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Playwright Code
          </div>
          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words bg-white dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
            {action.playwrightCode}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function TestCaseDetailPage() {
  const { entitySlug, appId, caseId } = useParams<{
    entitySlug: string;
    appId: string;
    caseId: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const basePath = `/dashboard/${entitySlug}/apps/${appId}`;

  const { actions, isLoading, error } = useTestCaseActions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testCaseId: Number(caseId),
    token: token ?? '',
    enabled: !!caseId && !!token,
  });

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button
          onClick={() => navigate(`${basePath}/test-suites`)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Test Suites
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">Test Case #{caseId}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Test Case #{caseId}
      </h1>

      {/* Metadata badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-gray-500 dark:text-gray-400">ID: {caseId}</span>
      </div>

      {/* Actions list */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Test Actions
      </h2>

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading actions...
        </div>
      )}

      {!isLoading && actions.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No actions defined for this test case.
          </div>
        </div>
      )}

      {!isLoading && actions.length > 0 && (
        <div className="space-y-2">
          {(actions as TestActionResponse[])
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map(action => (
              <ActionRow key={action.id} action={action} />
            ))}
        </div>
      )}
    </div>
  );
}
