import type { PageResponse } from '@sudobility/testomniac_types';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';

interface PagesListViewProps {
  pages: PageResponse[];
  envId: string;
  entitySlug: string;
  runId?: string;
}

export function PagesListView({ pages, envId, entitySlug, runId }: PagesListViewProps) {
  const { navigate } = useLocalizedNavigate();
  const basePath = runId
    ? `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}/pages`
    : `/dashboard/${entitySlug}/environments/${envId}/pages`;

  const sorted = [...pages].sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">No pages discovered.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Path
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Route Key
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(page => {
            const isExternal = page.relativePath.startsWith('http');

            return (
              <tr
                key={page.id}
                onClick={() => navigate(`${basePath}/${page.id}`)}
                className="cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-md">{page.relativePath}</span>
                    {isExternal && (
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        external
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {page.routeKey ?? (
                    <span className="text-gray-400 dark:text-gray-600">&mdash;</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {page.requiresLogin && (
                    <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Login
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
