import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useAppPages } from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';

export default function PagesPage() {
  const { appId } = useParams<{ appId: string }>();
  const { networkClient, token } = useApi();

  const { pages, isLoading, error } = useAppPages({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: Number(appId),
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Discovered Pages</h1>

      {pages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No pages discovered yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <div
              key={page.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
            >
              <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-xs text-gray-400">Screenshot</span>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {page.routeKey || page.relativePath}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {page.relativePath}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {page.requiresLogin && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                      Login
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
