import { useState } from 'react';
import { useParams } from 'react-router-dom';

interface Persona {
  id: number;
  name: string;
  description: string;
  useCases: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

export default function PersonasPage() {
  const { runId: _runId } = useParams<{ runId: string }>();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // TODO: Replace with useRunPersonas hook when API is live
  const personas: Persona[] = [];
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        AI-Generated Personas
      </h1>

      {personas.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No personas generated yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map(persona => (
            <div
              key={persona.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === persona.id ? null : persona.id)}
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {persona.name}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {persona.description}
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {persona.useCases.length} use cases
                </div>
              </button>

              {expandedId === persona.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/30">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Use Cases
                  </h4>
                  <div className="space-y-2">
                    {persona.useCases.map(uc => (
                      <div key={uc.id} className="text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {uc.name}
                        </span>
                        {uc.description && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {' '}
                            — {uc.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
