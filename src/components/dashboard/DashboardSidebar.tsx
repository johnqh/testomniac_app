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
    return location.pathname.includes(path);
  }

  const navItems = [
    { label: 'Overview', path: basePath, exact: true },
    { label: 'Start Scan', path: `${basePath}/scan/new` },
    { label: 'Settings', path: `${basePath}/settings` },
    { label: 'Members', path: `${basePath}/members` },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {entitySlug}
        </h2>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = item.exact
            ? location.pathname.endsWith(basePath) || location.pathname.endsWith(basePath + '/')
            : isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
