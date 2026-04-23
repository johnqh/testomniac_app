import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useEntityProjects, useProjectApps } from '@sudobility/testomniac_client';
import type { ProjectSummaryResponse, AppResponse } from '@sudobility/testomniac_types';
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

/** A single app card with links to its dashboard sections. */
function AppCard({ app, basePath }: { app: AppResponse; basePath: string }) {
  const { navigate } = useLocalizedNavigate();
  const appBasePath = `${basePath}/apps/${app.id}`;

  const sections = [
    { label: 'Scans', description: 'View scan history', path: `${appBasePath}/scans` },
    { label: 'Test Cases', description: 'Generated tests', path: `${appBasePath}/test-cases` },
    { label: 'Test Runs', description: 'Execution results', path: `${appBasePath}/test-runs` },
    { label: 'Issues', description: 'Detected issues', path: `${appBasePath}/issues` },
    { label: 'Pages', description: 'Discovered pages', path: `${appBasePath}/pages` },
    { label: 'Graph', description: 'Site map view', path: `${appBasePath}/graph` },
    { label: 'Components', description: 'UI components', path: `${appBasePath}/components` },
    { label: 'Personas', description: 'AI-generated personas', path: `${appBasePath}/personas` },
  ];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* App header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          {app.name}
        </h3>
        {app.normalizedBaseUrl && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {app.normalizedBaseUrl}
          </p>
        )}
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

/** Lists apps for a single project, with lazy loading. */
function ProjectSection({
  project,
  basePath,
}: {
  project: ProjectSummaryResponse;
  basePath: string;
}) {
  const { networkClient, token } = useApi();

  const { apps, isLoading, error } = useProjectApps({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    projectId: project.id,
    token: token ?? '',
    enabled: !!token,
  });

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {project.name}
      </h2>

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading apps...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 py-2">
          Failed to load apps: {error}
        </div>
      )}

      {!isLoading && !error && apps.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-center">
          No apps in this project yet.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {apps.map((app: AppResponse) => (
          <AppCard key={app.id} app={app} basePath={basePath} />
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

  const { projects, isLoading, error } = useEntityProjects({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug: entitySlug ?? '',
    token: token ?? '',
    enabled: !!token && !!entitySlug,
  });

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Manage your web application tests and scan results.
      </p>

      {/* Start new scan CTA */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`${basePath}/scan/new`)}
          className="w-full sm:w-auto p-6 text-left rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
        >
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Start New Scan
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter a URL to discover pages, run tests, and find issues
          </p>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading projects...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 py-4 px-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          Failed to load projects: {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && projects.length === 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No projects yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Start a scan to automatically create your first project and discover your application.
          </p>
        </div>
      )}

      {/* Projects list */}
      {projects.length > 0 && (
        <div className="space-y-8">
          {projects.map((project: ProjectSummaryResponse) => (
            <ProjectSection key={project.id} project={project} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}
