import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@sudobility/components';
import { useEntityProjects, useProjectApps } from '@sudobility/testomniac_client';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../../config/constants';

interface DashboardSidebarProps {
  entitySlug: string;
}

const MENU_ITEMS = [
  { label: 'Bundles', path: 'bundles' },
  { label: 'Suites', path: 'test-suites' },
  { label: 'Test Cases', path: 'test-cases' },
  { label: 'Runs', path: 'runs' },
  { label: 'Issues', path: 'issues' },
  { label: 'Schedules', path: 'schedules' },
  { label: 'Settings', path: 'settings' },
];

export function DashboardSidebar({ entitySlug }: DashboardSidebarProps) {
  const { appId: routeAppId } = useParams<{ appId: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const location = useLocation();

  const { projects, isLoading: projectsLoading } = useEntityProjects({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug,
    token: token ?? '',
    enabled: !!token,
  });

  // Auto-select project if only one exists
  const selectedProjectId = useMemo(() => {
    if (projects.length === 1) return String(projects[0].id);
    return null;
  }, [projects]);

  const { apps, isLoading: appsLoading } = useProjectApps({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    projectId: Number(selectedProjectId),
    token: token ?? '',
    enabled: !!selectedProjectId && !!token,
  });

  // Auto-select app if only one exists and no app in route
  useEffect(() => {
    if (apps.length === 1 && !routeAppId) {
      navigate(`/dashboard/${entitySlug}/apps/${apps[0].id}/bundles`);
    }
  }, [apps, routeAppId, entitySlug, navigate]);

  const handleProjectChange = (value: string) => {
    if (value === 'new') {
      navigate(`/dashboard/${entitySlug}/projects/new`);
    }
  };

  const handleAppChange = (value: string) => {
    if (value === 'new') {
      navigate(`/dashboard/${entitySlug}/apps/new`);
      return;
    }
    navigate(`/dashboard/${entitySlug}/apps/${value}/bundles`);
  };

  // Active path detection
  const currentPath = useMemo(() => {
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    return location.pathname.slice(langPrefix.length - 1);
  }, [location.pathname]);

  const appBasePath = `/dashboard/${entitySlug}/apps/${routeAppId}`;

  const isActive = (menuPath: string) => {
    const full = `${appBasePath}/${menuPath}`;
    return currentPath === full || currentPath.startsWith(full + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Project & App Selectors */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
            Project
          </label>
          <Select value={selectedProjectId ?? undefined} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={projectsLoading ? 'Loading...' : 'Select project'} />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.title}
                </SelectItem>
              ))}
              <SelectItem value="new">+ Create New...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
            App
          </label>
          <Select
            value={routeAppId ?? undefined}
            onValueChange={handleAppChange}
            disabled={!selectedProjectId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={appsLoading ? 'Loading...' : 'Select app'} />
            </SelectTrigger>
            <SelectContent>
              {apps.map(a => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.title}
                </SelectItem>
              ))}
              <SelectItem value="new">+ Create New...</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Menu */}
      {routeAppId && (
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {MENU_ITEMS.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(`${appBasePath}/${item.path}`)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {!routeAppId && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Select a project and app to get started
          </p>
        </div>
      )}
    </div>
  );
}
