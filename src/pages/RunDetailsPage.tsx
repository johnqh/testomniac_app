import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useRun,
  useRunNavigationMap,
  useRunStructure,
  useRunSummary,
} from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { formatDurationFromTimestamps } from '@sudobility/testomniac_lib';
import { formatDateTime } from '../utils/formatDateTime';

type SectionId = 'coverage' | 'findings';

/* ---------- Skeleton placeholders ---------- */

function SkeletonHeader() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-7 w-40 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-4 w-72 rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="mb-2 h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 w-full rounded bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

/* ---------- Main component ---------- */

export default function RunDetailsPage() {
  const { runId } = useParams<{ entitySlug: string; runId: string }>();
  const { networkClient, token } = useApi();
  const [activeSection, setActiveSection] = useState<SectionId>('coverage');

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

  if (error) {
    return (
      <div className="p-6">
        <div className="py-8 text-center text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (isLoading || !run) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <SkeletonHeader />
        <SkeletonStatCards />
        <SkeletonSection />
      </div>
    );
  }

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

  const totalFindings = summary?.totalFindings ?? 0;
  const hasErrors = Object.values(summary?.expertiseSummary ?? {}).some(c => c.errors > 0);

  const expertiseEntries = Object.entries(summary?.expertiseSummary ?? {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const duration = formatDurationFromTimestamps(run.startedAt, run.completedAt);

  const pagesCount = summary?.pagesFound ?? run.pagesFound ?? 0;
  const testRunsCount =
    interactionRunsCount || summary?.testRunsCompleted || run.testRunsCompleted || 0;

  const discoveredPages = navigationMap?.discoveredPages ?? [];
  const pageVisits = navigationMap?.pageVisits ?? [];

  const sections: { id: SectionId; label: string; count: number | null }[] = [
    {
      id: 'coverage',
      label: 'Coverage',
      count:
        (discoveredPages.length || 0) + surfacesCount > 0
          ? (discoveredPages.length || 0) + surfacesCount
          : null,
    },
    {
      id: 'findings',
      label: 'Findings',
      count: totalFindings > 0 ? totalFindings : null,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <SEOHead title={`Run #${runId}`} description="" noIndex />

      {/* ── Header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Run #{runId}</h1>
          <StatusBadge status={run.status} size="md" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          {run.scanUrl && <span className="truncate">{run.scanUrl}</span>}
          {run.startedAt && <span>{formatDateTime(run.startedAt)}</span>}
          {duration && <span>{duration}</span>}
        </div>
      </div>

      <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

      {/* ── AI Summary ── */}
      {summary?.aiSummary && (
        <div className="mb-6">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {summary.aiSummary}
          </p>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-100 border-l-blue-500 bg-white p-5 dark:border-gray-800 dark:border-l-blue-400 dark:bg-gray-900">
          <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {pagesCount}
          </div>
          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Pages</div>
        </div>
        <div className="rounded-lg border border-gray-100 border-l-indigo-500 bg-white p-5 dark:border-gray-800 dark:border-l-indigo-400 dark:bg-gray-900">
          <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {surfacesCount}
          </div>
          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Surfaces</div>
        </div>
        <div className="rounded-lg border border-gray-100 border-l-emerald-500 bg-white p-5 dark:border-gray-800 dark:border-l-emerald-400 dark:bg-gray-900">
          <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {testRunsCount}
          </div>
          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Test Runs</div>
        </div>
        <div
          className={`rounded-lg border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 ${
            hasErrors
              ? 'border-l-red-500 dark:border-l-red-400'
              : 'border-l-amber-500 dark:border-l-amber-400'
          }`}
        >
          <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {totalFindings}
          </div>
          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Findings</div>
        </div>
      </div>

      {/* ── Section Switcher ── */}
      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {section.label}
            {section.count !== null && (
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                {section.count}
              </span>
            )}
            {activeSection === section.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900 dark:bg-gray-100" />
            )}
          </button>
        ))}
      </div>

      {/* ── Coverage Section ── */}
      {activeSection === 'coverage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Navigation Map */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Navigation Map
                {discoveredPages.length > 0 && (
                  <span className="ml-1.5 normal-case tracking-normal text-gray-400 dark:text-gray-500">
                    {discoveredPages.length}
                  </span>
                )}
              </h3>
              {discoveredPages.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                  {discoveredPages.slice(0, 15).map((page, index) => {
                    const visit = pageVisits.find(item => item.relativePath === page.relativePath);
                    const visited = !!visit;
                    return (
                      <div
                        key={page.id}
                        className={`flex items-center gap-3 px-3 py-2 ${
                          index % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-gray-50/50 dark:bg-gray-800/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                            visited
                              ? 'bg-emerald-500 dark:bg-emerald-400'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                          {page.relativePath}
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                          {visited ? visit.status : 'discovered'}
                        </span>
                      </div>
                    );
                  })}
                  {discoveredPages.length > 15 && (
                    <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                      +{discoveredPages.length - 15} more
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">No navigation map yet.</p>
              )}
            </div>

            {/* Coverage Tree */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Coverage Tree
                {surfacesCount > 0 && (
                  <span className="ml-1.5 normal-case tracking-normal text-gray-400 dark:text-gray-500">
                    {surfacesCount}
                  </span>
                )}
              </h3>
              {structure ? (
                <div className="space-y-0">
                  {/* Bundle root */}
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {structure.bundle.title}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {structure.bundleRun.status}
                    </span>
                  </div>

                  {/* Surfaces */}
                  {structure.surfaces.slice(0, 10).map(surface => {
                    const surfaceStatus =
                      surface.surfaceRuns.map(r => r.status).join(', ') || 'pending';
                    const statusColor =
                      surfaceStatus === 'completed'
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : surfaceStatus === 'running'
                          ? 'bg-blue-500 dark:bg-blue-400'
                          : surfaceStatus === 'failed'
                            ? 'bg-red-500 dark:bg-red-400'
                            : 'bg-gray-300 dark:bg-gray-600';

                    return (
                      <div
                        key={surface.id}
                        className="ml-3 border-l border-gray-200 pl-4 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2 py-1.5">
                          <span
                            className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusColor}`}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {surface.title}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {surface.testInteractions.length} element
                            {surface.testInteractions.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        {/* Test interactions */}
                        {surface.testInteractions.slice(0, 4).map(ti => {
                          const tiStatus =
                            ti.interactionRuns.length > 0
                              ? ti.interactionRuns[ti.interactionRuns.length - 1].status
                              : 'pending';
                          const tiColor =
                            tiStatus === 'completed'
                              ? 'bg-emerald-500 dark:bg-emerald-400'
                              : tiStatus === 'running'
                                ? 'bg-blue-500 dark:bg-blue-400'
                                : tiStatus === 'failed'
                                  ? 'bg-red-500 dark:bg-red-400'
                                  : 'bg-gray-300 dark:bg-gray-600';

                          return (
                            <div
                              key={ti.id}
                              className="ml-4 flex items-center gap-2 border-l border-gray-100 py-1 pl-4 dark:border-gray-800"
                            >
                              <span
                                className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tiColor}`}
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {ti.title}
                              </span>
                            </div>
                          );
                        })}
                        {surface.testInteractions.length > 4 && (
                          <div className="ml-4 border-l border-gray-100 py-1 pl-4 text-[11px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
                            +{surface.testInteractions.length - 4} more
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {structure.surfaces.length > 10 && (
                    <div className="ml-3 border-l border-gray-200 py-1.5 pl-4 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
                      +{structure.surfaces.length - 10} more surfaces
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No coverage structure yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Findings Section ── */}
      {activeSection === 'findings' && (
        <div className="space-y-6">
          {/* Expertise Breakdown */}
          {expertiseEntries.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                By Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {expertiseEntries.map(([name, counts]) => (
                  <div
                    key={name}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <span className="capitalize text-gray-700 dark:text-gray-300">{name}</span>
                    {counts.errors > 0 && (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        {counts.errors}
                      </span>
                    )}
                    {counts.warnings > 0 && (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {counts.warnings}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Findings */}
          {summary?.recentFindings && summary.recentFindings.length > 0 ? (
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Recent Findings
                <span className="ml-1.5 normal-case tracking-normal text-gray-400 dark:text-gray-500">
                  {summary.recentFindings.length}
                </span>
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                {summary.recentFindings.slice(0, 8).map((finding, index) => (
                  <div
                    key={finding.id}
                    className={`flex items-start gap-3 px-3 py-2.5 ${
                      index % 2 === 0
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-gray-50/50 dark:bg-gray-800/30'
                    }`}
                  >
                    <span
                      className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                        finding.type === 'error'
                          ? 'bg-red-500 dark:bg-red-400'
                          : finding.type === 'warning'
                            ? 'bg-amber-500 dark:bg-amber-400'
                            : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {finding.title}
                      </div>
                      {finding.description && (
                        <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {finding.description}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] capitalize text-gray-400 dark:text-gray-500">
                      {finding.expertise ?? finding.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No findings recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
