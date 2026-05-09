import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useEnvironmentPages, useEnvironmentTestElements } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { PagesListView } from '../components/pages/PagesListView';
import { PagesMapView } from '../components/pages/PagesMapView';

export default function PagesPage() {
  const { entitySlug, envId } = useParams<{
    entitySlug: string;
    envId: string;
  }>();
  const { networkClient, token } = useApi();
  const [view, setView] = useState<'list' | 'map'>('list');

  const {
    pages,
    isLoading: pagesLoading,
    error: pagesError,
  } = useEnvironmentPages({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  const {
    testElements,
    isLoading: elementsLoading,
    error: elementsError,
  } = useEnvironmentTestElements({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  const isLoading = pagesLoading || elementsLoading;
  const error = pagesError || elementsError;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="py-8 text-center text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Discovered Pages" description="" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discovered Pages</h1>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            } rounded-l-md`}
          >
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              view === 'map'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            } rounded-r-md`}
          >
            Map
          </button>
        </div>
      </div>

      {pages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No pages discovered yet.</p>
      ) : view === 'list' ? (
        <PagesListView pages={pages} envId={envId!} entitySlug={entitySlug!} />
      ) : (
        <PagesMapView
          pages={pages}
          testElements={testElements}
          envId={envId!}
          entitySlug={entitySlug!}
        />
      )}
    </div>
  );
}
