import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useAppComponents } from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';

export default function ComponentsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { networkClient, token } = useApi();

  const { components, isLoading, error } = useAppComponents({
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Reusable Components
      </h1>

      {components.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No reusable components detected.</p>
      ) : (
        <div className="space-y-3">
          {components.map(comp => (
            <div
              key={comp.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {comp.type}
                  </div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                    Element #{comp.htmlElementId}
                  </div>
                </div>
                {comp.htmlHash && (
                  <div className="text-xs font-mono text-gray-400 dark:text-gray-500">
                    {comp.htmlHash.slice(0, 8)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
