import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useEntityProducts, useProductEnvironments } from '@sudobility/testomniac_client';
import type { ProductSummaryResponse, TestEnvironmentResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';

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

  return (
    <div className="p-6 max-w-5xl">
      <SEOHead title="Dashboard" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Manage your web application tests and discovery run results.
      </p>

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
