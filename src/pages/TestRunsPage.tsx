import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface TestRunRow {
  id: number;
  testCaseName: string;
  screen: string;
  status: string;
  durationMs: number | null;
  errorMessage: string | null;
}

const columnHelper = createColumnHelper<TestRunRow>();

const columns = [
  columnHelper.accessor('testCaseName', {
    header: 'Test Case',
    cell: info => (
      <span className="font-medium text-gray-900 dark:text-gray-100">{info.getValue()}</span>
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
    cell: info => {
      const ms = info.getValue();
      return ms != null ? `${(ms / 1000).toFixed(1)}s` : '\u2014';
    },
  }),
  columnHelper.accessor('errorMessage', {
    header: 'Error',
    cell: info => {
      const msg = info.getValue();
      return msg ? (
        <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-[200px] inline-block">
          {msg}
        </span>
      ) : (
        '\u2014'
      );
    },
  }),
];

export default function TestRunsPage() {
  // const { runId } = useParams<{ runId: string }>();

  // TODO: Replace with useRunTestRuns hook when API is live
  const testRuns: TestRunRow[] = [];
  const isLoading = false;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Test Runs</h1>

      <DataTable data={testRuns} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
