import { useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunnerScans } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { formatDurationFromTimestamps, formatDate } from '@sudobility/testomniac_lib';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface ScanRow {
  id: number;
  status: string;
  pagesFound: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

const columnHelper = createColumnHelper<ScanRow>();

export default function ScansPage() {
  const { envId, entitySlug } = useParams<{ envId: string; entitySlug: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { scans, isLoading } = useRunnerScans({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => (
        <button
          onClick={() =>
            navigate(
              `/dashboard/${entitySlug}/environments/${envId}/runs/${info.getValue()}/progress`
            )
          }
          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          #{info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('pagesFound', {
      header: 'Pages Found',
      cell: info => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() ?? 0}</span>
      ),
    }),
    columnHelper.accessor('startedAt', {
      header: 'Started At',
      cell: info => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'duration',
      header: 'Duration',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDurationFromTimestamps(row.original.startedAt, row.original.completedAt) ?? '-'}
        </span>
      ),
    }),
  ];

  return (
    <div className="p-6">
      <SEOHead title="Discovery Runs" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Discovery Runs</h1>

      <DataTable data={scans as ScanRow[]} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
