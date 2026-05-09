import { useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunnerTestElements } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface TestElementRow {
  id: number;
  name: string;
  testType: string;
  sizeClass: string;
  priority: string;
  surfaceTags: string[];
}

const columnHelper = createColumnHelper<TestElementRow>();

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
  columnHelper.accessor('surfaceTags', {
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

export default function TestElementsPage() {
  const { envId } = useParams<{ envId: string }>();
  const { networkClient, token } = useApi();

  const { testElements, isLoading, error } = useRunnerTestElements({
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
      <SEOHead title="Test Elements" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Test Elements</h1>

      <DataTable data={testElements} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
