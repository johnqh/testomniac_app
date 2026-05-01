import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useTestSuiteChildSuites, useTestSuiteTestCases } from '@sudobility/testomniac_client';
import type { TestSuiteResponse, TestCaseResponse } from '@sudobility/testomniac_types';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';

function FolderIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400"
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

function FileIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0 text-blue-500 dark:text-blue-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

export default function TestSuiteDetailPage() {
  const { entitySlug, runnerId, suiteId } = useParams<{
    entitySlug: string;
    runnerId: string;
    suiteId: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const basePath = `/dashboard/${entitySlug}/runners/${runnerId}`;

  const {
    childSuites,
    isLoading: suitesLoading,
    error: suitesError,
  } = useTestSuiteChildSuites({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testSuiteId: Number(suiteId),
    token: token ?? '',
    enabled: !!suiteId && !!token,
  });

  const {
    testCases,
    isLoading: casesLoading,
    error: casesError,
  } = useTestSuiteTestCases({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testSuiteId: Number(suiteId),
    token: token ?? '',
    enabled: !!suiteId && !!token,
  });

  const isLoading = suitesLoading || casesLoading;
  const error = suitesError || casesError;

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
        <span className="text-gray-900 dark:text-gray-100 font-medium">Suite #{suiteId}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Test Suite #{suiteId}
      </h1>

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">Loading...</div>
      )}

      {!isLoading && childSuites.length === 0 && testCases.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Empty suite</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This test suite has no child suites or test cases.
          </p>
        </div>
      )}

      {/* Child suites */}
      {childSuites.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Child Suites
          </h2>
          <div className="space-y-2">
            {childSuites.map((suite: TestSuiteResponse) => (
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
                <StatusBadge status={suite.sizeClass} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test cases */}
      {testCases.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Test Cases
          </h2>
          <div className="space-y-2">
            {testCases.map((tc: TestCaseResponse) => (
              <button
                key={tc.id}
                onClick={() => navigate(`${basePath}/test-cases/${tc.id}`)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <FileIcon />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {tc.title}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={tc.testType} />
                  <StatusBadge status={tc.sizeClass} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
