import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GlobalSettingsPage } from '@sudobility/building_blocks';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useTheme } from '@sudobility/components';
import SEOHead from '@/components/SEOHead';
import { useSetPageConfig } from '../hooks/usePageConfig';
import { analyticsService } from '../config/analytics';
import { useBuildingBlocksAnalytics } from '../hooks/useBuildingBlocksAnalytics';
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

interface EntityCredentialResponse {
  id: string;
  entityId: string;
  label: string;
  authProvider: AuthProvider;
  loginUrl?: string;
  email?: string;
  username?: string;
  hasPassword: boolean;
  hasTwoFactorCode: boolean;
  createdAt: string;
  updatedAt: string;
}

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

/** User settings page for theme and font size preferences. */
export default function SettingsPage() {
  const { t } = useTranslation('common');
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const { token } = useApi();
  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  const onTrack = useBuildingBlocksAnalytics();

  useSetPageConfig({ scrollable: false, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/settings', 'Settings');
  }, []);

  // Credentials state
  const [credentials, setCredentials] = useState<EntityCredentialResponse[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>(EMPTY_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const fetchCredentials = useCallback(async () => {
    if (!entitySlug || !token) return;
    setLoadingCredentials(true);
    setCredentialsError(null);
    try {
      const res = await fetch(`${CONSTANTS.API_URL}/api/v1/entities/${entitySlug}/credentials`, {
        headers: headers(),
      });
      const json = await res.json();
      if (json.success) {
        setCredentials(json.data);
      } else {
        setCredentialsError(json.error || 'Failed to load credentials');
      }
    } catch {
      setCredentialsError('Failed to connect to server');
    } finally {
      setLoadingCredentials(false);
    }
  }, [entitySlug, token, headers]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  function openAddForm() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
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
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  }

  async function handleFormSubmit() {
    if (!entitySlug || !formData.label.trim()) return;
    setFormSubmitting(true);
    try {
      const body: Record<string, string> = {
        label: formData.label.trim(),
        authProvider: formData.authProvider,
      };
      if (formData.email.trim()) body.email = formData.email.trim();
      if (formData.password) body.password = formData.password;
      if (formData.loginUrl.trim()) body.loginUrl = formData.loginUrl.trim();

      const url = editingId
        ? `${CONSTANTS.API_URL}/api/v1/entities/${entitySlug}/credentials/${editingId}`
        : `${CONSTANTS.API_URL}/api/v1/entities/${entitySlug}/credentials`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        cancelForm();
        fetchCredentials();
      } else {
        setCredentialsError(json.error || 'Failed to save credential');
      }
    } catch {
      setCredentialsError('Failed to connect to server');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!entitySlug) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `${CONSTANTS.API_URL}/api/v1/entities/${entitySlug}/credentials/${id}`,
        { method: 'DELETE', headers: headers() }
      );
      const json = await res.json();
      if (json.success) {
        setCredentials(prev => prev.filter(c => c.id !== id));
      } else {
        setCredentialsError(json.error || 'Failed to delete credential');
      }
    } catch {
      setCredentialsError('Failed to connect to server');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <SEOHead title={t('nav.settings')} description="" noIndex />
      <GlobalSettingsPage
        theme={theme}
        fontSize={fontSize}
        onThemeChange={setTheme}
        onFontSizeChange={setFontSize}
        onTrack={onTrack}
      />

      {/* Test Credentials Section */}
      <div className="mt-8 max-w-2xl mx-auto px-4">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Test Credentials
            </h2>
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
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Email
                  </label>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No test credentials stored yet.
            </p>
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {AUTH_PROVIDER_LABELS[cred.authProvider] || cred.authProvider}
                      </span>
                    </div>
                    {cred.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {cred.email}
                      </p>
                    )}
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
    </>
  );
}
