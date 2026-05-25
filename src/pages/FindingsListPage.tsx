import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunFindings } from '@sudobility/testomniac_client';
import type { TestRunFindingResponse } from '@sudobility/testomniac_types';
import { parseExpertiseTitle } from '@sudobility/testomniac_lib';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

/* ---------- Priority config ---------- */

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

/* ---------- Sub-components ---------- */

function FindingTypeBadge({ type }: { type: string }) {
  const colors =
    type === 'error'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      : type === 'warning'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}
    >
      {type}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG[3];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.shortLabel}
    </span>
  );
}

/* ---------- Filter types ---------- */

type TypeFilter = 'all' | 'errors';
type PriorityFilter = '' | '0' | '1' | '2' | '3' | '4';

const selectClassName =
  'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500';

/* ---------- Main component ---------- */

export default function FindingsListPage() {
  const { runId } = useParams<{ envId: string; runId?: string }>();
  const { networkClient, token } = useApi();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('');
  const [pathFilter, setPathFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const {
    latestRun,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const runFindingsQuery = useRunFindings({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId ?? latestRun?.id ?? 0),
    token: token ?? '',
    enabled: !!token && !!(runId ?? latestRun?.id),
  });
  const findings = runFindingsQuery.findings;
  const isLoading = contextLoading || runFindingsQuery.isLoading;
  const error = contextError || runFindingsQuery.error;

  // Derive unique paths from findings
  const uniquePaths = useMemo(() => {
    const paths = new Set<string>();
    for (const f of findings) {
      if (f.path) paths.add(f.path);
    }
    return Array.from(paths).sort();
  }, [findings]);

  // Derive unique categories (tags) from finding titles using parseExpertiseTitle
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const f of findings) {
      const { tag } = parseExpertiseTitle(f.title);
      if (tag) cats.add(tag);
    }
    return Array.from(cats).sort();
  }, [findings]);

  // Apply all filters
  const filteredFindings = useMemo(() => {
    let result = findings as TestRunFindingResponse[];

    if (typeFilter === 'errors') {
      result = result.filter(f => f.type === 'error');
    }

    if (priorityFilter !== '') {
      const p = Number(priorityFilter);
      result = result.filter(f => f.priority === p);
    }

    if (pathFilter !== '') {
      result = result.filter(f => f.path === pathFilter);
    }

    if (categoryFilter !== '') {
      result = result.filter(f => {
        const { tag } = parseExpertiseTitle(f.title);
        return tag === categoryFilter;
      });
    }

    return result;
  }, [findings, typeFilter, priorityFilter, pathFilter, categoryFilter]);

  const hasActiveFilters =
    typeFilter !== 'all' || priorityFilter !== '' || pathFilter !== '' || categoryFilter !== '';

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

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Findings</h1>
          {runId && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Showing findings for run #{runId}.
            </p>
          )}
        </div>

        {/* Type filter toggle */}
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('errors')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === 'errors'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Errors only
          </button>
        </div>
      </div>

      {/* Priority chips */}
      {!isLoading && findings.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
            const p = Number(key);
            const count = findings.filter(f => f.priority === p).length;
            const isActive = priorityFilter === key;
            return (
              <button
                key={key}
                onClick={() => setPriorityFilter(isActive ? '' : (key as PriorityFilter))}
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

      {/* Filter dropdowns row */}
      {!isLoading && findings.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Category filter */}
          {uniqueCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="">All categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Path filter */}
          {uniquePaths.length > 0 && (
            <select
              value={pathFilter}
              onChange={e => setPathFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="">All pages</option>
              {uniquePaths.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

          {/* Clear all filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setPriorityFilter('');
                setPathFilter('');
                setCategoryFilter('');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {filteredFindings.length} of {findings.length} findings
          </span>
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading findings...
        </div>
      )}

      {!isLoading && filteredFindings.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {hasActiveFilters ? 'No findings match the current filters' : 'No findings yet'}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {hasActiveFilters
              ? 'Try adjusting or clearing the filters above.'
              : 'Findings will appear here after test runs complete.'}
          </p>
        </div>
      )}

      {!isLoading && filteredFindings.length > 0 && (
        <div className="space-y-3">
          {filteredFindings.map(finding => {
            const { tag, title } = parseExpertiseTitle(finding.title);
            return (
              <div
                key={finding.id}
                className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1">
                    <FindingTypeBadge type={finding.type} />
                    <PriorityBadge priority={finding.priority} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {tag && (
                        <span className="inline-flex shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          {tag}
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {finding.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {finding.path && (
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          {finding.path}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {finding.interactionRunIds?.length
                          ? `Run #${finding.interactionRunIds.join(', #')}`
                          : ''}
                      </span>
                      {finding.createdAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(finding.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
