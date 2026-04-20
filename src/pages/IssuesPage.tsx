import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface IssueRow {
  id: number;
  type: string;
  description: string;
  pageUrl: string;
  severity: string;
  source: string;
}

const columnHelper = createColumnHelper<IssueRow>();

const SEVERITY_COLORS: Record<string, string> = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const columns = [
  columnHelper.accessor('type', {
    header: 'Type',
    cell: info => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: info => (
      <span className="text-sm text-gray-900 dark:text-gray-100 max-w-[300px] truncate inline-block">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('pageUrl', {
    header: 'Page',
    cell: info => (
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 max-w-[150px] truncate inline-block">
        {new URL(info.getValue()).pathname}
      </span>
    ),
  }),
  columnHelper.accessor('severity', {
    header: 'Severity',
    cell: info => (
      <span className={`text-sm font-medium ${SEVERITY_COLORS[info.getValue()] || ''}`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('source', {
    header: 'Source',
    cell: info => (
      <span className="text-xs text-gray-500 dark:text-gray-400">{info.getValue()}</span>
    ),
  }),
];

export default function IssuesPage() {
  // const { runId } = useParams<{ runId: string }>();

  // TODO: Replace with useRunIssues hook when API is live
  const issues: IssueRow[] = [];
  const isLoading = false;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Issues</h1>

      <DataTable data={issues} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
