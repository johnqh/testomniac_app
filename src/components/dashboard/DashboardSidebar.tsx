import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useEntityProjects,
  useProjectApps,
  useAppPages,
  usePageStates,
} from '@sudobility/testomniac_client';
import type {
  ProjectSummaryResponse,
  AppResponse,
  PageResponse,
  PageStateResponse,
} from '@sudobility/testomniac_types';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../../config/constants';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DashboardSidebarProps {
  entitySlug: string;
}

// ---------------------------------------------------------------------------
// Chevron icons
// ---------------------------------------------------------------------------

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingDots() {
  return <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">Loading...</span>;
}

// ---------------------------------------------------------------------------
// Sub-components for each tree level
// ---------------------------------------------------------------------------

/** Displays page states (desktop/mobile) under a page node. */
function PageStatesNode({
  page,
  appBasePath,
  isActive,
}: {
  page: PageResponse;
  appBasePath: string;
  isActive: (path: string) => boolean;
}) {
  const { networkClient, token } = useApi();
  const { pageStates, isLoading } = usePageStates({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageId: page.id,
    token: token ?? '',
    enabled: !!token,
  });

  if (isLoading) return <LoadingDots />;
  if (pageStates.length === 0) {
    return (
      <div className="pl-14 text-xs text-gray-400 dark:text-gray-500 py-1">No states captured</div>
    );
  }

  return (
    <>
      {pageStates.map((ps: PageStateResponse) => (
        <TreeLeaf
          key={ps.id}
          label={ps.sizeClass}
          path={`${appBasePath}/pages/${page.id}/states/${ps.id}`}
          isActive={isActive}
          indent="pl-14"
        />
      ))}
      <TreeLeaf
        label="Page Graph"
        path={`${appBasePath}/pages/${page.id}/graph`}
        isActive={isActive}
        indent="pl-14"
      />
    </>
  );
}

/** Expandable list of pages under an app's "Pages" section. */
function PagesSection({
  appId,
  appBasePath,
  expandedNodes,
  toggleNode,
  isActive,
}: {
  appId: number;
  appBasePath: string;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  isActive: (path: string) => boolean;
}) {
  const { networkClient, token } = useApi();
  const { pages, isLoading } = useAppPages({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId,
    token: token ?? '',
    enabled: !!token,
  });

  if (isLoading) return <LoadingDots />;
  if (pages.length === 0) {
    return (
      <div className="pl-12 text-xs text-gray-400 dark:text-gray-500 py-1">No pages found</div>
    );
  }

  return (
    <>
      {pages.map((page: PageResponse) => {
        const pageNodeId = `page-${page.id}`;
        const isExpanded = expandedNodes.has(pageNodeId);
        const pathSegment = new URL(page.url, 'https://placeholder').pathname;

        return (
          <div key={page.id}>
            <TreeExpandable
              label={pathSegment}
              isExpanded={isExpanded}
              onToggle={() => toggleNode(pageNodeId)}
              indent="pl-12"
              isActive={isActive(`${appBasePath}/pages/${page.id}`)}
            />
            {isExpanded && (
              <PageStatesNode page={page} appBasePath={appBasePath} isActive={isActive} />
            )}
          </div>
        );
      })}
    </>
  );
}

/** Expandable app node showing data sections (Scans, Test Cases, etc.). */
function AppNode({
  app,
  basePath,
  expandedNodes,
  toggleNode,
  isActive,
}: {
  app: AppResponse;
  basePath: string;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  isActive: (path: string) => boolean;
}) {
  const appNodeId = `app-${app.id}`;
  const isExpanded = expandedNodes.has(appNodeId);
  const appBasePath = `${basePath}/apps/${app.id}`;
  const pagesNodeId = `app-${app.id}-pages`;
  const pagesExpanded = expandedNodes.has(pagesNodeId);

  // Display the normalizedBaseUrl (domain), falling back to name
  const displayName = app.normalizedBaseUrl || app.name;

  return (
    <div>
      <TreeExpandable
        label={displayName}
        isExpanded={isExpanded}
        onToggle={() => toggleNode(appNodeId)}
        indent="pl-8"
        isActive={isActive(appBasePath)}
      />
      {isExpanded && (
        <div>
          <TreeLeaf
            label="Scans"
            path={`${appBasePath}/scans`}
            isActive={isActive}
            indent="pl-10"
          />
          <TreeLeaf
            label="Test Cases"
            path={`${appBasePath}/test-cases`}
            isActive={isActive}
            indent="pl-10"
          />
          <TreeLeaf
            label="Test Runs"
            path={`${appBasePath}/test-runs`}
            isActive={isActive}
            indent="pl-10"
          />
          <TreeLeaf
            label="Issues"
            path={`${appBasePath}/issues`}
            isActive={isActive}
            indent="pl-10"
          />

          {/* Pages - expandable sub-section */}
          <TreeExpandable
            label="Pages"
            isExpanded={pagesExpanded}
            onToggle={() => toggleNode(pagesNodeId)}
            indent="pl-10"
            isActive={isActive(`${appBasePath}/pages`)}
          />
          {pagesExpanded && (
            <PagesSection
              appId={app.id}
              appBasePath={appBasePath}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              isActive={isActive}
            />
          )}

          <TreeLeaf
            label="Graph"
            path={`${appBasePath}/graph`}
            isActive={isActive}
            indent="pl-10"
          />
          <TreeLeaf
            label="Components"
            path={`${appBasePath}/components`}
            isActive={isActive}
            indent="pl-10"
          />
          <TreeLeaf
            label="Personas"
            path={`${appBasePath}/personas`}
            isActive={isActive}
            indent="pl-10"
          />
        </div>
      )}
    </div>
  );
}

/** Apps list under a project, fetched lazily when the project is expanded. */
function ProjectAppsNode({
  projectId,
  basePath,
  expandedNodes,
  toggleNode,
  isActive,
}: {
  projectId: number;
  basePath: string;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  isActive: (path: string) => boolean;
}) {
  const { networkClient, token } = useApi();
  const { apps, isLoading } = useProjectApps({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    projectId,
    token: token ?? '',
    enabled: !!token,
  });

  if (isLoading) return <LoadingDots />;
  if (apps.length === 0) {
    return <div className="pl-8 text-xs text-gray-400 dark:text-gray-500 py-1">No apps found</div>;
  }

  return (
    <>
      {apps.map((app: AppResponse) => (
        <AppNode
          key={app.id}
          app={app}
          basePath={basePath}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
          isActive={isActive}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Generic tree primitives
// ---------------------------------------------------------------------------

/** A leaf node that navigates on click. */
function TreeLeaf({
  label,
  path,
  isActive,
  indent,
}: {
  label: string;
  path: string;
  isActive: (path: string) => boolean;
  indent: string;
}) {
  const { navigate } = useLocalizedNavigate();
  const active = isActive(path);

  return (
    <button
      onClick={() => navigate(path)}
      className={`w-full text-left ${indent} pr-3 py-1.5 text-sm truncate transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      title={label}
    >
      {label}
    </button>
  );
}

/** An expandable node with a chevron indicator. */
function TreeExpandable({
  label,
  isExpanded,
  onToggle,
  indent,
  isActive,
}: {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  indent: string;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left ${indent} pr-3 py-1.5 text-sm flex items-center gap-1 truncate transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      title={label}
    >
      {isExpanded ? (
        <ChevronDown className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
      ) : (
        <ChevronRight className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

/** A simple nav item (no chevron). */
function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main sidebar component
// ---------------------------------------------------------------------------

export function DashboardSidebar({ entitySlug }: DashboardSidebarProps) {
  const { navigate } = useLocalizedNavigate();
  const location = useLocation();
  const { networkClient, token } = useApi();
  const basePath = `/dashboard/${entitySlug}`;

  // Track which nodes are expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Route matching helpers
  const currentWithoutLang = useMemo(() => {
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    return location.pathname.slice(langPrefix.length - 1);
  }, [location.pathname]);

  const isActive = useCallback(
    (path: string) => currentWithoutLang === path || currentWithoutLang.startsWith(path + '/'),
    [currentWithoutLang]
  );

  const isExactActive = useCallback(
    (path: string) => currentWithoutLang === path || currentWithoutLang === path + '/',
    [currentWithoutLang]
  );

  // Fetch projects for this entity
  const { projects, isLoading: projectsLoading } = useEntityProjects({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug,
    token: token ?? '',
    enabled: !!token && !!entitySlug,
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Entity header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {entitySlug}
        </h2>
      </div>

      {/* Start scan button */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate(`${basePath}/scan/new`)}
          className="w-full py-2 px-3 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          + Start New Scan
        </button>
      </div>

      {/* Scrollable tree navigation */}
      <nav className="flex-1 overflow-y-auto">
        {/* Overview */}
        <div className="p-2 space-y-0.5">
          <NavItem
            label="Overview"
            active={isExactActive(basePath)}
            onClick={() => navigate(basePath)}
          />
        </div>

        {/* Projects section header */}
        <div className="px-5 pt-4 pb-1">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Projects
          </div>
        </div>

        {/* Projects tree */}
        <div className="pb-2">
          {projectsLoading && (
            <div className="px-5 py-2">
              <LoadingDots />
            </div>
          )}

          {!projectsLoading && projects.length === 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 px-5 py-2">
              Projects will appear here after scanning.
            </div>
          )}

          {projects.map((project: ProjectSummaryResponse) => {
            const projectNodeId = `project-${project.id}`;
            const isExpanded = expandedNodes.has(projectNodeId);

            return (
              <div key={project.id}>
                <TreeExpandable
                  label={project.name}
                  isExpanded={isExpanded}
                  onToggle={() => toggleNode(projectNodeId)}
                  indent="pl-4"
                  isActive={false}
                />
                {isExpanded && (
                  <ProjectAppsNode
                    projectId={project.id}
                    basePath={basePath}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                    isActive={isActive}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-gray-200 dark:border-gray-700" />

        {/* Management links */}
        <div className="p-2 space-y-0.5">
          <NavItem
            label="Workspaces"
            active={isActive(`${basePath}/workspaces`)}
            onClick={() => navigate(`${basePath}/workspaces`)}
          />
          <NavItem
            label="Members"
            active={isActive(`${basePath}/members`)}
            onClick={() => navigate(`${basePath}/members`)}
          />
          <NavItem
            label="Invitations"
            active={isActive(`${basePath}/invitations`)}
            onClick={() => navigate(`${basePath}/invitations`)}
          />
          <NavItem
            label="Settings"
            active={isActive(`${basePath}/settings`)}
            onClick={() => navigate(`${basePath}/settings`)}
          />
        </div>
      </nav>
    </div>
  );
}
