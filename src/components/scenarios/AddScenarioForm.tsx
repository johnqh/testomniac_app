import { useState } from 'react';
import type { NetworkClient } from '@sudobility/types';
import { useCreateTestScenario } from '@sudobility/testomniac_client';
import { CONSTANTS } from '../../config/constants';

interface AddScenarioFormProps {
  networkClient: NetworkClient;
  token: string;
  runnerId: number;
  defaultStartingPath?: string;
  onCreated: () => void;
  onCancel: () => void;
}

export function AddScenarioForm({
  networkClient,
  token,
  runnerId,
  defaultStartingPath = '/',
  onCreated,
  onCancel,
}: AddScenarioFormProps) {
  const [title, setTitle] = useState('');
  const [startingPath, setStartingPath] = useState(defaultStartingPath);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createTestScenario, isCreating } = useCreateTestScenario({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    token,
  });

  const handleCreate = async () => {
    if (!title.trim() || !prompt.trim()) return;
    setError(null);
    try {
      await createTestScenario({
        runnerId,
        title: title.trim(),
        startingPath: startingPath.trim(),
        prompt: prompt.trim(),
      });
      setTitle('');
      setStartingPath(defaultStartingPath);
      setPrompt('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scenario');
    }
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Add dish to cart and checkout"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Starting Path
        </label>
        <input
          type="text"
          value={startingPath}
          onChange={e => setStartingPath(e.target.value)}
          placeholder="e.g., /store"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the test flow in plain English. e.g., Browse the menu, add a pasta dish to the shopping cart, go to checkout, fill in shipping details, and complete the purchase."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !title.trim() || !prompt.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isCreating ? 'Creating...' : 'Create Scenario'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
