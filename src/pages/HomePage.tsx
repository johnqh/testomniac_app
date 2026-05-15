import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useSubmitScan } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { buildHowToSchema } from '@/components/buildHowToSchema';
import { ScanForm } from '../components/scanner/ScanForm';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export default function HomePage() {
  const { t } = useTranslation('common');
  const { t: tHowTo } = useTranslation('howto');
  const { networkClient } = useApi();
  const { navigate } = useLocalizedNavigate();
  const [error, setError] = useState<string | null>(null);

  const { submitScan, isSubmitting } = useSubmitScan({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
  });

  const seoTitle = t('seo.home.title');
  const seoDescription = t('seo.home.description');
  const seoKeywords = t('seo.home.keywords', { returnObjects: true }) as string[];

  const howToSchema = buildHowToSchema(
    tHowTo('home.name'),
    tHowTo('home.description'),
    tHowTo('home.steps', { returnObjects: true }) as { name: string; text: string }[]
  );

  async function handleSubmit(url: string, email?: string) {
    setError(null);
    try {
      const response = await submitScan({
        url,
        ...(email ? { reportEmail: email } : {}),
      });

      if (response.success && response.data) {
        const result = response.data;
        if (result.status === 'pending' && result.testRunId) {
          navigate(`/scan/${result.testRunId}/progress`);
        } else if (result.status === 'duplicate_owned') {
          setError(
            result.message ||
              'This URL already belongs to an organization. Contact the owner to get access.'
          );
        } else if (result.status === 'duplicate_unclaimed') {
          setError(
            result.message || 'This URL has already been scanned. Create an account to claim it.'
          );
        } else if (result.status === 'validation_error') {
          setError(result.message || 'Validation failed. Please check your input.');
        }
      } else {
        setError(response.error || 'Failed to start discovery run');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    }
  }

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        structuredData={howToSchema}
      />
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Testomniac</h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
              {t('home.description', 'Automated web app testing powered by AI')}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
              Enter your URL to start a discovery run, generate tests, and find issues
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <ScanForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={error}
              showEmail={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}
