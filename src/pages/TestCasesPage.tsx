import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface TestCaseRow {
  id: number;
  name: string;
  testType: string;
  sizeClass: string;
  priority: string;
  suiteTags: string[];
  actionsJson: unknown[];
}

const columnHelper = createColumnHelper<TestCaseRow>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => (
      <span className="font-medium text-gray-900 dark:text-gray-100">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('testType', {
    header: 'Type',
    cell: info => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('priority', {
    header: 'Priority',
    cell: info => (
      <span
        className={
          info.getValue() === 'high'
            ? 'text-red-600 font-medium'
            : 'text-gray-600 dark:text-gray-400'
        }
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('suiteTags', {
    header: 'Tags',
    cell: info => (
      <div className="flex gap-1 flex-wrap">
        {info.getValue().map(tag => (
          <span
            key={tag}
            className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor('sizeClass', {
    header: 'Device',
  }),
];

export default function TestCasesPage() {
  // const { runId } = useParams<{ runId: string }>();

  // TODO: Replace with useRunTestCases hook when API is live
  const testCases: TestCaseRow[] = [];
  const isLoading = false;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Test Cases</h1>

      <DataTable data={testCases} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
