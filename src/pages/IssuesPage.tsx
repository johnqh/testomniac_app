import { useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunnerFindings } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { DataTable } from '../components/data/DataTable';

interface FindingRow {
  id: number;
  type: string;
  title: string;
  description: string;
  expertiseRuleId: number | null;
}

const columnHelper = createColumnHelper<FindingRow>();
const TYPE_COLORS: Record<string, string> = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
};

const columns = [
  columnHelper.accessor('type', {
    header: 'Type',
    cell: info => (
      <span className={`text-sm font-medium ${TYPE_COLORS[info.getValue()] || ''}`}>
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
  columnHelper.accessor('expertiseRuleId', {
    header: 'Rule',
    cell: info => (
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
        {info.getValue() == null ? 'manual' : `rule #${info.getValue()}`}
      </span>
    ),
  }),
];

export default function IssuesPage() {
  const { runnerId } = useParams<{ runnerId: string }>();
  const { networkClient, token } = useApi();

  const { findings, isLoading, error } = useRunnerFindings({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: Number(runnerId),
    token: token ?? '',
    enabled: !!runnerId && !!token,
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
      <SEOHead title="Findings" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Findings</h1>

      <DataTable data={findings} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
