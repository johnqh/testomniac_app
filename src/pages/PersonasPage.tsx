import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useProductPersonas,
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
  useDetectPersonas,
  usePersonaUseCases,
} from '@sudobility/testomniac_client';
import type { PersonaResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

// ---------------------------------------------------------------------------
// Sub-component: Use Cases (expandable per persona)
// ---------------------------------------------------------------------------

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
          <span className="font-medium text-gray-800 dark:text-gray-200">{uc.title}</span>
          {uc.description && (
            <span className="text-gray-500 dark:text-gray-400"> — {uc.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PersonasPage() {
  const { envId } = useParams<{ envId: string }>();
  const {
    networkClient,
    token,
    productId,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  // Data
  const { personas, isLoading, error, refetch } = useProductPersonas({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    productId: productId ?? 0,
    token,
    enabled: !!envId && !!token && !!productId,
  });

  // Mutations
  const { createPersona, isCreating } = useCreatePersona({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    token,
  });
  const { updatePersona, isUpdating } = useUpdatePersona({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    token,
  });
  const { deletePersona } = useDeletePersona({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    token,
  });
  const { detectPersonas, isDetecting } = useDetectPersonas({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    token,
  });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaResponse | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Detect state
  const [showDetectWarning, setShowDetectWarning] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  // Expand state
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Handlers
  const openCreateForm = () => {
    setEditingPersona(null);
    setFormTitle('');
    setFormDescription('');
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (persona: PersonaResponse) => {
    setEditingPersona(persona);
    setFormTitle(persona.title);
    setFormDescription(persona.description ?? '');
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPersona(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    setFormError(null);
    try {
      if (editingPersona) {
        await updatePersona({
          personaId: editingPersona.id,
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
        });
      } else {
        await createPersona({
          productId: productId!,
          title: formTitle.trim(),
          description: formDescription.trim(),
        });
      }
      closeForm();
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (personaId: number) => {
    await deletePersona(personaId);
    refetch();
  };

  const handleDetect = async () => {
    if (personas.length > 0) {
      setShowDetectWarning(true);
      return;
    }
    await runDetect();
  };

  const runDetect = async () => {
    setShowDetectWarning(false);
    setDetectError(null);
    try {
      await detectPersonas({ productId: productId! });
      refetch();
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : 'Detection failed');
    }
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
      <SEOHead title="Personas" description="" noIndex />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Personas</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDetect}
            disabled={isDetecting || !productId}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isDetecting ? 'Detecting...' : 'Detect Personas'}
          </button>
          <button
            onClick={showForm ? closeForm : openCreateForm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : 'New Persona'}
          </button>
        </div>
      </div>

      {/* Detect error */}
      {detectError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
          {detectError}
        </div>
      )}

      {/* Detect warning dialog */}
      {showDetectWarning && (
        <div className="mb-4 p-4 rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Detecting personas will replace all {personas.length} existing persona
            {personas.length !== 1 ? 's' : ''}. This cannot be undone.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={runDetect}
              disabled={isDetecting}
              className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {isDetecting ? 'Detecting...' : 'Continue'}
            </button>
            <button
              onClick={() => setShowDetectWarning(false)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {editingPersona ? 'Edit Persona' : 'New Persona'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Power User, First-Time Visitor"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Description
              </label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Describe this persona's goals, behavior, and technical proficiency"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
              />
            </div>
            {formError && <div className="text-sm text-red-600 dark:text-red-400">{formError}</div>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isCreating || isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isCreating || isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {(contextLoading || isLoading) && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading personas...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && personas.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No personas yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Create a persona manually or use &quot;Detect Personas&quot; to generate them from your
            discovered pages.
          </p>
        </div>
      )}

      {/* Persona list */}
      {!isLoading && personas.length > 0 && (
        <div className="space-y-2">
          {personas.map((persona: PersonaResponse) => (
            <div
              key={persona.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpandedId(expandedId === persona.id ? null : persona.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {persona.title}
                  </div>
                  {persona.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {persona.description}
                    </p>
                  )}
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEditForm(persona)}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(persona.id)}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>

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
