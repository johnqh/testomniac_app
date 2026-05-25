import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useEntityProducts,
  useProductEnvironments,
  useProductRuns,
} from '@sudobility/testomniac_client';
import type {
  ProductSummaryResponse,
  TestEnvironmentResponse,
  TestRunResponse,
} from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { StatusBadge } from '@/components/scanner/StatusBadge';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { formatDateTime } from '../utils/formatDateTime';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format milliseconds into a readable duration. */
function formatDuration(ms: number): string {
  if (ms < 1_000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1_000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Card linking to one of an app's data sections. */
function SectionLink({
  label,
  count,
  onClick,
}: {
  label: string;
  count?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
    >
      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {label}
      </span>
      {count && <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{count}</span>}
    </button>
  );
}

/** A single environment card with links to its dashboard sections. */
function EnvironmentCard({
  environment,
  basePath,
}: {
  environment: TestEnvironmentResponse;
  basePath: string;
}) {
  const { navigate } = useLocalizedNavigate();
  const envBasePath = `${basePath}/environments/${environment.id}`;

  const sections = [
    {
      label: 'Test Surfaces',
      description: 'Test surface hierarchy',
      path: `${envBasePath}/test-surfaces`,
    },
    { label: 'Test Runs', description: 'Execution results', path: `${envBasePath}/test-runs` },
    { label: 'Findings', description: 'Errors and warnings', path: `${envBasePath}/findings` },
    { label: 'Settings', description: 'Environment settings', path: `${envBasePath}/settings` },
  ];

  const kindColor =
    environment.kind === 'shared'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Environment header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {environment.title}
          </h3>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${kindColor}`}>
            {environment.kind}
          </span>
        </div>
        {environment.baseUrl && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate font-mono">
            {environment.baseUrl}
          </p>
        )}
      </div>

      {/* Section links */}
      <div className="p-2 grid grid-cols-2 gap-0.5">
        {sections.map(section => (
          <SectionLink
            key={section.label}
            label={section.label}
            onClick={() => navigate(section.path)}
          />
        ))}
      </div>
    </div>
  );
}

/** Lists environments for a single product, with lazy loading. */
function ProductSection({
  product,
  basePath,
}: {
  product: ProductSummaryResponse;
  basePath: string;
}) {
  const { networkClient, token } = useApi();

  const { environments, isLoading, error } = useProductEnvironments({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    productId: product.id,
    token: token ?? '',
    enabled: !!token,
  });

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {product.title}
      </h2>

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading environments...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 py-2">
          Failed to load environments: {error}
        </div>
      )}

      {!isLoading && !error && environments.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-center">
          No environments in this product yet.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {environments.map((env: TestEnvironmentResponse) => (
          <EnvironmentCard key={env.id} environment={env} basePath={basePath} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats tile
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  icon,
  accent = 'gray',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'blue' | 'emerald' | 'amber' | 'gray' | 'red';
}) {
  const accentMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    gray: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accentMap[accent]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
          {value}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent runs section
// ---------------------------------------------------------------------------

function RecentRunRow({ run, basePath }: { run: TestRunResponse; basePath: string }) {
  const { navigate } = useLocalizedNavigate();

  const url = run.scanUrl
    ? run.scanUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : 'Unknown URL';
  const truncatedUrl = url.length > 50 ? `${url.slice(0, 47)}...` : url;

  return (
    <button
      onClick={() => navigate(`${basePath}/runs/${run.id}`)}
      className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
    >
      {/* Status badge */}
      <div className="shrink-0">
        <StatusBadge status={run.status} size="sm" />
      </div>

      {/* URL and meta */}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 font-mono">
          {truncatedUrl}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          <span>{run.sizeClass}</span>
          {run.pagesFound != null && <span>{run.pagesFound} pages</span>}
          {run.testRunsCompleted != null && <span>{run.testRunsCompleted} tests</span>}
        </div>
      </div>

      {/* Duration */}
      <div className="shrink-0 text-right">
        {run.totalDurationMs != null && (
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {formatDuration(run.totalDurationMs)}
          </div>
        )}
        {run.createdAt && (
          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            {formatDateTime(run.createdAt)}
          </div>
        )}
      </div>
    </button>
  );
}

function RecentRunsSection({
  runs,
  basePath,
  isLoading,
}: {
  runs: TestRunResponse[];
  basePath: string;
  isLoading: boolean;
}) {
  const recentRuns = useMemo(
    () =>
      [...runs]
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5),
    [runs]
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Runs</h2>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700/50 rounded" />
              <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentRuns.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Runs</h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {recentRuns.map(run => (
          <RecentRunRow key={run.id} run={run} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Run status breakdown bar
// ---------------------------------------------------------------------------

function RunStatusBreakdown({ runs }: { runs: TestRunResponse[] }) {
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const run of runs) {
      counts[run.status] = (counts[run.status] ?? 0) + 1;
    }
    return counts;
  }, [runs]);

  const total = runs.length;
  if (total === 0) return null;

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500 dark:bg-green-400',
    passed: 'bg-green-500 dark:bg-green-400',
    running: 'bg-blue-500 dark:bg-blue-400',
    pending: 'bg-yellow-500 dark:bg-yellow-400',
    planned: 'bg-gray-400 dark:bg-gray-500',
    failed: 'bg-red-500 dark:bg-red-400',
    error: 'bg-red-500 dark:bg-red-400',
    cancelled: 'bg-gray-400 dark:bg-gray-500',
    skipped: 'bg-gray-300 dark:bg-gray-600',
  };

  const statusLabelColors: Record<string, string> = {
    completed: 'text-green-600 dark:text-green-400',
    passed: 'text-green-600 dark:text-green-400',
    running: 'text-blue-600 dark:text-blue-400',
    pending: 'text-yellow-600 dark:text-yellow-400',
    planned: 'text-gray-500 dark:text-gray-400',
    failed: 'text-red-600 dark:text-red-400',
    error: 'text-red-600 dark:text-red-400',
    cancelled: 'text-gray-500 dark:text-gray-400',
    skipped: 'text-gray-400 dark:text-gray-500',
  };

  const entries = Object.entries(breakdown).sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Run Status Overview
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {total} total run{total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="px-5 py-4">
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
          {entries.map(([status, count]) => (
            <div
              key={status}
              className={`${statusColors[status] ?? 'bg-gray-400'} transition-all`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${status}: ${count}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {entries.map(([status, count]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${statusColors[status] ?? 'bg-gray-400'}`}
              />
              <span
                className={`text-xs font-medium ${statusLabelColors[status] ?? 'text-gray-500 dark:text-gray-400'}`}
              >
                {status}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums font-mono">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aggregate stats for the first product
// ---------------------------------------------------------------------------

function useFirstProductRuns(products: ProductSummaryResponse[]) {
  const { networkClient, token } = useApi();
  const firstProduct = products[0];

  const { runs, isLoading, error } = useProductRuns({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    productId: firstProduct?.id ?? 0,
    token: token ?? '',
    enabled: !!firstProduct && !!token,
  });

  return { runs, isLoading, error };
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function DashboardOverview() {
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const { navigate } = useLocalizedNavigate();
  const { networkClient, token } = useApi();
  const basePath = `/dashboard/${entitySlug}`;

  const { products, isLoading, error } = useEntityProducts({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug: entitySlug ?? '',
    token: token ?? '',
    enabled: !!token && !!entitySlug,
  });

  // Fetch runs for the first product for the overview stats
  const { runs: firstProductRuns, isLoading: runsLoading } = useFirstProductRuns(products);

  // Count total environments across all products (approximation: rendered by ProductSection)
  // We use a simple heuristic based on product count for the tile; exact counts are
  // shown inside each ProductSection.
  const totalProducts = products.length;

  const runStats = useMemo(() => {
    const completedRuns = firstProductRuns.filter(r => r.status === 'completed');
    const totalPages = completedRuns.reduce((sum, r) => sum + (r.pagesFound ?? 0), 0);
    const totalTests = completedRuns.reduce((sum, r) => sum + (r.testRunsCompleted ?? 0), 0);
    return {
      totalRuns: firstProductRuns.length,
      completedRuns: completedRuns.length,
      failedRuns: firstProductRuns.filter(r => r.status === 'failed' || r.status === 'error')
        .length,
      totalPages,
      totalTests,
    };
  }, [firstProductRuns]);

  return (
    <div className="p-6 max-w-5xl">
      <SEOHead title="Dashboard" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Manage your web application tests and discovery run results.
      </p>

      {/* ----------------------------------------------------------------- */}
      {/* Summary Stats Tiles                                                */}
      {/* ----------------------------------------------------------------- */}
      {!isLoading && !error && totalProducts > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatTile
            label="Products"
            value={totalProducts}
            accent="blue"
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="14" height="14" rx="2" />
                <path d="M3 8h14" />
                <path d="M8 8v9" />
              </svg>
            }
          />
          <StatTile
            label="Total Runs"
            value={runsLoading ? '--' : runStats.totalRuns}
            accent="emerald"
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3v14l8-7-8-7z" />
              </svg>
            }
          />
          <StatTile
            label="Pages Discovered"
            value={runsLoading ? '--' : runStats.totalPages}
            accent="amber"
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="2" width="14" height="16" rx="2" />
                <path d="M7 6h6M7 10h6M7 14h4" />
              </svg>
            }
          />
          <StatTile
            label="Tests Completed"
            value={runsLoading ? '--' : runStats.totalTests}
            accent={runStats.failedRuns > 0 ? 'red' : 'gray'}
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 10l4 4 8-8" />
              </svg>
            }
          />
        </div>
      )}

      {/* Start new discovery run CTA */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`${basePath}/scan/new`)}
          className="w-full sm:w-auto flex items-center gap-4 p-5 text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all group"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="10" cy="10" r="7" />
              <path d="M10 7v6M7 10h6" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              New Discovery Run
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Scan a URL to discover pages, generate tests, and find issues
            </p>
          </div>
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Recent Runs + Status Breakdown (side by side on large screens)    */}
      {/* ----------------------------------------------------------------- */}
      {!isLoading && !error && totalProducts > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <RecentRunsSection runs={firstProductRuns} basePath={basePath} isLoading={runsLoading} />
          {!runsLoading && firstProductRuns.length > 0 && (
            <RunStatusBreakdown runs={firstProductRuns} />
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 py-4 px-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          Failed to load products: {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && products.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <svg
            className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="10" width="36" height="28" rx="3" />
            <path d="M6 18h36" />
            <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="18" cy="14" r="1.5" fill="currentColor" stroke="none" />
            <path d="M16 30h16M20 26h8" />
          </svg>
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            No products yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm mx-auto">
            Start a discovery run to scan your web application, generate tests, and track issues
            automatically.
          </p>
        </div>
      )}

      {/* Products list */}
      {products.length > 0 && (
        <div className="space-y-8">
          {products.map((product: ProductSummaryResponse) => (
            <ProductSection key={product.id} product={product} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}
