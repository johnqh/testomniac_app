import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useEntityProducts, useProductRunners } from '@sudobility/testomniac_client';
import type { ProductSummaryResponse, RunnerResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Card linking to one of an app's data sections. */
function SectionLink({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
    >
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {label}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
    </button>
  );
}

/** A single runner card with links to its dashboard sections. */
function RunnerCard({ runner, basePath }: { runner: RunnerResponse; basePath: string }) {
  const { navigate } = useLocalizedNavigate();
  const runnerBasePath = `${basePath}/runners/${runner.id}`;

  const sections = [
    {
      label: 'Test Suites',
      description: 'Test suite hierarchy',
      path: `${runnerBasePath}/test-suites`,
    },
    { label: 'Test Runs', description: 'Execution results', path: `${runnerBasePath}/test-runs` },
    { label: 'Findings', description: 'Errors and warnings', path: `${runnerBasePath}/findings` },
    { label: 'Settings', description: 'Runner settings', path: `${runnerBasePath}/settings` },
  ];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Runner header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          {runner.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{runner.type}</p>
      </div>

      {/* Section links grid */}
      <div className="p-3 grid grid-cols-2 gap-1">
        {sections.map(section => (
          <SectionLink
            key={section.label}
            label={section.label}
            description={section.description}
            onClick={() => navigate(section.path)}
          />
        ))}
      </div>
    </div>
  );
}

/** Lists runners for a single product, with lazy loading. */
function ProductSection({
  product,
  basePath,
}: {
  product: ProductSummaryResponse;
  basePath: string;
}) {
  const { networkClient, token } = useApi();

  const { runners, isLoading, error } = useProductRunners({
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
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading runners...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 py-2">
          Failed to load runners: {error}
        </div>
      )}

      {!isLoading && !error && runners.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-center">
          No runners in this product yet.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {runners.map((runner: RunnerResponse) => (
          <RunnerCard key={runner.id} runner={runner} basePath={basePath} />
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
          className="w-full sm:w-auto p-6 text-left rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
        >
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Start Discovery Run
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter a URL to discover pages, run tests, and find issues
          </p>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading products...
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
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No products yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Start a discovery run to automatically create your first product and discover your
            application.
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
