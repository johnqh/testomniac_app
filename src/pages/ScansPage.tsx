import { useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useAppScans } from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface ScanRow {
  id: number;
  status: string;
  phase: string | null;
  pagesFound: number | null;
  startedAt: string | null;
  endedAt: string | null;
}

const columnHelper = createColumnHelper<ScanRow>();

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

export default function ScansPage() {
  const { appId, entitySlug } = useParams<{ appId: string; entitySlug: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { scans, isLoading } = useAppScans({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: Number(appId),
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => (
        <button
          onClick={() =>
            navigate(`/dashboard/${entitySlug}/apps/${appId}/scans/${info.getValue()}/progress`)
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
    columnHelper.accessor('phase', {
      header: 'Phase',
      cell: info => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() ?? '-'}</span>
      ),
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
          {formatDuration(row.original.startedAt, row.original.endedAt)}
        </span>
      ),
    }),
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Scans</h1>

      <DataTable data={scans as ScanRow[]} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
