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
  priority: number;
  title: string;
  description: string;
  expertiseRuleId: number | null;
}

const columnHelper = createColumnHelper<FindingRow>();
const TYPE_COLORS: Record<string, string> = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
};

const PRIORITY_CONFIG: Record<number, { label: string; className: string }> = {
  0: {
    label: 'P0 - Crash',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  1: {
    label: 'P1 - Critical',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  2: {
    label: 'P2 - Major',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  3: {
    label: 'P3 - Minor',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  4: {
    label: 'P4 - Suggestion',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  },
};

const columns = [
  columnHelper.accessor('priority', {
    header: 'Priority',
    sortingFn: 'basic',
    cell: info => {
      const value = info.getValue();
      const config = PRIORITY_CONFIG[value] ?? PRIORITY_CONFIG[3];
      return (
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${config.className}`}
        >
          {config.label}
        </span>
      );
    },
  }),
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
  const { envId } = useParams<{ envId: string }>();
  const { networkClient, token } = useApi();

  const { findings, isLoading, error } = useRunnerFindings({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
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

      <DataTable
        data={findings}
        columns={columns as never}
        isLoading={isLoading}
        initialSorting={[{ id: 'priority', desc: false }]}
      />
    </div>
  );
}
