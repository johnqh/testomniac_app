import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunnerTestRuns } from '@sudobility/testomniac_client';
import type { TestRunResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface TestRunRow {
  id: number;
  testInteractionId: number;
  screen: string;
  status: string;
  durationMs: number | null;
  errorMessage: string | null;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '\u2014';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

const columnHelper = createColumnHelper<TestRunRow>();

const columns = [
  columnHelper.accessor('testInteractionId', {
    header: 'Test Interaction',
    cell: info => (
      <span className="font-medium text-gray-900 dark:text-gray-100">#{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('screen', {
    header: 'Screen',
    cell: info => (
      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('durationMs', {
    header: 'Duration',
    cell: info => (
      <span className="tabular-nums text-right block text-gray-700 dark:text-gray-300">
        {formatDuration(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor('errorMessage', {
    header: 'Error',
    cell: info => {
      const msg = info.getValue();
      return msg ? (
        <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-[250px] inline-block">
          {msg}
        </span>
      ) : (
        <span className="text-gray-300 dark:text-gray-600">&mdash;</span>
      );
    },
  }),
];

interface StatusCounts {
  completed: number;
  passed: number;
  failed: number;
  error: number;
  running: number;
  pending: number;
  planned: number;
  other: number;
}

function computeStatusCounts(testRuns: TestRunRow[]): StatusCounts {
  const counts: StatusCounts = {
    completed: 0,
    passed: 0,
    failed: 0,
    error: 0,
    running: 0,
    pending: 0,
    planned: 0,
    other: 0,
  };
  for (const run of testRuns) {
    const s = run.status as keyof StatusCounts;
    if (s in counts) {
      counts[s]++;
    } else {
      counts.other++;
    }
  }
  return counts;
}

interface SummaryChipProps {
  label: string;
  count: number;
  dotColor: string;
}

function SummaryChip({ label, count, dotColor }: SummaryChipProps) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
      {count} {label}
    </span>
  );
}

export default function TestRunsPage() {
  const { envId } = useParams<{ envId: string }>();
  const { networkClient, token } = useApi();

  const { testRuns, isLoading, error } = useRunnerTestRuns({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  const rows: TestRunRow[] = useMemo(
    () =>
      (testRuns ?? []).map((r: TestRunResponse) => ({
        id: r.id,
        testInteractionId: r.testInteractionRunId ?? r.id,
        screen: r.sizeClass ?? 'desktop',
        status: r.status ?? 'unknown',
        durationMs: r.totalDurationMs ?? null,
        errorMessage: null as string | null,
      })),
    [testRuns]
  );
  const counts = useMemo(() => computeStatusCounts(rows), [rows]);

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Test Runs</h1>

      {/* Summary row */}
      {!isLoading && testRuns.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <SummaryChip label="passed" count={counts.passed} dotColor="bg-green-500" />
          <SummaryChip label="completed" count={counts.completed} dotColor="bg-green-500" />
          <SummaryChip label="failed" count={counts.failed} dotColor="bg-red-500" />
          <SummaryChip label="error" count={counts.error} dotColor="bg-red-500" />
          <SummaryChip
            label="running"
            count={counts.running}
            dotColor="bg-blue-500 animate-pulse"
          />
          <SummaryChip label="pending" count={counts.pending} dotColor="bg-yellow-500" />
          <SummaryChip label="planned" count={counts.planned} dotColor="bg-gray-400" />
        </div>
      )}

      <DataTable
        data={rows}
        columns={columns as never}
        isLoading={isLoading}
        emptyMessage="No test runs found"
      />
    </div>
  );
}
