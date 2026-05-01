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
import { useEntityProducts, useProductRunners } from '@sudobility/testomniac_client';
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
  const { runnerId: routeRunnerId } = useParams<{ runnerId: string }>();
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

  // Auto-select product if only one exists
  const selectedProductId = useMemo(() => {
    if (products.length === 1) return String(products[0].id);
    return null;
  }, [products]);

  const { runners, isLoading: runnersLoading } = useProductRunners({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    productId: Number(selectedProductId),
    token: token ?? '',
    enabled: !!selectedProductId && !!token,
  });

  // Auto-select runner if only one exists and no runner in route
  useEffect(() => {
    if (runners.length === 1 && !routeRunnerId) {
      navigate(`/dashboard/${entitySlug}/runners/${runners[0].id}/bundles`);
    }
  }, [runners, routeRunnerId, entitySlug, navigate]);

  const handleProductChange = (value: string) => {
    if (value === 'new') {
      navigate(`/dashboard/${entitySlug}/products/new`);
    }
  };

  const handleRunnerChange = (value: string) => {
    if (value === 'new') {
      navigate(`/dashboard/${entitySlug}/runners/new`);
      return;
    }
    navigate(`/dashboard/${entitySlug}/runners/${value}/bundles`);
  };

  // Active path detection
  const currentPath = useMemo(() => {
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    return location.pathname.slice(langPrefix.length - 1);
  }, [location.pathname]);

  const runnerBasePath = `/dashboard/${entitySlug}/runners/${routeRunnerId}`;

  const isActive = (menuPath: string) => {
    const full = `${runnerBasePath}/${menuPath}`;
    return currentPath === full || currentPath.startsWith(full + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Product & Runner Selectors */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
            Product
          </label>
          <Select value={selectedProductId ?? undefined} onValueChange={handleProductChange}>
            <SelectTrigger className="w-full">
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

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
            Runner
          </label>
          <Select
            value={routeRunnerId ?? undefined}
            onValueChange={handleRunnerChange}
            disabled={!selectedProductId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={runnersLoading ? 'Loading...' : 'Select runner'} />
            </SelectTrigger>
            <SelectContent>
              {runners.map(a => (
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
      {routeRunnerId && (
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {MENU_ITEMS.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(`${runnerBasePath}/${item.path}`)}
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

      {!routeRunnerId && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Select a product and runner to get started
          </p>
        </div>
      )}
    </div>
  );
}
