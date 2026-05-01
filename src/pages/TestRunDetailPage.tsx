import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRun, useTestRunFindings } from '@sudobility/testomniac_client';
import type { TestRunFindingResponse } from '@sudobility/testomniac_types';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

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
  const { entitySlug, runnerId, runId } = useParams<{
    entitySlug: string;
    runnerId: string;
    runId: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const basePath = `/dashboard/${entitySlug}/runners/${runnerId}`;
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

  const { findings, isLoading, error } = useTestRunFindings({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testCaseRunId: run?.testCaseRunId ?? 0,
    token: token ?? '',
    enabled: !!run?.testCaseRunId && !!token,
  });

  if (runError || error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {runError || error}
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

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button
          onClick={() => navigate(`${basePath}/test-runs`)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Test Runs
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

      {/* Findings */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Findings
      </h2>

      {run.testCaseRunId === null && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            This test run tracks a suite or discovery workflow and does not map directly to a single
            test case run.
          </div>
        </div>
      )}

      {run.testCaseRunId !== null && isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading findings...
        </div>
      )}

      {run.testCaseRunId !== null && !isLoading && findings.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No findings for this test run.
          </div>
        </div>
      )}

      {run.testCaseRunId !== null && !isLoading && findings.length > 0 && (
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
    </div>
  );
}
