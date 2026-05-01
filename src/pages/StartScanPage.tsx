import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import SEOHead from '@/components/SEOHead';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { ScanForm } from '../components/scanner/ScanForm';
import { CONSTANTS } from '../config/constants';

export default function StartScanPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const { token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeClass, setSizeClass] = useState<'desktop' | 'mobile'>('desktop');

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
        }),
      });
      const data = await response.json();

      if (data.success && data.data?.testRunId && data.data?.runnerId) {
        navigate(
          `/dashboard/${entitySlug}/runners/${data.data.runnerId}/runs/${data.data.testRunId}/progress`
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
