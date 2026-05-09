import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunnerPages, useRunPages, useRunPagesSummary } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export default function PagesPage() {
  const { entitySlug, runnerId, runId } = useParams<{
    entitySlug: string;
    runnerId: string;
    runId?: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const runnerPagesQuery = useRunnerPages({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: Number(runnerId),
    token: token ?? '',
    enabled: !!runnerId && !!token && !runId,
  });

  const runPagesQuery = useRunPages({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });
  const runPagesSummaryQuery = useRunPagesSummary({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });
  const pages = runId ? runPagesQuery.pages : runnerPagesQuery.pages;
  const pageSummaries = runId ? runPagesSummaryQuery.pages : [];
  const pageSummaryById = new Map(pageSummaries.map(page => [page.pageId, page]));
  const isLoading = runId
    ? runPagesQuery.isLoading || runPagesSummaryQuery.isLoading
    : runnerPagesQuery.isLoading;
  const error = runId ? runPagesQuery.error || runPagesSummaryQuery.error : runnerPagesQuery.error;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Discovered Pages" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Discovered Pages</h1>
      {runId && (
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Showing pages discovered during run #{runId}.
        </p>
      )}

      {pages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No pages discovered yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() =>
                navigate(
                  runId
                    ? `/dashboard/${entitySlug}/runners/${runnerId}/runs/${runId}/pages/${page.id}`
                    : `/dashboard/${entitySlug}/runners/${runnerId}/pages/${page.id}`
                )
              }
              className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
            >
              {(() => {
                const summary = pageSummaryById.get(page.id);
                const screenshotPath = summary?.latestScreenshotPath;

                return (
                  <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {screenshotPath ? (
                      <img
                        src={`${CONSTANTS.API_URL}/api/v1/artifacts/${screenshotPath}`}
                        alt={`${page.relativePath} screenshot`}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Screenshot</span>
                    )}
                  </div>
                );
              })()}
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {page.routeKey || page.relativePath}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {page.relativePath}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {page.requiresLogin && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                      Login
                    </span>
                  )}
                  {runId &&
                    (() => {
                      const summary = pageSummaryById.get(page.id);
                      if (!summary) return null;

                      return (
                        <>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {summary.pageStatesCount} state
                            {summary.pageStatesCount === 1 ? '' : 's'}
                          </span>
                          {summary.findings > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              {summary.findings} finding{summary.findings === 1 ? '' : 's'}
                            </span>
                          )}
                        </>
                      );
                    })()}
                </div>
                {runId &&
                  (() => {
                    const summary = pageSummaryById.get(page.id);
                    if (!summary) return null;
                    const expertiseNames = Object.keys(summary.expertiseSummary).sort();
                    if (expertiseNames.length === 0) return null;

                    return (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {expertiseNames.slice(0, 3).map(name => (
                          <span
                            key={name}
                            className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                {runId &&
                  (() => {
                    const summary = pageSummaryById.get(page.id);
                    if (!summary) return null;

                    return (
                      <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                        {summary.errors} error{summary.errors === 1 ? '' : 's'} • {summary.warnings}{' '}
                        warning{summary.warnings === 1 ? '' : 's'} • {summary.testCasesCount} case
                        {summary.testCasesCount === 1 ? '' : 's'}
                      </div>
                    );
                  })()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
