import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  usePageStates,
  useRunPageSummary,
  useEnvironmentTestInteractions,
  useEnvironmentPages,
  useCreateTestInteractionRun,
  useRunPages,
  useRunTestInteractions,
} from '@sudobility/testomniac_client';
import type { TestInteractionResponse } from '@sudobility/testomniac_types';
import { usePageInteractionGroups } from '@sudobility/testomniac_lib';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { AddScenarioForm } from '../components/scenarios/AddScenarioForm';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

export default function PageDetailPage() {
  const { pageId, envId, entitySlug, runId } = useParams<{
    pageId: string;
    envId: string;
    entitySlug: string;
    runId?: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const { primaryRunner } = useDashboardEnvironmentContext();
  const [showScenarioForm, setShowScenarioForm] = useState(false);

  const numericPageId = Number(pageId);

  const runScoped = Boolean(runId);

  const envPagesQuery = useEnvironmentPages({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token && !runScoped,
  });

  const runPagesQuery = useRunPages({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  const envElementsQuery = useEnvironmentTestInteractions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token && !runScoped,
  });

  const runElementsQuery = useRunTestInteractions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  const envPages = runScoped ? runPagesQuery.pages : envPagesQuery.pages;
  const currentPage = envPages.find(p => p.id === numericPageId);
  const testInteractions = runScoped
    ? runElementsQuery.testInteractions
    : envElementsQuery.testInteractions;

  const { createRun } = useCreateTestInteractionRun({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    token: token ?? '',
  });

  const pagePathById = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of envPages) {
      map.set(p.id, p.relativePath);
    }
    return map;
  }, [envPages]);

  const { startingElements, landingElements, onPageElements } = usePageInteractionGroups(
    testInteractions,
    numericPageId
  );

  const { pageStates, isLoading } = usePageStates({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageId: Number(pageId),
    token: token ?? '',
    enabled: !!pageId && !!token,
  });
  const { summary, isLoading: summaryLoading } = useRunPageSummary({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    pageId: Number(pageId),
    token: token ?? '',
    enabled: !!runId && !!pageId && !!token,
  });

  if (isLoading || summaryLoading) {
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {summary?.relativePath ?? `Page #${pageId}`}
            {runId ? ` • Run #${runId}` : ` • Page #${pageId}`}
          </p>
        </div>
        <div className="flex gap-2">
          {primaryRunner && (
            <button
              onClick={() => setShowScenarioForm(prev => !prev)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showScenarioForm ? 'Cancel' : 'Add Scenario'}
            </button>
          )}
          <button
            onClick={() =>
              navigate(`/dashboard/${entitySlug}/environments/${envId}/pages/${pageId}/graph`)
            }
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            View Page Graph
          </button>
        </div>
      </div>

      {showScenarioForm && primaryRunner && (
        <div className="mb-6">
          <AddScenarioForm
            networkClient={networkClient}
            token={token ?? ''}
            runnerId={primaryRunner.id}
            defaultStartingPath={summary?.relativePath ?? currentPage?.relativePath ?? '/'}
            onCreated={() => setShowScenarioForm(false)}
            onCancel={() => setShowScenarioForm(false)}
          />
        </div>
      )}

      {summary && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.pageStatesCount}
              </div>
              <div className="text-xs text-gray-500">Page States</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.testInteractionsCount}
              </div>
              <div className="text-xs text-gray-500">Test Interactions</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.findings}
              </div>
              <div className="text-xs text-gray-500">Findings</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.testInteractionRunsCount}
              </div>
              <div className="text-xs text-gray-500">Case Runs</div>
            </div>
          </div>

          {summary.latestScreenshotPath && (
            <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <img
                src={`${CONSTANTS.API_URL}/api/v1/artifacts/${summary.latestScreenshotPath}`}
                alt={`${summary.relativePath} latest screenshot`}
                className="h-72 w-full object-cover object-top"
              />
            </div>
          )}

          {summary.recentFindings.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Findings
              </h2>
              <div className="space-y-3">
                {summary.recentFindings.slice(0, 8).map(finding => (
                  <div
                    key={finding.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {finding.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {finding.description}
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] capitalize text-gray-500 dark:text-gray-400">
                        {finding.expertise ?? finding.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.runtimeSignals.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Runtime Signals
              </h2>
              <div className="space-y-4">
                {summary.runtimeSignals.map(signal => (
                  <div
                    key={signal.testInteractionRunId}
                    className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {signal.testInteractionTitle ??
                            `Test Interaction #${signal.testInteractionId}`}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Case run #{signal.testInteractionRunId}
                          {signal.completedAt
                            ? ` • ${new Date(signal.completedAt).toLocaleString()}`
                            : ''}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {signal.status}
                      </span>
                    </div>
                    {signal.consoleLog && (
                      <pre className="mb-3 max-h-48 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                        {signal.consoleLog}
                      </pre>
                    )}
                    {signal.networkLog && (
                      <pre className="max-h-48 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                        {signal.networkLog}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {pageStates.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No page states found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageStates.map(state => (
            <button
              key={state.id}
              onClick={() =>
                navigate(
                  runId
                    ? `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}/pages/${pageId}/states/${state.id}`
                    : `/dashboard/${entitySlug}/environments/${envId}/pages/${pageId}/states/${state.id}`
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

      {/* Test Interactions Section */}
      {(startingElements.length > 0 || landingElements.length > 0 || onPageElements.length > 0) && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Test Interactions
          </h2>

          {onPageElements.length > 0 && (
            <TestInteractionGroup
              label="On this page"
              elements={onPageElements}
              pagePathById={pagePathById}
              onTest={el => createRun({ testInteractionId: el.id })}
            />
          )}

          {startingElements.length > 0 && (
            <TestInteractionGroup
              label="Starting from this page"
              elements={startingElements}
              pagePathById={pagePathById}
              onTest={el => createRun({ testInteractionId: el.id })}
            />
          )}

          {landingElements.length > 0 && (
            <TestInteractionGroup
              label="Landing on this page"
              elements={landingElements}
              pagePathById={pagePathById}
              onTest={el => createRun({ testInteractionId: el.id })}
            />
          )}
        </div>
      )}
    </div>
  );
}

// --- Test Interactions Sub-components ---

function TestInteractionGroup({
  label,
  elements,
  pagePathById,
  onTest,
}: {
  label: string;
  elements: TestInteractionResponse[];
  pagePathById: Map<number, string>;
  onTest: (el: TestInteractionResponse) => void;
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
      <div className="space-y-1">
        {elements.map(el => (
          <TestInteractionRow
            key={el.id}
            element={el}
            pagePathById={pagePathById}
            onTest={() => onTest(el)}
          />
        ))}
      </div>
    </div>
  );
}

function TestInteractionRow({
  element,
  pagePathById,
  onTest,
}: {
  element: TestInteractionResponse;
  pagePathById: Map<number, string>;
  onTest: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const startPath = element.pageId != null ? pagePathById.get(element.pageId) : null;
  const endPath = element.targetPageId != null ? pagePathById.get(element.targetPageId) : null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {element.title}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {startPath && <span className="truncate max-w-[200px]">{startPath}</span>}
            {startPath && endPath && <span>&rarr;</span>}
            {endPath && <span className="truncate max-w-[200px]">{endPath}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          {element.testType}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onTest();
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
