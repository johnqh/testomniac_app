import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  usePageStates,
  useHtmlElement,
  usePageStateReusableElements,
} from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';

type Tab = 'body' | 'content' | 'reusable';

export default function PageStateDetailPage() {
  const { pageStateId, pageId, runnerId } = useParams<{
    pageStateId: string;
    pageId: string;
    runnerId: string;
  }>();
  const { networkClient, token } = useApi();

  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [bodyView, setBodyView] = useState<'rendered' | 'source'>('rendered');
  const [contentView, setContentView] = useState<'rendered' | 'source'>('rendered');

  const { pageStates, isLoading: statesLoading } = usePageStates({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageId: Number(pageId),
    token: token ?? '',
    enabled: !!pageId && !!token,
  });

  const state = useMemo(
    () => pageStates.find(s => s.id === Number(pageStateId)) ?? null,
    [pageStates, pageStateId]
  );

  const { htmlElement: bodyHtmlElement, isLoading: bodyLoading } = useHtmlElement({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    id: state?.bodyHtmlElementId ?? 0,
    token: token ?? '',
    enabled: !!state?.bodyHtmlElementId && !!token,
  });

  const { htmlElement: contentHtmlElement, isLoading: contentLoading } = useHtmlElement({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    id: state?.contentHtmlElementId ?? 0,
    token: token ?? '',
    enabled: !!state?.contentHtmlElementId && !!token,
  });

  const { reusableElements, isLoading: reusableLoading } = usePageStateReusableElements({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageStateId: Number(pageStateId),
    token: token ?? '',
    enabled: !!pageStateId && !!token,
  });

  if (statesLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Page state not found.
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'body', label: 'Body' },
    { key: 'content', label: 'Content' },
    { key: 'reusable', label: 'Reusable Components' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Page State #{pageStateId}
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {state.sizeClass}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Runner #{runnerId} / Page #{pageId}
          </span>
          {state.capturedAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Captured: {new Date(state.capturedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body Tab */}
      {activeTab === 'body' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBodyView('rendered')}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                bodyView === 'rendered'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Rendered
            </button>
            <button
              onClick={() => setBodyView('source')}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                bodyView === 'source'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Source
            </button>
          </div>

          {bodyView === 'rendered' ? (
            state.rawHtmlPath ? (
              <iframe
                sandbox="allow-same-origin"
                src={`${CONSTANTS.API_URL}/api/v1/artifacts/${state.rawHtmlPath}`}
                className="w-full h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white"
                title="Rendered body HTML"
              />
            ) : (
              <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
                No raw HTML available.
              </div>
            )
          ) : bodyLoading ? (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
              Loading source...
            </div>
          ) : bodyHtmlElement ? (
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-[600px]">
              {bodyHtmlElement.html}
            </pre>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
              No body HTML element available.
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setContentView('rendered')}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                contentView === 'rendered'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Rendered
            </button>
            <button
              onClick={() => setContentView('source')}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                contentView === 'source'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Source
            </button>
          </div>

          {contentView === 'rendered' ? (
            <div className="space-y-4">
              {state.contentText && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content Text
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-[400px] overflow-auto">
                    {state.contentText}
                  </div>
                </div>
              )}
              {!state.contentText && (
                <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
                  No content text available.
                </div>
              )}
            </div>
          ) : contentLoading ? (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
              Loading source...
            </div>
          ) : contentHtmlElement ? (
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-[600px]">
              {contentHtmlElement.html}
            </pre>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
              No content HTML element available.
            </div>
          )}
        </div>
      )}

      {/* Reusable Components Tab */}
      {activeTab === 'reusable' && (
        <div>
          {reusableLoading ? (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">Loading...</div>
          ) : reusableElements.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
              No reusable components found.
            </div>
          ) : (
            <div className="space-y-3">
              {reusableElements.map(element => (
                <div
                  key={element.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Component #{element.reusableHtmlElementId}
                    </span>
                    <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      Reusable Element
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Page State #{element.pageStateId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
