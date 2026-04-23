import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useAppPersonas, usePersonaUseCases } from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';

function PersonaUseCases({ personaId }: { personaId: number }) {
  const { networkClient, token } = useApi();
  const { useCases, isLoading } = usePersonaUseCases({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    personaId,
    token: token ?? '',
  });

  if (isLoading) {
    return <div className="text-xs text-gray-400 py-2">Loading use cases...</div>;
  }

  if (useCases.length === 0) {
    return <div className="text-xs text-gray-400 py-2">No use cases.</div>;
  }

  return (
    <div className="space-y-2">
      {useCases.map(uc => (
        <div key={uc.id} className="text-sm">
          <span className="font-medium text-gray-800 dark:text-gray-200">{uc.name}</span>
          {uc.description && (
            <span className="text-gray-500 dark:text-gray-400"> — {uc.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PersonasPage() {
  const { appId } = useParams<{ appId: string }>();
  const { networkClient, token } = useApi();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { personas, isLoading, error } = useAppPersonas({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: Number(appId),
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
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
              </button>

              {expandedId === persona.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/30">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Use Cases
                  </h4>
                  <PersonaUseCases personaId={persona.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
