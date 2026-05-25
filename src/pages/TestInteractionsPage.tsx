import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useEnvironmentTestInteractions } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { DataTable } from '../components/data/DataTable';
import { StatusBadge } from '../components/scanner/StatusBadge';

interface TestInteractionRow {
  id: number;
  title: string;
  testType: string;
  sizeClass: string;
  priority: number;
  surfaceTags: string[];
}

const PRIORITY_LABELS: Record<number, string> = {
  0: 'crash',
  1: 'critical',
  2: 'major',
  3: 'minor',
  4: 'suggestion',
};

const columnHelper = createColumnHelper<TestInteractionRow>();

const columns = [
  columnHelper.accessor('title', {
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
    cell: info => {
      const p = info.getValue();
      const label = PRIORITY_LABELS[p] ?? `P${p}`;
      const color =
        p <= 1
          ? 'text-red-600 font-medium'
          : p === 2
            ? 'text-orange-600 font-medium'
            : 'text-gray-600 dark:text-gray-400';
      return <span className={color}>{label}</span>;
    },
  }),
  columnHelper.accessor('surfaceTags', {
    header: 'Tags',
    cell: info => (
      <div className="flex gap-1 flex-wrap">
        {(info.getValue() ?? []).map(tag => (
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

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: '0', label: 'Crash (0)' },
  { value: '1', label: 'Critical (1)' },
  { value: '2', label: 'Major (2)' },
  { value: '3', label: 'Minor (3)' },
  { value: '4', label: 'Suggestion (4)' },
];

const DEVICE_OPTIONS = ['All', 'Desktop', 'Mobile'] as const;

const selectClassName =
  'px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100';

export default function TestInteractionsPage() {
  const { envId } = useParams<{ envId: string }>();
  const { networkClient, token } = useApi();

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<string>('All');

  const { testInteractions, isLoading, error } = useEnvironmentTestInteractions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  const uniqueTypes = useMemo(() => {
    if (!testInteractions) return [];
    const types = new Set(testInteractions.map((t: TestInteractionRow) => t.testType));
    return Array.from(types).sort();
  }, [testInteractions]);

  const filteredData = useMemo(() => {
    if (!testInteractions) return [];
    return testInteractions.filter((row: TestInteractionRow) => {
      if (typeFilter && row.testType !== typeFilter) return false;
      if (priorityFilter !== '' && row.priority !== Number(priorityFilter)) return false;
      if (deviceFilter !== 'All' && row.sizeClass !== deviceFilter.toLowerCase()) return false;
      return true;
    });
  }, [testInteractions, typeFilter, priorityFilter, deviceFilter]);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Test Interactions" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Test Interactions
      </h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className={selectClassName}
        >
          <option value="">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className={selectClassName}
        >
          {PRIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {DEVICE_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setDeviceFilter(option)}
              className={`px-3 py-1.5 text-sm ${
                deviceFilter === option
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${option !== 'All' ? 'border-l border-gray-300 dark:border-gray-600' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <DataTable data={filteredData} columns={columns as never} isLoading={isLoading} />
    </div>
  );
}
