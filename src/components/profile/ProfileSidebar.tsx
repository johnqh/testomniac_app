import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';

interface MenuItem {
  label: string;
  path: string;
  icon: React.FC;
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const AccountIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" />
  </svg>
);

const WorkspacesIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

const MembersIcon = () => (
  <svg {...iconProps}>
    <circle cx="6" cy="5" r="2.5" />
    <circle cx="11" cy="6" r="2" />
    <path d="M1 14c0-2 2-4 5-4s5 2 5 4" />
    <path d="M11 14c0-1.5 1-3 3-3" />
  </svg>
);

const InvitationsIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="4" width="12" height="8" rx="1" />
    <path d="M2 5l6 4 6-4" />
  </svg>
);

const ApiKeysIcon = () => (
  <svg {...iconProps}>
    <path d="M10 5a3 3 0 1 1-1.5 5.6L6 13H4.5v1.5H3V13H2v-1.5l4.4-4.4A3 3 0 0 1 10 5z" />
    <circle cx="10.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const MENU_ITEMS: MenuItem[] = [
  { label: 'Account', path: 'account', icon: AccountIcon },
  { label: 'Workspaces', path: 'workspaces', icon: WorkspacesIcon },
  { label: 'Members', path: 'members', icon: MembersIcon },
  { label: 'Invitations', path: 'invitations', icon: InvitationsIcon },
  { label: 'API Keys', path: 'api-keys', icon: ApiKeysIcon },
];

export function ProfileSidebar() {
  const { navigate } = useLocalizedNavigate();
  const location = useLocation();

  const currentPath = useMemo(() => {
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    return location.pathname.slice(langPrefix.length - 1);
  }, [location.pathname]);

  const isActive = (menuPath: string) => {
    const full = `/profile/${menuPath}`;
    return currentPath === full || currentPath.startsWith(full + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {MENU_ITEMS.map(item => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(`/profile/${item.path}`)}
              className={[
                'group relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-all duration-150',
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-900 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
              <span
                className={[
                  'flex-shrink-0 transition-colors duration-150',
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                ].join(' ')}
              >
                <Icon />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
