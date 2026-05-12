import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useRun,
  useRunNavigationMap,
  useRunPages,
  useRunPersonas,
  useRunScaffolds,
  useRunStructure,
  useRunSummary,
  useRunTestInteractions,
  useRunTestRuns,
} from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';

export default function RunDetailsPage() {
  const { entitySlug, runId } = useParams<{ entitySlug: string; runId: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const basePath = `/dashboard/${entitySlug}/runs/${runId}`;

  const queryConfig = {
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  };

  const { run, isLoading, error } = useRun(queryConfig);
  const { summary } = useRunSummary(queryConfig);
  const { navigationMap } = useRunNavigationMap(queryConfig);
  const { structure } = useRunStructure(queryConfig);
  const { pages } = useRunPages(queryConfig);
  const { testInteractions } = useRunTestInteractions(queryConfig);
  const { testRuns } = useRunTestRuns(queryConfig);
  const { personas } = useRunPersonas(queryConfig);
  const { scaffolds } = useRunScaffolds(queryConfig);

  if (error) {
    return (
      <div className="p-6">
        <div className="py-8 text-center text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (isLoading || !run) {
    return (
      <div className="p-6">
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading run...</div>
      </div>
    );
  }

  const expertiseEntries = Object.entries(summary?.expertiseSummary ?? {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const surfacesCount = structure?.surfaces.length ?? 0;
  const interactionRunsCount =
    structure?.surfaces.reduce(
      (total, surface) =>
        total +
        surface.testInteractions.reduce(
          (surfaceTotal, testInteraction) => surfaceTotal + testInteraction.interactionRuns.length,
          0
        ),
      0
    ) ?? 0;

  const subPages = [
    {
      label: 'Coverage',
      path: `${basePath}/test-runs`,
      count: interactionRunsCount || testRuns.length,
    },
    {
      label: 'Test Interactions',
      path: `${basePath}/test-interactions`,
      count: testInteractions.length,
    },
    { label: 'Findings', path: `${basePath}/issues`, count: summary?.totalFindings ?? 0 },
    { label: 'Pages', path: `${basePath}/pages`, count: pages.length },
    {
      label: 'Site Map',
      path: `${basePath}/map`,
      count: navigationMap?.discoveredPages.length ?? null,
    },
    { label: 'Scaffolds', path: `${basePath}/scaffolds`, count: scaffolds.length },
    { label: 'Personas', path: `${basePath}/personas`, count: personas.length },
  ];

  return (
    <div className="p-6">
      <SEOHead title={`Run #${runId}`} description="" noIndex />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Run #{runId}</h1>
        <StatusBadge status={run.status} size="md" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {summary?.pagesFound ?? run.pagesFound ?? pages.length}
          </div>
          <div className="text-xs text-gray-500">Pages</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{surfacesCount}</div>
          <div className="text-xs text-gray-500">Surfaces</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {interactionRunsCount ||
              summary?.testRunsCompleted ||
              run.testRunsCompleted ||
              testRuns.length}
          </div>
          <div className="text-xs text-gray-500">Case Runs</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">{summary?.totalFindings ?? 0}</div>
          <div className="text-xs text-gray-500">Findings</div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Navigation Map
          </h2>
          <div className="space-y-2">
            {(navigationMap?.discoveredPages ?? []).slice(0, 12).map(page => {
              const visit = navigationMap?.pageVisits.find(
                item => item.relativePath === page.relativePath
              );
              return (
                <div
                  key={page.id}
                  className="rounded-md border border-gray-100 px-3 py-2 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-gray-900 dark:text-gray-100">
                      {page.relativePath}
                    </span>
                    <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400">
                      {visit?.status ?? 'discovered'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    from {page.sourcePagePath || 'root'}
                    {page.sourceLabel ? ` via ${page.sourceLabel}` : ''}
                  </div>
                </div>
              );
            })}
            {(navigationMap?.discoveredPages.length ?? 0) === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No navigation map yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Coverage Tree
          </h2>
          {structure ? (
            <div className="space-y-3">
              <div className="rounded-md border border-gray-100 px-3 py-2 dark:border-gray-800">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {structure.bundle.title}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Bundle run #{structure.bundleRun.id} · {structure.bundleRun.status}
                </div>
              </div>
              {structure.surfaces.slice(0, 8).map(surface => (
                <div
                  key={surface.id}
                  className="rounded-md border border-gray-100 px-3 py-2 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {surface.title}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {surface.surfaceRuns.map(run => run.status).join(', ') || 'pending'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {surface.testInteractions.length} element
                    {surface.testInteractions.length === 1 ? '' : 's'}
                  </div>
                  <div className="mt-2 space-y-1">
                    {surface.testInteractions.slice(0, 3).map(testInteraction => (
                      <div
                        key={testInteraction.id}
                        className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {testInteraction.title}
                        {testInteraction.dependencyTestInteractionId
                          ? ` · depends on #${testInteraction.dependencyTestInteractionId}`
                          : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No coverage structure yet.
            </div>
          )}
        </div>
      </div>

      {summary?.aiSummary && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Summary
          </h2>
          <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">{summary.aiSummary}</p>
        </div>
      )}

      {expertiseEntries.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Findings by Expertise
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expertiseEntries.map(([name, counts]) => (
              <div
                key={name}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                  {name}
                </div>
                <div className="mt-3 flex gap-4 text-xs">
                  <span className="text-red-600 dark:text-red-400">
                    {counts.errors} error{counts.errors === 1 ? '' : 's'}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {counts.warnings} warning{counts.warnings === 1 ? '' : 's'}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{counts.findings} total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary?.recentFindings?.length ? (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Findings
          </h2>
          <div className="space-y-3">
            {summary.recentFindings.slice(0, 6).map(finding => (
              <div
                key={finding.id}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {finding.title}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {finding.description}
                    </div>
                  </div>
                  <div className="shrink-0 text-[11px] capitalize text-gray-500 dark:text-gray-400">
                    {finding.expertise ?? finding.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Explore Results
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subPages.map(page => (
          <button
            key={page.path}
            onClick={() => navigate(page.path)}
            className="rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{page.label}</div>
            {page.count !== null && (
              <div className="mt-1 text-xs text-gray-500">{page.count} items</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
