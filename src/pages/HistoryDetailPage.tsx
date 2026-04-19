import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useHistoriesManager } from '@sudobility/testomniac_lib';
import { SEO } from '@sudobility/seo_lib';
import { Section } from '@sudobility/components';
import { buttonVariant, variants, colors } from '@sudobility/design';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { formatDateTime } from '../utils/formatDateTime';
import { seoConfig } from '../config/seo';
import { analyticsService } from '../config/analytics';

/**
 * Detail view for a single history entry. Shows the datetime, value,
 * and creation timestamp, with the ability to delete the record.
 */
export default function HistoryDetailPage() {
  const { entitySlug, historyId } = useParams<{ entitySlug: string; historyId: string }>();
  const { t, i18n } = useTranslation('common');
  const { networkClient, baseUrl, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { histories, deleteHistory, isLoading } = useHistoriesManager({
    baseUrl,
    networkClient,
    entitySlug: entitySlug ?? null,
    token: token ?? null,
  });

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    analyticsService.trackPageView(`/histories/${historyId}`, 'HistoryDetail');
  }, [historyId]);

  const history = histories.find(h => h.id === historyId);

  if (isLoading && !history) {
    return (
      <Section spacing="xl">
        <div className="text-center">
          <div
            role="status"
            aria-label="Loading history detail"
            className={`mx-auto ${variants.loading.spinner.default()}`}
          />
        </div>
      </Section>
    );
  }

  if (!history) {
    return (
      <Section spacing="xl">
        <div className="text-center">
          <p className="text-theme-text-secondary">{t('histories.notFound')}</p>
        </div>
      </Section>
    );
  }

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      setIsDeleting(true);
      analyticsService.trackButtonClick('delete_history');
      await deleteHistory(history.id);
      analyticsService.trackEvent('history_deleted');
      navigate(`/dashboard/${entitySlug}/histories`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete history entry.';
      analyticsService.trackError(message, 'delete_history_error');
      setDeleteError(message);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Section spacing="md" maxWidth="lg">
      <SEO config={seoConfig} title={t('histories.detail')} noIndex />
      <h1 className="text-2xl font-bold text-theme-text-primary mb-6">{t('histories.detail')}</h1>

      {deleteError && (
        <div
          role="alert"
          className={`mb-4 p-3 rounded-lg text-sm ${colors.component.alert.error.base} ${colors.component.alert.error.dark}`}
        >
          {deleteError}
        </div>
      )}

      <div className="p-6 rounded-lg border border-theme-border space-y-4">
        <div>
          <p className="text-sm text-theme-text-tertiary">{t('histories.datetime')}</p>
          <p className="text-lg text-theme-text-primary">
            {formatDateTime(history.datetime, i18n.language)}
          </p>
        </div>
        <div>
          <p className="text-sm text-theme-text-tertiary">{t('histories.value')}</p>
          <p className="text-2xl font-bold text-theme-text-primary">{history.value.toFixed(2)}</p>
        </div>
        {history.created_at && (
          <div>
            <p className="text-sm text-theme-text-tertiary">{t('histories.createdAt')}</p>
            <p className="text-sm text-theme-text-secondary">
              {formatDateTime(history.created_at, i18n.language)}
            </p>
          </div>
        )}
      </div>
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate(`/dashboard/${entitySlug}/histories`)}
          className="px-4 py-2 border border-theme-border rounded-lg text-theme-text-primary hover:bg-theme-hover-bg text-sm"
        >
          {t('common.back')}
        </button>

        {showDeleteConfirm ? (
          <div className="flex gap-2 items-center" role="alert">
            <span className={`text-sm ${colors.component.alert.error.icon}`}>
              {t('common.confirmDelete', 'Are you sure?')}
            </span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariant('destructive')}`}
              aria-busy={isDeleting}
            >
              {isDeleting ? t('common.loading', 'Loading...') : t('common.confirm', 'Confirm')}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-theme-border rounded-lg text-theme-text-primary hover:bg-theme-hover-bg text-sm"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={`px-4 py-2 rounded-lg text-sm ${buttonVariant('destructive')}`}
          >
            {t('common.delete')}
          </button>
        )}
      </div>
    </Section>
  );
}
