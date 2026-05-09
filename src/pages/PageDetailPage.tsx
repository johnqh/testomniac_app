import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { usePageStates, useRunPageSummary } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export default function PageDetailPage() {
  const { pageId, runnerId, entitySlug, runId } = useParams<{
    pageId: string;
    runnerId: string;
    entitySlug: string;
    runId?: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { pageStates, isLoading } = usePageStates({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageId: Number(pageId),
    token: token ?? '',
    enabled: !!pageId && !!token,
  });
  const { summary, isLoading: summaryLoading } = useRunPageSummary({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    pageId: Number(pageId),
    token: token ?? '',
    enabled: !!runId && !!pageId && !!token,
  });

  if (isLoading || summaryLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Page Detail" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Page Detail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {summary?.relativePath ?? `Page #${pageId}`}
            {runId ? ` • Run #${runId}` : ` • Page #${pageId}`}
          </p>
        </div>
        <button
          onClick={() =>
            navigate(`/dashboard/${entitySlug}/runners/${runnerId}/pages/${pageId}/graph`)
          }
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          View Page Graph
        </button>
      </div>

      {summary && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.pageStatesCount}
              </div>
              <div className="text-xs text-gray-500">Page States</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.testCasesCount}
              </div>
              <div className="text-xs text-gray-500">Test Cases</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.findings}
              </div>
              <div className="text-xs text-gray-500">Findings</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.testCaseRunsCount}
              </div>
              <div className="text-xs text-gray-500">Case Runs</div>
            </div>
          </div>

          {summary.latestScreenshotPath && (
            <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <img
                src={`${CONSTANTS.API_URL}/api/v1/artifacts/${summary.latestScreenshotPath}`}
                alt={`${summary.relativePath} latest screenshot`}
                className="h-72 w-full object-cover object-top"
              />
            </div>
          )}

          {summary.recentFindings.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Findings
              </h2>
              <div className="space-y-3">
                {summary.recentFindings.slice(0, 8).map(finding => (
                  <div
                    key={finding.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {finding.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {finding.description}
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] capitalize text-gray-500 dark:text-gray-400">
                        {finding.expertise ?? finding.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.runtimeSignals.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Runtime Signals
              </h2>
              <div className="space-y-4">
                {summary.runtimeSignals.map(signal => (
                  <div
                    key={signal.testCaseRunId}
                    className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {signal.testCaseTitle ?? `Test Case #${signal.testCaseId}`}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Case run #{signal.testCaseRunId}
                          {signal.completedAt
                            ? ` • ${new Date(signal.completedAt).toLocaleString()}`
                            : ''}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {signal.status}
                      </span>
                    </div>
                    {signal.consoleLog && (
                      <pre className="mb-3 max-h-48 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                        {signal.consoleLog}
                      </pre>
                    )}
                    {signal.networkLog && (
                      <pre className="max-h-48 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                        {signal.networkLog}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {pageStates.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No page states found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageStates.map(state => (
            <button
              key={state.id}
              onClick={() =>
                navigate(
                  runId
                    ? `/dashboard/${entitySlug}/runners/${runnerId}/runs/${runId}/pages/${pageId}/states/${state.id}`
                    : `/dashboard/${entitySlug}/runners/${runnerId}/pages/${pageId}/states/${state.id}`
                )
              }
              className="text-left rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {state.screenshotPath ? (
                  <img
                    src={`${CONSTANTS.API_URL}/api/v1/artifacts/${state.screenshotPath}`}
                    alt={`State ${state.id} screenshot`}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-400">No screenshot</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    State #{state.id}
                  </span>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {state.sizeClass}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {state.capturedAt
                    ? new Date(state.capturedAt).toLocaleString()
                    : 'No capture date'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
