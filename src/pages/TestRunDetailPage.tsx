import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useRun,
  useRunSummary,
  useRunStructure,
  useTestInteractionRun,
  useTestRunFindings,
} from '@sudobility/testomniac_client';
import type { TestRunFindingResponse } from '@sudobility/testomniac_types';
import { formatDate, formatMultilineLog } from '@sudobility/testomniac_lib';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';

function FindingTypeBadge({ type }: { type: string }) {
  const colors =
    type === 'error'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      : type === 'warning'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}
    >
      {type}
    </span>
  );
}

export default function TestRunDetailPage() {
  const { entitySlug, envId, runId } = useParams<{
    entitySlug: string;
    envId: string;
    runId: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const basePath = `/dashboard/${entitySlug}/environments/${envId}`;
  const testRunId = Number(runId);

  const {
    run,
    isLoading: isRunLoading,
    error: runError,
  } = useRun({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: testRunId,
    token: token ?? '',
    enabled: !!runId && !!token,
  });
  const { summary } = useRunSummary({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: testRunId,
    token: token ?? '',
    enabled: !!runId && !!token,
  });
  const { structure } = useRunStructure({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: testRunId,
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  const { findings, isLoading, error } = useTestRunFindings({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testInteractionRunId: run?.testInteractionRunId ?? 0,
    token: token ?? '',
    enabled: !!run?.testInteractionRunId && !!token,
  });
  const {
    testInteractionRun,
    isLoading: isCaseRunLoading,
    error: elementRunError,
  } = useTestInteractionRun({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testInteractionRunId: run?.testInteractionRunId ?? 0,
    token: token ?? '',
    enabled: !!run?.testInteractionRunId && !!token,
  });

  if (runError || error || elementRunError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {runError || error || elementRunError}
        </div>
      </div>
    );
  }

  if (isRunLoading || !run) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading run...</div>
      </div>
    );
  }

  const isRootLikeRun = run.testInteractionRunId === null;
  const expertiseEntries = Object.entries(summary?.expertiseSummary ?? {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const surfaceCoverage =
    structure?.surfaces.map(surface => ({
      id: surface.id,
      title: surface.title,
      surfaceRunId: surface.surfaceRuns[0]?.id ?? null,
      status: surface.surfaceRuns[0]?.status ?? 'pending',
      interactionCount: surface.testInteractions.length,
    })) ?? [];
  const consoleLog = formatMultilineLog(testInteractionRun?.consoleLog);
  const networkLog = formatMultilineLog(testInteractionRun?.networkLog);

  return (
    <div className="p-6">
      <BackLink label="Back to Runs" onClick={() => navigate(`${basePath}/runs`)} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button
          onClick={() => navigate(`${basePath}/runs`)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Runs
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">Run #{runId}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Test Run #{runId}
      </h1>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <StatusBadge status={run.status} />
        <StatusBadge status={run.sizeClass} />
        <span className="text-xs text-gray-500 dark:text-gray-400">ID: {runId}</span>
        {run.createdAt && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Created {formatDate(run.createdAt)}
          </span>
        )}
        {run.startedAt && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Started {formatDate(run.startedAt)}
          </span>
        )}
        {run.completedAt && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Completed {formatDate(run.completedAt)}
          </span>
        )}
      </div>

      {isRootLikeRun && summary && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.pagesFound ?? 0}
              </div>
              <div className="text-xs text-gray-500">Pages Found</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.pageStatesFound ?? 0}
              </div>
              <div className="text-xs text-gray-500">Page States</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.testRunsCompleted ?? 0}
              </div>
              <div className="text-xs text-gray-500">Completed Runs</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.totalFindings}
              </div>
              <div className="text-xs text-gray-500">Findings</div>
            </div>
          </div>

          {summary.aiSummary && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Summary
              </h2>
              <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                {summary.aiSummary}
              </p>
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => navigate(`${basePath}/runs/${runId}/surface-runs`)}
              className="rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Surface Runs
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Navigate the run hierarchy by surface run, then interaction runs and run details.
              </div>
            </button>
            <button
              onClick={() => navigate(`${basePath}/runs/${runId}/pages`)}
              className="rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Pages</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Browse discovered pages and drill into captured page states.
              </div>
            </button>
            <button
              onClick={() => navigate(`${basePath}/runs/${runId}/issues`)}
              className="rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Findings</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Review grouped warnings and errors for this scan run.
              </div>
            </button>
          </div>

          {surfaceCoverage.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Coverage Tree
              </h2>
              <div className="space-y-3">
                {surfaceCoverage.map(surface => (
                  <button
                    key={surface.id}
                    onClick={() =>
                      surface.surfaceRunId != null &&
                      navigate(`${basePath}/runs/${runId}/surface-runs/${surface.surfaceRunId}`)
                    }
                    disabled={surface.surfaceRunId == null}
                    className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 disabled:cursor-default disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600 dark:disabled:hover:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {surface.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {surface.interactionCount} test interaction
                          {surface.interactionCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={surface.status} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {expertiseEntries.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Findings by Expertise
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {expertiseEntries.map(([name, counts]) => (
                  <div
                    key={name}
                    className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                      {name}
                    </div>
                    <div className="mt-3 flex gap-4 text-xs">
                      <span className="text-red-600 dark:text-red-400">
                        {counts.errors} error{counts.errors === 1 ? '' : 's'}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {counts.warnings} warning{counts.warnings === 1 ? '' : 's'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {counts.findings} total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Findings */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Findings
      </h2>

      {run.testInteractionRunId === null && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            This test run tracks a surface or discovery workflow and does not map directly to a
            single test interaction run.
          </div>
        </div>
      )}

      {run.testInteractionRunId !== null && isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading findings...
        </div>
      )}

      {run.testInteractionRunId !== null && !isLoading && findings.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No findings for this test run.
          </div>
        </div>
      )}

      {run.testInteractionRunId !== null && !isLoading && findings.length > 0 && (
        <div className="space-y-3">
          {(findings as TestRunFindingResponse[]).map(finding => (
            <div
              key={finding.id}
              className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <FindingTypeBadge type={finding.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {finding.title}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {finding.description}
                  </p>
                  {finding.createdAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {formatDate(finding.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {run.testInteractionRunId !== null && !isCaseRunLoading && (consoleLog || networkLog) && (
        <div className="mt-8 space-y-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Runtime Signals
          </h2>

          {consoleLog && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Console Log
              </h3>
              <pre className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                {consoleLog}
              </pre>
            </div>
          )}

          {networkLog && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Network Log
              </h3>
              <pre className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                {networkLog}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
