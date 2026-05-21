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
import { useEntityProducts, useProductEnvironments } from '@sudobility/testomniac_client';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../../config/constants';

interface DashboardSidebarProps {
  entitySlug: string;
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (16x16, stroke-based, currentColor)              */
/* ------------------------------------------------------------------ */

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

/** 4-square grid */
const BundlesIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

/** Document stack */
const PagesIcon = () => (
  <svg {...iconProps}>
    <path d="M4 2h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
    <path d="M10 2v3h3" />
    <path d="M6 9h4" />
    <path d="M6 11.5h3" />
  </svg>
);

/** Layers / surfaces */
const SurfacesIcon = () => (
  <svg {...iconProps}>
    <path d="M2 8l6-4 6 4-6 4-6-4z" />
    <path d="M2 10.5l6 4 6-4" />
    <path d="M2 13l6 4 6-4" />
  </svg>
);

/** Pointer click / interaction */
const InteractionsIcon = () => (
  <svg {...iconProps}>
    <path d="M5 2v8l2.5-2.5L10 12l1.5-1-2.5-4.5H13L5 2z" />
  </svg>
);

/** Branching path / scenario */
const ScenariosIcon = () => (
  <svg {...iconProps}>
    <circle cx="4" cy="4" r="1.5" />
    <circle cx="12" cy="4" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="M5.5 4h5" />
    <path d="M4 5.5v3.5a2 2 0 0 0 2 2h4.5" />
  </svg>
);

/** Person silhouette / personas */
const PersonasIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="5" r="2.5" />
    <path d="M3 14.5c0-2.8 2.2-5 5-5s5 2.2 5 5" />
  </svg>
);

/** Play-circle / runs */
const RunsIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="8" r="6" />
    <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" />
  </svg>
);

/** Template / scaffold */
const ScaffoldsIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="2" width="12" height="12" rx="1.5" />
    <path d="M2 6h12" />
    <path d="M6 6v8" />
  </svg>
);

/** Warning triangle / issues */
const IssuesIcon = () => (
  <svg {...iconProps}>
    <path d="M8 2L1.5 13.5h13L8 2z" />
    <path d="M8 7v3" />
    <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Clock / schedules */
const SchedulesIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5v3.5l2.5 2" />
  </svg>
);

/** Gear / settings */
const SettingsIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.1 1.1M11.85 11.85l1.1 1.1M3.05 12.95l1.1-1.1M11.85 4.15l1.1-1.1" />
  </svg>
);

/** Question circle / help */
const HelpIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="8" r="6" />
    <path d="M6 6.5a2 2 0 0 1 3.5 1.3c0 1.2-1.5 1.5-1.5 2.7" />
    <circle cx="8" cy="12" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Menu structure with sections                                      */
/* ------------------------------------------------------------------ */

interface MenuItem {
  label: string;
  path: string;
  icon: React.FC;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Bundles', path: 'bundles', icon: BundlesIcon },
      { label: 'Runs', path: 'runs', icon: RunsIcon },
      { label: 'Schedules', path: 'schedules', icon: SchedulesIcon },
    ],
  },
  {
    title: 'DISCOVERY',
    items: [
      { label: 'Pages', path: 'pages', icon: PagesIcon },
      { label: 'Surfaces', path: 'test-surfaces', icon: SurfacesIcon },
      { label: 'Test Interactions', path: 'test-interactions', icon: InteractionsIcon },
      { label: 'Scenarios', path: 'test-scenarios', icon: ScenariosIcon },
      { label: 'Personas', path: 'personas', icon: PersonasIcon },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      { label: 'Issues', path: 'issues', icon: IssuesIcon },
      { label: 'Scaffolds', path: 'scaffolds', icon: ScaffoldsIcon },
    ],
  },
  {
    title: 'WORKSPACE',
    items: [{ label: 'Settings', path: 'settings', icon: SettingsIcon }],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DashboardSidebar({ entitySlug }: DashboardSidebarProps) {
  const { envId: routeEnvId } = useParams<{ envId: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const location = useLocation();

  const { products, isLoading: productsLoading } = useEntityProducts({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug,
    token: token ?? '',
    enabled: !!token,
  });

  const selectedProductId = useMemo(() => {
    if (products.length === 1) return String(products[0].id);
    return null;
  }, [products]);

  const { environments, isLoading: environmentsLoading } = useProductEnvironments({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    productId: Number(selectedProductId),
    token: token ?? '',
    enabled: !!selectedProductId && !!token,
  });

  // Auto-select environment if only one exists and no environment in route
  useEffect(() => {
    if (environments.length === 1 && !routeEnvId) {
      navigate(`/dashboard/${entitySlug}/environments/${environments[0].id}/bundles`);
    }
  }, [environments, routeEnvId, entitySlug, navigate]);

  const handleProductChange = (value: string) => {
    if (value === 'new') {
      navigate(`/dashboard/${entitySlug}/products/new`);
    }
  };

  const handleEnvironmentChange = (value: string) => {
    if (value === 'new') {
      navigate(`/dashboard/${entitySlug}/environments/new`);
      return;
    }
    navigate(`/dashboard/${entitySlug}/environments/${value}/bundles`);
  };

  // Active path detection
  const currentPath = useMemo(() => {
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    return location.pathname.slice(langPrefix.length - 1);
  }, [location.pathname]);

  const envBasePath = `/dashboard/${entitySlug}/environments/${routeEnvId}`;

  const isActive = (menuPath: string) => {
    const full = `${envBasePath}/${menuPath}`;
    return currentPath === full || currentPath.startsWith(full + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* Product & Environment Selectors */}
      <div className="p-4 space-y-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 px-0.5">
            Product
          </span>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
            <Select value={selectedProductId ?? ''} onValueChange={handleProductChange}>
              <SelectTrigger className="w-full border-0 bg-transparent shadow-none text-[13px] font-medium">
                <SelectValue placeholder={productsLoading ? 'Loading...' : 'Select product'} />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.title}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Create New...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 px-0.5">
            Environment
          </span>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
            <Select
              value={routeEnvId ?? ''}
              onValueChange={handleEnvironmentChange}
              disabled={!selectedProductId}
            >
              <SelectTrigger className="w-full border-0 bg-transparent shadow-none text-[13px] font-medium">
                <SelectValue
                  placeholder={environmentsLoading ? 'Loading...' : 'Select environment'}
                />
              </SelectTrigger>
              <SelectContent>
                {environments.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.title}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Create New...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      {routeEnvId && (
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {MENU_SECTIONS.map((section, sectionIdx) => (
            <div key={section.title}>
              {sectionIdx > 0 && (
                <div className="mx-2 my-2 border-t border-gray-100 dark:border-gray-800" />
              )}
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 pt-1.5 pb-1">
                {section.title}
              </span>
              {section.items.map(item => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(`${envBasePath}/${item.path}`)}
                    className={[
                      'group relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-all duration-150',
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-900 dark:hover:text-gray-200',
                    ].join(' ')}
                  >
                    {/* Left accent bar for active state */}
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
            </div>
          ))}
        </nav>
      )}

      {!routeEnvId && (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-[13px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
            Select a product and environment to get started
          </p>
        </div>
      )}

      {/* Bottom help link */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <button
          onClick={() => navigate(`/docs`)}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-300 transition-all duration-150"
        >
          <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">
            <HelpIcon />
          </span>
          <span>Help &amp; Docs</span>
        </button>
      </div>
    </div>
  );
}
