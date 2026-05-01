import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { ScanForm } from '../components/scanner/ScanForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8027';

export default function StartScanPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const { token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeClass, setSizeClass] = useState<'desktop' | 'mobile'>('desktop');
  const [plugins, setPlugins] = useState<string[]>(['seo', 'security', 'content']);

  async function handleSubmit(url: string, email?: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, email, sizeClass, plugins }),
      });
      const data = await response.json();

      if (data.success && data.data?.scanId && data.data?.runnerId) {
        navigate(
          `/dashboard/${entitySlug}/runners/${data.data.runnerId}/scans/${data.data.scanId}/progress`
        );
      } else if (data.success && data.data?.runId) {
        // Fallback for older API responses without runnerId
        navigate(`/dashboard/${entitySlug}/runs/${data.data.runId}/progress`);
      } else {
        setError(data.error || data.data?.message || 'Failed to start scan');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  }

  const pluginOptions = [
    { id: 'seo', label: 'SEO Checks' },
    { id: 'security', label: 'Security Checks' },
    { id: 'content', label: 'Content Quality' },
    { id: 'ui-consistency', label: 'UI Consistency' },
  ];

  return (
    <div className="p-6 max-w-lg">
      <SEOHead title="Start New Scan" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Start New Scan</h1>

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

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Plugins</label>
              <div className="space-y-2">
                {pluginOptions.map(plugin => (
                  <label key={plugin.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={plugins.includes(plugin.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setPlugins([...plugins, plugin.id]);
                        } else {
                          setPlugins(plugins.filter(p => p !== plugin.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{plugin.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
