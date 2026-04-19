import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStatus } from '@sudobility/auth-components';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useHistoriesManager } from '@sudobility/testomniac_lib';
import { SEO } from '@sudobility/seo_lib';
import { Section } from '@sudobility/components';
import { buttonVariant, variants, ui, colors } from '@sudobility/design';
import LocalizedLink from '../components/layout/LocalizedLink';
import { formatDateTime } from '../utils/formatDateTime';
import { seoConfig } from '../config/seo';
import { analyticsService } from '../config/analytics';

/**
 * Page displaying the user's history entries with stats, a creation form,
 * and a list of individual history records. Requires authentication.
 */
export default function HistoriesPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const { t, i18n } = useTranslation('common');
  const { user } = useAuthStatus();
  const { networkClient, baseUrl, token } = useApi();

  const { histories, total, percentage, isLoading, error, createHistory } = useHistoriesManager({
    baseUrl,
    networkClient,
    entitySlug: entitySlug ?? null,
    token: token ?? null,
  });

  const [showForm, setShowForm] = useState(false);
  const [datetime, setDatetime] = useState('');
  const [value, setValue] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    analyticsService.trackPageView('/histories', 'Histories');
  }, []);

  /** Sum of all user history values, computed once per histories change. */
  const userTotal = useMemo(() => histories.reduce((sum, h) => sum + h.value, 0), [histories]);

  if (!user) {
    return (
      <Section spacing="xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-theme-text-primary mb-4">
            {t('histories.title')}
          </h1>
          <p className="text-theme-text-secondary mb-6">{t('histories.loginPrompt')}</p>
          <LocalizedLink to="/login" className={`px-6 py-3 rounded-lg ${buttonVariant('primary')}`}>
            {t('nav.login')}
          </LocalizedLink>
        </div>
      </Section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!datetime || !value) return;

    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      setSubmitError('Value must be a positive number.');
      return;
    }

    const parsedDate = new Date(datetime);
    if (Number.isNaN(parsedDate.getTime())) {
      setSubmitError('Please enter a valid date and time.');
      return;
    }

    try {
      setIsSubmitting(true);
      analyticsService.trackButtonClick('submit_history', { value: numericValue });
      await createHistory({
        datetime: parsedDate.toISOString(),
        value: numericValue,
      });
      analyticsService.trackEvent('history_created');
      setDatetime('');
      setValue('');
      setShowForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create history entry.';
      analyticsService.trackError(message, 'create_history_error');
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Combined error message from the manager hook or local submit error. */
  const displayError = submitError ?? error;

  return (
    <Section spacing="md">
      <SEO config={seoConfig} title={t('histories.title')} noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-theme-text-primary">{t('histories.title')}</h1>
        <button
          onClick={() => {
            analyticsService.trackButtonClick(showForm ? 'cancel_add_history' : 'add_history');
            setShowForm(!showForm);
            setSubmitError(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm ${buttonVariant('primary')}`}
          aria-expanded={showForm}
          aria-controls="history-form"
        >
          {showForm ? t('common.cancel') : t('histories.add')}
        </button>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
        role="region"
        aria-label="History statistics"
      >
        <div className="p-4 rounded-lg border border-theme-border">
          <p className="text-sm text-theme-text-tertiary">{t('histories.yourTotal')}</p>
          <p className="text-2xl font-bold text-theme-text-primary">{userTotal.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg border border-theme-border">
          <p className="text-sm text-theme-text-tertiary">{t('histories.globalTotal')}</p>
          <p className="text-2xl font-bold text-theme-text-primary">{total.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg border border-theme-border">
          <p className="text-sm text-theme-text-tertiary">{t('histories.percentage')}</p>
          <p className="text-2xl font-bold text-blue-600">{percentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form
          id="history-form"
          onSubmit={handleSubmit}
          className="mb-6 p-4 rounded-lg border border-theme-border"
          aria-label="Create history entry"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="history-datetime"
                className="block text-sm font-medium text-theme-text-secondary mb-1"
              >
                {t('histories.datetime')}
              </label>
              <input
                id="history-datetime"
                type="datetime-local"
                value={datetime}
                onChange={e => setDatetime(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-theme-border bg-theme-bg-primary text-theme-text-primary"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label
                htmlFor="history-value"
                className="block text-sm font-medium text-theme-text-secondary mb-1"
              >
                {t('histories.value')}
              </label>
              <input
                id="history-value"
                type="number"
                step="0.01"
                min="0.01"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-theme-border bg-theme-bg-primary text-theme-text-primary"
                required
                aria-required="true"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-4 px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariant('primary')}`}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? t('common.loading', 'Loading...') : t('histories.create')}
          </button>
        </form>
      )}

      {/* Error */}
      {displayError && (
        <div
          role="alert"
          className={`mb-4 p-3 rounded-lg text-sm ${colors.component.alert.error.base} ${colors.component.alert.error.dark}`}
        >
          {displayError}
        </div>
      )}

      {/* Loading */}
      {isLoading && histories.length === 0 && (
        <div className="text-center py-8">
          <div
            role="status"
            aria-label="Loading histories"
            className={`mx-auto ${variants.loading.spinner.default()}`}
          />
        </div>
      )}

      {/* Histories List */}
      {histories.length === 0 && !isLoading ? (
        <p className="text-center text-theme-text-tertiary py-8">{t('histories.empty')}</p>
      ) : (
        <div className="space-y-2" role="list" aria-label="History entries">
          {histories.map(history => (
            <LocalizedLink
              key={history.id}
              to={`/dashboard/${entitySlug}/histories/${history.id}`}
              className={`block p-4 rounded-lg border border-theme-border hover:bg-theme-hover-bg ${ui.transition.default}`}
              role="listitem"
            >
              <div className="flex justify-between items-center">
                <span className="text-theme-text-secondary text-sm">
                  {formatDateTime(history.datetime, i18n.language)}
                </span>
                <span className="text-lg font-semibold text-theme-text-primary">
                  {history.value.toFixed(2)}
                </span>
              </div>
            </LocalizedLink>
          ))}
        </div>
      )}
    </Section>
  );
}
