import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { usePageStates } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export default function PageDetailPage() {
  const { pageId, runnerId, entitySlug } = useParams<{
    pageId: string;
    runnerId: string;
    entitySlug: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { pageStates, isLoading } = usePageStates({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageId: Number(pageId),
    token: token ?? '',
    enabled: !!pageId && !!token,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Page Detail" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Page Detail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Page #{pageId}</p>
        </div>
        <button
          onClick={() =>
            navigate(`/dashboard/${entitySlug}/runners/${runnerId}/pages/${pageId}/graph`)
          }
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          View Page Graph
        </button>
      </div>

      {pageStates.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No page states found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageStates.map(state => (
            <button
              key={state.id}
              onClick={() =>
                navigate(
                  `/dashboard/${entitySlug}/runners/${runnerId}/pages/${pageId}/states/${state.id}`
                )
              }
              className="text-left rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {state.screenshotPath ? (
                  <img
                    src={`${CONSTANTS.API_URL}/api/v1/artifacts/${state.screenshotPath}`}
                    alt={`State ${state.id} screenshot`}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-400">No screenshot</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    State #{state.id}
                  </span>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {state.sizeClass}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {state.capturedAt
                    ? new Date(state.capturedAt).toLocaleString()
                    : 'No capture date'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
