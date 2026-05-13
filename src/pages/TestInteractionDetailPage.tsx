import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useEnvironmentTestInteractions,
  useTestInteractionActions,
} from '@sudobility/testomniac_client';
import type { TestActionResponse, TestInteractionResponse } from '@sudobility/testomniac_types';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { AddToBundleButton } from '../components/bundles/AddToBundleButton';

type StoredStep = {
  action?: {
    playwrightCode?: string;
  };
};

function ActionRow({ action }: { action: TestActionResponse }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-8 flex-shrink-0 text-right">
          #{action.stepOrder}
        </span>
        <StatusBadge status={action.actionType} />
        <span className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-100 truncate">
          {action.description}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && action.playwrightCode && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Playwright Code
          </div>
          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words bg-white dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
            {action.playwrightCode}
          </pre>
        </div>
      )}
    </div>
  );
}

function ElementLinkRow({
  element,
  onClick,
  relation,
}: {
  element: TestInteractionResponse;
  onClick: () => void;
  relation: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {relation}
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {element.title}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Test Interaction #{element.id}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={element.testType} />
          <StatusBadge status={element.sizeClass} />
        </div>
      </div>
    </button>
  );
}

export default function TestInteractionDetailPage() {
  const { entitySlug, envId, elementId } = useParams<{
    entitySlug: string;
    envId: string;
    elementId: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const basePath = `/dashboard/${entitySlug}/environments/${envId}`;
  const numericElementId = Number(elementId);

  const { actions, isLoading, error } = useTestInteractionActions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testInteractionId: numericElementId,
    token: token ?? '',
    enabled: !!elementId && !!token,
  });
  const {
    testInteractions,
    isLoading: elementsLoading,
    error: elementsError,
  } = useEnvironmentTestInteractions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    envId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  const currentElement = useMemo(
    () => testInteractions.find(element => element.id === numericElementId) ?? null,
    [numericElementId, testInteractions]
  );
  const dependencyElement = useMemo(() => {
    if (!currentElement?.dependencyTestInteractionId) return null;
    return (
      testInteractions.find(element => element.id === currentElement.dependencyTestInteractionId) ??
      null
    );
  }, [currentElement, testInteractions]);
  const dependentElements = useMemo(
    () =>
      testInteractions.filter(element => element.dependencyTestInteractionId === numericElementId),
    [numericElementId, testInteractions]
  );
  const playwrightScript = useMemo(() => {
    const steps = (currentElement?.stepsJson as StoredStep[] | null) ?? [];
    const lines = steps
      .map(step => step.action?.playwrightCode?.trim())
      .filter((line): line is string => Boolean(line));

    return lines.join('\n');
  }, [currentElement]);
  const actionList = (actions as TestActionResponse[]).sort((a, b) => a.stepOrder - b.stepOrder);
  const hasHoverAction = actionList.some(action => action.actionType === 'hover');
  const actionError = error || elementsError;
  const isPageLoading = isLoading || elementsLoading;

  if (actionError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {actionError}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button
          onClick={() => navigate(`${basePath}/test-surfaces`)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Test Surfaces
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          Test Interaction #{elementId}
        </span>
      </nav>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Test Interaction #{elementId}
        </h1>
        <AddToBundleButton itemType="interaction" itemId={Number(elementId)} />
      </div>

      {/* Metadata badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-gray-500 dark:text-gray-400">ID: {elementId}</span>
        {currentElement && <StatusBadge status={currentElement.testType} />}
        {currentElement && <StatusBadge status={currentElement.sizeClass} />}
        {hasHoverAction && <StatusBadge status="hover" />}
        {currentElement?.surfaceTags.map(tag => (
          <StatusBadge key={tag} status={tag} />
        ))}
      </div>

      {currentElement && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Starting State
            </div>
            <div className="mt-2 text-sm text-gray-900 dark:text-gray-100">
              Path: {currentElement.startingPath || 'None'}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Page state #{currentElement.startingPageStateId ?? 'none'}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Interaction Shape
            </div>
            <div className="mt-2 text-sm text-gray-900 dark:text-gray-100">
              {hasHoverAction
                ? 'This element includes a hover interaction.'
                : 'No hover interaction is defined on this element.'}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {actionList.length} action{actionList.length === 1 ? '' : 's'} in sequence
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Depends On
          </h2>
          {dependencyElement ? (
            <ElementLinkRow
              element={dependencyElement}
              relation="Parent dependency"
              onClick={() => navigate(`${basePath}/test-interactions/${dependencyElement.id}`)}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              This test interaction has no dependency.
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Depended On By
          </h2>
          {dependentElements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              No other test interactions currently depend on this one.
            </div>
          ) : (
            <div className="space-y-2">
              {dependentElements.map(element => (
                <ElementLinkRow
                  key={element.id}
                  element={element}
                  relation="Child dependency"
                  onClick={() => navigate(`${basePath}/test-interactions/${element.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions list */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Test Actions
      </h2>

      {!isPageLoading && playwrightScript && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-6">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Playwright Script
          </div>
          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {playwrightScript}
          </pre>
        </div>
      )}

      {isPageLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading test interaction details...
        </div>
      )}

      {!isPageLoading && actionList.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No actions defined for this test interaction.
          </div>
        </div>
      )}

      {!isPageLoading && actionList.length > 0 && (
        <div className="space-y-2">
          {actionList.map(action => (
            <ActionRow key={action.id} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}
