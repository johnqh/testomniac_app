import { type ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  useEntityCredentials,
  useCreateEntityCredential,
  useUpdateEntityCredential,
  useDeleteEntityCredential,
} from '@sudobility/testomniac_client';
import type { EntityCredentialResponse } from '@sudobility/testomniac_types';
import { useSetPageConfig } from '../hooks/usePageConfig';
import { analyticsService } from '../config/analytics';
import { CONSTANTS } from '../config/constants';

const AUTH_PROVIDERS = [
  'email_password',
  'google',
  'apple',
  'microsoft',
  'twitter',
  'facebook',
  'github',
  'linkedin',
  'okta',
  'saml',
] as const;

type AuthProvider = (typeof AUTH_PROVIDERS)[number];

const AUTH_PROVIDER_LABELS: Record<AuthProvider, string> = {
  email_password: 'Email / Password',
  google: 'Google',
  apple: 'Apple',
  microsoft: 'Microsoft',
  twitter: 'Twitter / X',
  facebook: 'Facebook',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  okta: 'Okta',
  saml: 'SAML',
};

const AUTH_PROVIDER_ICONS: Record<AuthProvider, ReactNode> = {
  email_password: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="3" width="7" height="5" rx="0.5" />
      <polyline points="1,3 4.5,6 8,3" />
      <path d="M9.5 3.5v-1a1 1 0 0 1 1-1v0a1 1 0 0 1 1 1v3h-2" />
    </svg>
  ),
  google: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.5 6H6.5" />
      <path d="M10 4.5a4.5 4.5 0 1 1-1.5-2.5" />
    </svg>
  ),
  apple: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2.5C6 1.5 7 0.5 8 0.5" />
      <path d="M3.5 3.5c-1.5.5-2.5 2-2.5 4 0 2.5 2 4 3.5 4 .7 0 1-.3 1.5-.3s.8.3 1.5.3c1.5 0 3.5-1.5 3.5-4 0-1.5-1-3-2-3.5-.7-.3-1.5-.2-2 .2-.5-.4-1.3-.5-2-.2-.5.2-.7.3-1 .5z" />
    </svg>
  ),
  microsoft: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1.5" y="1.5" width="3.5" height="3.5" />
      <rect x="7" y="1.5" width="3.5" height="3.5" />
      <rect x="1.5" y="7" width="3.5" height="3.5" />
      <rect x="7" y="7" width="3.5" height="3.5" />
    </svg>
  ),
  twitter: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" y1="2" x2="10" y2="10" />
      <line x1="10" y1="2" x2="2" y2="10" />
    </svg>
  ),
  facebook: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 1.5H7.5a2.5 2.5 0 0 0-2.5 2.5v1.5H3.5V8H5v3.5h2.5V8H9l.5-2.5H7.5V4a.5.5 0 0 1 .5-.5H9V1.5z" />
    </svg>
  ),
  github: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="5.5" r="4.5" />
      <path d="M4 10.5c0-1 .5-1.5 1-1.5-.5-.1-2-.5-2-2.5 0-.6.2-1 .5-1.4-.1-.3-.2-.8.1-1.6.5 0 1.2.5 1.4.7.4-.1.8-.2 1-.2s.6.1 1 .2c.2-.2.9-.7 1.4-.7.3.8.2 1.3.1 1.6.3.4.5.8.5 1.4 0 2-1.5 2.4-2 2.5.5 0 1 .5 1 1.5" />
    </svg>
  ),
  linkedin: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="1" width="10" height="10" rx="1" />
      <line x1="3.5" y1="5" x2="3.5" y2="9" />
      <circle cx="3.5" cy="3.5" r="0.5" fill="currentColor" />
      <path d="M5.5 9V6.5c0-1 .5-1.5 1.2-1.5.8 0 1.3.5 1.3 1.5V9" />
    </svg>
  ),
  okta: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 1.5h8l.5.5v8l-.5.5H2l-.5-.5v-8L2 1.5z" />
      <polyline points="4,6 5.5,8 8.5,4" />
    </svg>
  ),
  saml: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="6" height="5" rx="0.5" />
      <path d="M4.5 5V3.5a1.5 1.5 0 0 1 3 0V5" />
      <circle cx="6" cy="7.5" r="0.5" fill="currentColor" />
      <line x1="6" y1="8" x2="6" y2="9" />
    </svg>
  ),
};

interface CredentialFormData {
  label: string;
  authProvider: AuthProvider;
  email: string;
  password: string;
  loginUrl: string;
}

const EMPTY_FORM: CredentialFormData = {
  label: '',
  authProvider: 'email_password',
  email: '',
  password: '',
  loginUrl: '',
};

/** Environment settings page with login credential management. */
export default function RunnerSettingsPage() {
  const { t } = useTranslation('common');
  const { entitySlug, envId } = useParams<{ entitySlug: string; envId: string }>();
  const { networkClient, token } = useApi();

  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/environment-settings', 'Environment Settings');
  }, []);

  // Credential hooks
  const hookConfig = {
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug: entitySlug ?? '',
    token: token ?? '',
  };

  const {
    credentials,
    isLoading: loadingCredentials,
    error: credentialsFetchError,
  } = useEntityCredentials({ ...hookConfig, enabled: !!entitySlug && !!token });

  const { createCredential, isCreating } = useCreateEntityCredential(hookConfig);
  const { updateCredential, isUpdating } = useUpdateEntityCredential(hookConfig);
  const { deleteCredential } = useDeleteEntityCredential(hookConfig);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>(EMPTY_FORM);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const credentialsError = mutationError || credentialsFetchError;
  const formSubmitting = isCreating || isUpdating;

  function openAddForm() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setMutationError(null);
    setShowForm(true);
  }

  function openEditForm(cred: EntityCredentialResponse) {
    setEditingId(cred.id);
    setFormData({
      label: cred.label,
      authProvider: cred.authProvider,
      email: cred.email || '',
      password: '',
      loginUrl: cred.loginUrl || '',
    });
    setMutationError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setMutationError(null);
  }

  async function handleFormSubmit() {
    if (!entitySlug || !formData.label.trim()) return;
    setMutationError(null);
    try {
      const body: Record<string, string> = {
        label: formData.label.trim(),
        authProvider: formData.authProvider,
      };
      if (formData.email.trim()) body.email = formData.email.trim();
      if (formData.password) body.password = formData.password;
      if (formData.loginUrl.trim()) body.loginUrl = formData.loginUrl.trim();

      if (editingId) {
        await updateCredential({ credentialId: editingId, data: body });
      } else {
        await createCredential({ entityId: entitySlug, ...body } as Parameters<
          typeof createCredential
        >[0]);
      }
      cancelForm();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to save credential');
    }
  }

  async function handleDelete(id: number) {
    if (!entitySlug) return;
    setDeletingId(id);
    setMutationError(null);
    try {
      await deleteCredential(id);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete credential');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t('nav.settings', 'Environment Settings')}
        </h1>
        {envId && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure settings for this environment.
          </p>
        )}
      </div>

      {/* Login Credentials Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Login Credentials
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage login credentials used for authenticated testing.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={openAddForm}
              className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Add Credential
            </button>
          )}
        </div>

        {credentialsError && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">{credentialsError}</div>
        )}

        {/* Inline Form */}
        {showForm && (
          <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              {editingId ? 'Edit Credential' : 'New Credential'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Label *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={e => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Admin Account"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Auth Provider
                </label>
                <select
                  value={formData.authProvider}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      authProvider: e.target.value as AuthProvider,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {AUTH_PROVIDERS.map(p => (
                    <option key={p} value={p}>
                      {AUTH_PROVIDER_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={editingId ? '(unchanged if empty)' : 'Enter password'}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Login URL (optional)
                </label>
                <input
                  type="text"
                  value={formData.loginUrl}
                  onChange={e => setFormData(prev => ({ ...prev, loginUrl: e.target.value }))}
                  placeholder="https://example.com/login"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={formSubmitting || !formData.label.trim()}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors"
                >
                  {formSubmitting ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Credentials List */}
        {loadingCredentials ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading credentials...</p>
        ) : credentials.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <svg
              className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No login credentials configured yet.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Add credentials to enable authenticated test scenarios.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map(cred => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {cred.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {AUTH_PROVIDER_ICONS[cred.authProvider]}
                      {AUTH_PROVIDER_LABELS[cred.authProvider] || cred.authProvider}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {cred.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {cred.email}
                      </p>
                    )}
                    {cred.hasPassword && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Password set
                      </span>
                    )}
                    {cred.loginUrl && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                        {cred.loginUrl}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditForm(cred)}
                    className="px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cred.id)}
                    disabled={deletingId === cred.id}
                    className="px-2.5 py-1 text-xs rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === cred.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
