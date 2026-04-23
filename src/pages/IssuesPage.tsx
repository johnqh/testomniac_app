import { useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useAppIssues } from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface IssueRow {
  id: number;
  ruleName: string;
  title: string;
  description: string;
  severity: string;
  status: string;
}

const columnHelper = createColumnHelper<IssueRow>();

const SEVERITY_COLORS: Record<string, string> = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const columns = [
  columnHelper.accessor('severity', {
    header: 'Severity',
    cell: info => (
      <span className={`text-sm font-medium ${SEVERITY_COLORS[info.getValue()] || ''}`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('title', {
    header: 'Title',
    cell: info => (
      <span className="font-medium text-gray-900 dark:text-gray-100 max-w-[250px] truncate inline-block">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    cell: info => (
      <span className="text-sm text-gray-900 dark:text-gray-100 max-w-[300px] truncate inline-block">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('ruleName', {
    header: 'Rule',
    cell: info => (
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => <StatusBadge status={info.getValue()} />,
  }),
];

export default function IssuesPage() {
  const { appId } = useParams<{ appId: string }>();
  const { networkClient, token } = useApi();

  const { issues, isLoading, error } = useAppIssues({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: Number(appId),
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Issues</h1>

      <DataTable data={issues} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
