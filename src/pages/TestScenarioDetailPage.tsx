import { useParams } from 'react-router-dom';
import { useRunnerTestScenarios, useTestScenarioSequences } from '@sudobility/testomniac_client';
import type { TestScenarioSequenceResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { AddToBundleButton } from '../components/bundles/AddToBundleButton';

export default function TestScenarioDetailPage() {
  const { entitySlug, envId, scenarioId } = useParams<{
    entitySlug: string;
    envId: string;
    scenarioId: string;
  }>();
  const { navigate } = useLocalizedNavigate();
  const {
    networkClient,
    token,
    primaryRunner,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const basePath = `/dashboard/${entitySlug}/environments/${envId}`;

  // Fetch the scenario from the list (no single-get endpoint needed)
  const { testScenarios } = useRunnerTestScenarios({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: primaryRunner?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!primaryRunner,
  });

  const scenario = testScenarios.find(s => s.id === Number(scenarioId));

  const {
    sequences,
    isLoading: sequencesLoading,
    error: sequencesError,
  } = useTestScenarioSequences({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testScenarioId: Number(scenarioId),
    token: token ?? '',
    enabled: !!scenarioId && !!token,
  });

  if (contextError || sequencesError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {contextError || sequencesError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title={scenario?.title ?? `Scenario #${scenarioId}`} description="" noIndex />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button
          onClick={() => navigate(`${basePath}/test-scenarios`)}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Test Scenarios
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {scenario?.title ?? `Scenario #${scenarioId}`}
        </span>
      </nav>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {scenario?.title ?? `Test Scenario #${scenarioId}`}
        </h1>
        <AddToBundleButton itemType="scenario" itemId={Number(scenarioId)} />
      </div>

      {scenario && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Starting path:{' '}
              <code className="text-gray-900 dark:text-gray-100">{scenario.startingPath}</code>
            </span>
            <span>
              Device: <code className="text-gray-900 dark:text-gray-100">{scenario.sizeClass}</code>
            </span>
            {scenario.personaId && (
              <span>
                Persona ID:{' '}
                <code className="text-gray-900 dark:text-gray-100">{scenario.personaId}</code>
              </span>
            )}
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prompt</div>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {scenario.prompt}
            </p>
          </div>
        </div>
      )}

      {/* Sequences */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Sequences
      </h2>

      {sequencesLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">Loading...</div>
      )}

      {!sequencesLoading && sequences.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No sequences yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Sequences are created when a scenario is run against an environment.
          </p>
        </div>
      )}

      {sequences.length > 0 && (
        <div className="space-y-2">
          {sequences.map((seq: TestScenarioSequenceResponse) => (
            <div
              key={seq.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Sequence #{seq.id}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Environment ID: {seq.testEnvironmentId}
                  {seq.createdAt && ` — Created: ${new Date(seq.createdAt).toLocaleDateString()}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
