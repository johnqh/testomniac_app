import { useParams, Navigate } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRun } from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export default function RunRedirect() {
  const { runId, entitySlug } = useParams<{ runId: string; entitySlug: string }>();
  const { networkClient, token } = useApi();
  const { currentLanguage } = useLocalizedNavigate();

  const { run, isLoading, error } = useRun({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: Number(runId),
    token: token ?? '',
    enabled: !!runId && !!token,
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading run details...</span>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500 py-8">{error || 'Run not found.'}</div>
      </div>
    );
  }

  return (
    <Navigate
      to={`/${currentLanguage}/dashboard/${entitySlug}/runners/${run.runnerId}/scans/${runId}`}
      replace
    />
  );
}
