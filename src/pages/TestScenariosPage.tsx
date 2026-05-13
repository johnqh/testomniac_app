import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRunnerTestScenarios, useDeleteTestScenario } from '@sudobility/testomniac_client';
import type { TestScenarioResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { AddScenarioForm } from '../components/scenarios/AddScenarioForm';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

export default function TestScenariosPage() {
  const { entitySlug, envId } = useParams<{ entitySlug: string; envId: string }>();
  const { navigate } = useLocalizedNavigate();
  const {
    networkClient,
    token,
    primaryRunner,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();
  const [showForm, setShowForm] = useState(false);

  const { testScenarios, isLoading, error, refetch } = useRunnerTestScenarios({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: primaryRunner?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!primaryRunner,
  });

  const { deleteTestScenario } = useDeleteTestScenario({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: primaryRunner?.id ?? 0,
    token,
  });

  const basePath = `/dashboard/${entitySlug}/environments/${envId}`;

  const handleDelete = async (scenarioId: number) => {
    await deleteTestScenario(scenarioId);
    refetch();
  };

  if (contextError || error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {contextError || error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Test Scenarios" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Scenarios</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'New Scenario'}
        </button>
      </div>

      {showForm && primaryRunner && (
        <div className="mb-6">
          <AddScenarioForm
            networkClient={networkClient}
            token={token}
            runnerId={primaryRunner.id}
            onCreated={() => {
              setShowForm(false);
              refetch();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {(contextLoading || isLoading) && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading test scenarios...
        </div>
      )}

      {!isLoading && testScenarios.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No test scenarios yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Create a test scenario to define a user flow you want to test.
          </p>
        </div>
      )}

      {!isLoading && testScenarios.length > 0 && (
        <div className="space-y-2">
          {testScenarios.map((scenario: TestScenarioResponse) => (
            <div
              key={scenario.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <button
                onClick={() => navigate(`${basePath}/test-scenarios/${scenario.id}`)}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {scenario.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {scenario.startingPath} — {scenario.prompt}
                </div>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={scenario.sizeClass} />
                <button
                  onClick={() => handleDelete(scenario.id)}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
