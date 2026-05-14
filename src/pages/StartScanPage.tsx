import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { ScanForm } from '../components/scanner/ScanForm';
import { CONSTANTS } from '../config/constants';

interface StoredCredential {
  id: string;
  label: string;
  authProvider: string;
  email?: string;
}

const AUTH_PROVIDER_LABELS: Record<string, string> = {
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

export default function StartScanPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const { token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeClass, setSizeClass] = useState<'desktop' | 'mobile'>('desktop');

  // Scan scope
  const [scanScopePath, setScanScopePath] = useState('');

  // Login credential state
  const [continueWithLogin, setContinueWithLogin] = useState(false);
  const [entityCredentialId, setEntityCredentialId] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [storedCredentials, setStoredCredentials] = useState<StoredCredential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  const fetchCredentials = useCallback(async () => {
    if (!entitySlug || !token) return;
    setLoadingCredentials(true);
    try {
      const res = await fetch(`${CONSTANTS.API_URL}/api/v1/entities/${entitySlug}/credentials`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setStoredCredentials(json.data);
      }
    } catch {
      // silently ignore - credentials are optional
    } finally {
      setLoadingCredentials(false);
    }
  }, [entitySlug, token]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  async function handleSubmit(url: string, email?: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${CONSTANTS.API_URL}/api/v1/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          url,
          sizeClass,
          ...(email ? { reportEmail: email } : {}),
          ...(scanScopePath.trim() ? { scanScopePath: scanScopePath.trim() } : {}),
          ...(continueWithLogin
            ? {
                continueWithLogin: true,
                ...(entityCredentialId ? { entityCredentialId: Number(entityCredentialId) } : {}),
                ...(loginUrl.trim() ? { loginUrl: loginUrl.trim() } : {}),
              }
            : {}),
        }),
      });
      const data = await response.json();

      if (data.success && data.data?.testRunId && data.data?.testEnvironmentId) {
        navigate(
          `/dashboard/${entitySlug}/environments/${data.data.testEnvironmentId}/runs/${data.data.testRunId}/progress`
        );
      } else {
        setError(data.error || data.data?.message || 'Failed to start scan');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <SEOHead title="Start Discovery Run" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Start Discovery Run
      </h1>

      <div className="space-y-6">
        <ScanForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
          showEmail={false}
        />

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Options</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Device</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSizeClass('desktop')}
                  className={`px-3 py-1.5 text-sm rounded-md border ${
                    sizeClass === 'desktop'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setSizeClass('mobile')}
                  className={`px-3 py-1.5 text-sm rounded-md border ${
                    sizeClass === 'mobile'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Scan Scope Path */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Scope Path (optional)
              </label>
              <input
                type="text"
                value={scanScopePath}
                onChange={e => setScanScopePath(e.target.value)}
                placeholder="/store/"
                className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Restrict scanning to URLs under this path prefix
              </p>
            </div>

            {/* Login Credential Option */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={continueWithLogin}
                  onChange={e => {
                    setContinueWithLogin(e.target.checked);
                    if (!e.target.checked) {
                      setEntityCredentialId('');
                      setLoginUrl('');
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Continue with login
                </span>
              </label>

              {continueWithLogin && (
                <div className="mt-3 ml-6 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Stored Credential
                    </label>
                    <select
                      value={entityCredentialId}
                      onChange={e => setEntityCredentialId(e.target.value)}
                      disabled={loadingCredentials}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">
                        {loadingCredentials ? 'Loading...' : 'Select a credential'}
                      </option>
                      {storedCredentials.map(cred => (
                        <option key={cred.id} value={cred.id}>
                          {cred.label} (
                          {AUTH_PROVIDER_LABELS[cred.authProvider] || cred.authProvider}
                          {cred.email ? ` - ${cred.email}` : ''})
                        </option>
                      ))}
                    </select>
                    {!loadingCredentials && storedCredentials.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        No stored credentials. Add them in Settings.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Login URL (optional)
                    </label>
                    <input
                      type="text"
                      value={loginUrl}
                      onChange={e => setLoginUrl(e.target.value)}
                      placeholder="https://example.com/login"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Discovery creates a root test run and captures page states for the selected device
              size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
