import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunnerFindings } from '@sudobility/testomniac_client';
import { parseExpertiseTitle, useFindingsAnalysis } from '@sudobility/testomniac_lib';
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

/* Small 10x10 SVG icons for each priority level */
const PRIORITY_ICONS: Record<number, React.ReactNode> = {
  0: (
    <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7 4.5h2v4H7zm0 5.5h2v2H7z" />
    </svg>
  ),
  1: (
    <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l7 13H1zm0 4v4m0 1.5v.5" />
      <path
        d="M7.13 2.26a1 1 0 011.74 0l6 11A1 1 0 0114 15H2a1 1 0 01-.87-1.5zm.87 4v3.5m0 2v.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  2: (
    <svg
      className="w-2.5 h-2.5 flex-shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 5v3.5M8 10.5v.5" />
    </svg>
  ),
  3: (
    <svg
      className="w-2.5 h-2.5 flex-shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path d="M6 8h4" />
    </svg>
  ),
  4: (
    <svg
      className="w-2.5 h-2.5 flex-shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 5v6M5 8h6" />
    </svg>
  ),
};

const PRIORITY_CONFIG: Record<
  number,
  { label: string; shortLabel: string; className: string; chipClassName: string }
> = {
  0: {
    label: 'P0 - Crash',
    shortLabel: 'P0',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
    chipClassName:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
  },
  1: {
    label: 'P1 - Critical',
    shortLabel: 'P1',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
    chipClassName:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  },
  2: {
    label: 'P2 - Major',
    shortLabel: 'P2',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
    chipClassName:
      'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  },
  3: {
    label: 'P3 - Minor',
    shortLabel: 'P3',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    chipClassName:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  },
  4: {
    label: 'P4 - Suggestion',
    shortLabel: 'P4',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200',
    chipClassName:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600',
  },
};

const columnHelper = createColumnHelper<FindingRow>();

const columns = [
  columnHelper.accessor('priority', {
    header: 'Priority',
    sortingFn: 'basic',
    size: 120,
    cell: info => {
      const value = info.getValue();
      const config = PRIORITY_CONFIG[value] ?? PRIORITY_CONFIG[3];
      return (
        <span
          className={`inline-flex items-center gap-1 justify-center min-w-[90px] rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
        >
          {PRIORITY_ICONS[value]}
          {config.label}
        </span>
      );
    },
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    size: 80,
    cell: info => {
      const value = info.getValue();
      const isError = value === 'error';
      const isWarning = value === 'warning';
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            isError
              ? 'text-red-600 dark:text-red-400'
              : isWarning
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {isError && (
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {isWarning && (
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {value}
        </span>
      );
    },
  }),
  columnHelper.accessor('title', {
    header: 'Title',
    cell: info => {
      const raw = info.getValue();
      const description = info.row.original.description;
      const { tag, title } = parseExpertiseTitle(raw);
      return (
        <div className="max-w-[400px]">
          <div className="flex items-center gap-1.5">
            {tag && (
              <span className="inline-flex shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {tag}
              </span>
            )}
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</span>
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
              {description}
            </p>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('expertiseRuleId', {
    header: 'Rule',
    size: 80,
    cell: info => (
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
        {info.getValue() == null ? 'manual' : `rule #${info.getValue()}`}
      </span>
    ),
  }),
];

type TypeFilter = 'all' | 'error' | 'warning';

export default function IssuesPage() {
  const { envId } = useParams<{ envId: string }>();
  const { networkClient, token } = useApi();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);

  const { findings, isLoading, error } = useRunnerFindings({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  const { priorityCounts, errorCount, warningCount, filteredFindings } = useFindingsAnalysis(
    findings,
    typeFilter === 'all' ? null : typeFilter,
    priorityFilter
  );

  const filteredData = filteredFindings as FindingRow[];
  const totalCount = findings.length;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  const typeFilters: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'error', label: 'Errors', count: errorCount },
    { key: 'warning', label: 'Warnings', count: warningCount },
  ];

  return (
    <div className="p-6">
      <SEOHead title="Findings" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Findings</h1>

      {/* Priority summary chips */}
      {!isLoading && findings.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
            const priority = Number(key);
            const count = priorityCounts[priority] ?? 0;
            const isActive = priorityFilter === priority;
            return (
              <button
                key={key}
                onClick={() => setPriorityFilter(isActive ? null : priority)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? `${config.chipClassName} ring-2 ring-offset-1 ring-current`
                    : `${config.chipClassName} opacity-80 hover:opacity-100`
                }`}
              >
                <span>{config.shortLabel}</span>
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Type filter tabs */}
      {!isLoading && findings.length > 0 && (
        <div className="mb-4 flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
          {typeFilters.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                typeFilter === key
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
              {typeFilter === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      <DataTable
        data={filteredData}
        columns={columns as never}
        isLoading={isLoading}
        initialSorting={[{ id: 'priority', desc: false }]}
        emptyMessage={
          typeFilter !== 'all' || priorityFilter !== null
            ? 'No findings match the current filters'
            : 'No findings detected'
        }
      />
    </div>
  );
}
