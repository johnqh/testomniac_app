import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useRunStructure,
  useTestInteractionRun,
  useTestRunFindings,
} from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';
import BackLink from '../components/navigation/BackLink';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

function formatMultilineLog(log: string | null | undefined): string | null {
  if (!log) return null;
  const trimmed = log.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function RunTestInteractionRunDetailPage() {
  const { entitySlug, envId, runId, surfaceRunId, elementId, elementRunId } = useParams<{
    entitySlug: string;
    envId: string;
    runId: string;
    surfaceRunId: string;
    elementId: string;
    elementRunId: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const {
    structure,
    isLoading: structureLoading,
    error: structureError,
  } = useRunStructure({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });
  const { testInteractionRun, isLoading, error } = useTestInteractionRun({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testInteractionRunId: Number(elementRunId),
    token: token ?? '',
    enabled: !!elementRunId && !!token,
  });
  const { findings } = useTestRunFindings({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testInteractionRunId: Number(elementRunId),
    token: token ?? '',
    enabled: !!elementRunId && !!token,
  });

  const basePath = `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}`;
  const surface =
    structure?.surfaces.find(candidate =>
      candidate.surfaceRuns.some(run => run.id === Number(surfaceRunId))
    ) ?? null;
  const testInteraction =
    surface?.testInteractions.find(candidate => candidate.id === Number(elementId)) ?? null;
  const inlineRun = useMemo(
    () =>
      testInteraction?.interactionRuns.find(candidate => candidate.id === Number(elementRunId)) ??
      null,
    [testInteraction, elementRunId]
  );

  const pageError = structureError || error;
  if (pageError) {
    return <div className="p-6 text-center text-red-600 dark:text-red-400">Error: {pageError}</div>;
  }

  if (isLoading || structureLoading || !testInteractionRun) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  const consoleLog = formatMultilineLog(testInteractionRun.consoleLog);
  const networkLog = formatMultilineLog(testInteractionRun.networkLog);

  return (
    <div className="p-6">
      <SEOHead title={`Interaction Run #${elementRunId}`} description="" noIndex />
      <BackLink
        label={`Back to ${testInteraction?.title ?? `Test Interaction #${elementId}`}`}
        onClick={() =>
          navigate(`${basePath}/surface-runs/${surfaceRunId}/test-interactions/${elementId}`)
        }
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
          {surface?.title ?? `Surface Run #${surfaceRunId}`}
        </button>
        <span>/</span>
        <button
          onClick={() =>
            navigate(`${basePath}/surface-runs/${surfaceRunId}/test-interactions/${elementId}`)
          }
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {testInteraction?.title ?? `Test Interaction #${elementId}`}
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">Run #{elementRunId}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Interaction Run #{elementRunId}
        </h1>
        <StatusBadge status={testInteractionRun.status} />
        {testInteraction && <StatusBadge status={testInteraction.testType} />}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {findings.length}
          </div>
          <div className="text-xs text-gray-500">Findings</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {testInteractionRun.durationMs ?? '-'}
          </div>
          <div className="text-xs text-gray-500">Duration (ms)</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatDate(testInteractionRun.startedAt)}
          </div>
          <div className="text-xs text-gray-500">Started</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatDate(testInteractionRun.completedAt)}
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
      </div>

      {testInteractionRun.errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm whitespace-pre-wrap text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {testInteractionRun.errorMessage}
        </div>
      )}

      {testInteractionRun.expectedOutcome && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Expected Outcome
          </h2>
          <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
            {testInteractionRun.expectedOutcome}
          </pre>
        </div>
      )}

      {testInteractionRun.observedOutcome && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Observed Outcome
          </h2>
          <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
            {testInteractionRun.observedOutcome}
          </pre>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Findings
        </h2>
        {findings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No findings for this interaction run.
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map(finding => (
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
                  <div className="shrink-0">
                    <StatusBadge status={finding.type} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(consoleLog || networkLog || inlineRun?.findings.length) && (
        <div className="space-y-6">
          {consoleLog && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Console Log
              </h2>
              <pre className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                {consoleLog}
              </pre>
            </div>
          )}
          {networkLog && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Network Log
              </h2>
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
