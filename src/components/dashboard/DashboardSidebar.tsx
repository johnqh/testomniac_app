import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { useLocation } from 'react-router-dom';

interface DashboardSidebarProps {
  entitySlug: string;
}

export function DashboardSidebar({ entitySlug }: DashboardSidebarProps) {
  const { navigate } = useLocalizedNavigate();
  const location = useLocation();
  const basePath = `/dashboard/${entitySlug}`;

  function isActive(path: string) {
    // Check if current path starts with or equals the target
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    const currentWithoutLang = location.pathname.slice(langPrefix.length - 1);
    return currentWithoutLang === path || currentWithoutLang.startsWith(path + '/');
  }

  function isExactActive(path: string) {
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    const currentWithoutLang = location.pathname.slice(langPrefix.length - 1);
    return currentWithoutLang === path || currentWithoutLang === path + '/';
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Workspace header */}
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

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Overview */}
        <NavItem
          label="Overview"
          active={isExactActive(basePath)}
          onClick={() => navigate(basePath)}
        />

        {/* Projects section */}
        <div className="pt-3 pb-1">
          <div className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Projects
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">
          Projects will appear here after scanning.
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-gray-200 dark:border-gray-700" />

        {/* Management links */}
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
      </nav>
    </div>
  );
}

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
