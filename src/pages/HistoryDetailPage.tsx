import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStatus } from '@sudobility/auth-components';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useHistoriesManager } from '@sudobility/testomniac_lib';
import ScreenContainer from '../components/layout/ScreenContainer';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { formatDateTime } from '../utils/formatDateTime';

/**
 * Detail view for a single history entry. Shows the datetime, value,
 * and creation timestamp, with the ability to delete the record.
 */
export default function HistoryDetailPage() {
  const { historyId } = useParams<{ historyId: string }>();
  const { t, i18n } = useTranslation('common');
  const { user } = useAuthStatus();
  const { networkClient, baseUrl, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const { histories, deleteHistory, isLoading } = useHistoriesManager({
    baseUrl,
    networkClient,
    userId: user?.uid ?? null,
    token: token ?? null,
  });

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const history = histories.find(h => h.id === historyId);

  if (isLoading && !history) {
    return (
      <ScreenContainer>
        <div className="container-app px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div
            role="status"
            aria-label="Loading history detail"
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
          />
        </div>
      </ScreenContainer>
    );
  }

  if (!history) {
    return (
      <ScreenContainer>
        <div className="container-app px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-theme-text-secondary">{t('histories.notFound')}</p>
        </div>
      </ScreenContainer>
    );
  }

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      setIsDeleting(true);
      await deleteHistory(history.id);
      navigate('/histories');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete history entry.';
      setDeleteError(message);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-theme-text-primary mb-6">
            {t('histories.detail')}
          </h1>

          {/* Delete error */}
          {deleteError && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm"
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
              <p className="text-2xl font-bold text-theme-text-primary">
                {history.value.toFixed(2)}
              </p>
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
              onClick={() => navigate('/histories')}
              className="px-4 py-2 border border-theme-border rounded-lg text-theme-text-primary hover:bg-theme-hover-bg text-sm"
            >
              {t('common.back')}
            </button>

            {showDeleteConfirm ? (
              <div className="flex gap-2 items-center" role="alert">
                <span className="text-sm text-red-600 dark:text-red-400">
                  {t('common.confirmDelete', 'Are you sure?')}
                </span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}
