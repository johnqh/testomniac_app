import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useAppFindings } from '@sudobility/testomniac_client';
import type { TestRunFindingResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';

function FindingTypeBadge({ type }: { type: string }) {
  const colors =
    type === 'error'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      : type === 'warning'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}
    >
      {type}
    </span>
  );
}

type FilterMode = 'all' | 'errors';

export default function FindingsListPage() {
  const { appId } = useParams<{ appId: string }>();
  const { networkClient, token } = useApi();
  const [filter, setFilter] = useState<FilterMode>('all');

  const { findings, isLoading, error } = useAppFindings({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: Number(appId),
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  const filteredFindings =
    filter === 'errors'
      ? (findings as TestRunFindingResponse[]).filter(f => f.type === 'error')
      : (findings as TestRunFindingResponse[]);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Findings" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Findings</h1>

        {/* Filter toggle */}
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('errors')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'errors'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Errors only
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading findings...
        </div>
      )}

      {!isLoading && filteredFindings.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {filter === 'errors' ? 'No errors found' : 'No findings yet'}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {filter === 'errors'
              ? 'There are no error-level findings for this app.'
              : 'Findings will appear here after test runs complete.'}
          </p>
        </div>
      )}

      {!isLoading && filteredFindings.length > 0 && (
        <div className="space-y-3">
          {filteredFindings.map(finding => (
            <div
              key={finding.id}
              className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <FindingTypeBadge type={finding.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {finding.title}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {finding.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Run #{finding.testCaseRunId}
                    </span>
                    {finding.createdAt && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(finding.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
