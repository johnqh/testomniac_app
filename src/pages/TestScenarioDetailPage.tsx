import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useRunnerTestScenarios,
  useTestScenarioSequences,
  useProductPersonas,
} from '@sudobility/testomniac_client';
import { useSequenceGenerator } from '@sudobility/testomniac_lib';
import type { TestScenarioSequenceResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import BackLink from '../components/navigation/BackLink';
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
    productId,
    primaryRunner,
    envId: numericEnvId,
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

  const { personas } = useProductPersonas({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    productId,
    token,
    enabled: !!productId && !!token,
  });

  const personaName = scenario?.personaId
    ? personas.find(p => p.id === scenario.personaId)?.title
    : null;

  const {
    sequences,
    isLoading: sequencesLoading,
    error: sequencesError,
    refetch: refetchSequences,
  } = useTestScenarioSequences({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    testScenarioId: Number(scenarioId),
    token: token ?? '',
    enabled: !!scenarioId && !!token,
  });

  const {
    generate,
    isGenerating,
    error: generateError,
  } = useSequenceGenerator({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    token,
  });

  const [generateErrorMsg, setGenerateErrorMsg] = useState<string | null>(null);

  const handleGenerateSequence = async () => {
    setGenerateErrorMsg(null);
    const result = await generate(Number(scenarioId), numericEnvId);
    if (result) {
      refetchSequences();
    } else if (generateError) {
      setGenerateErrorMsg(generateError);
    }
  };

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

      <BackLink label="Test Scenarios" onClick={() => navigate(`${basePath}/test-scenarios`)} />

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
                Persona:{' '}
                <code className="text-gray-900 dark:text-gray-100">
                  {personaName ?? `#${scenario.personaId}`}
                </code>
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Sequences
        </h2>
        <button
          onClick={handleGenerateSequence}
          disabled={isGenerating || !scenarioId}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate Sequence'}
        </button>
      </div>

      {(generateErrorMsg || generateError) && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {generateErrorMsg || generateError}
        </div>
      )}

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
