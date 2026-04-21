import { useParams } from 'react-router-dom';
import { useScanProgressStore } from '@sudobility/testomniac_lib';
import { ScanProgressPanel } from '../components/scanner/ScanProgressPanel';
import { useEventSource } from '../hooks/useEventSource';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8027';

export default function PublicScanProgressPage() {
  const { runId } = useParams<{ runId: string }>();
  const store = useScanProgressStore();

  const { isConnected } = useEventSource({
    url: runId ? `${API_URL}/api/v1/runs/${runId}/stream` : null,
    onEvent: store.handleEvent,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Scan Progress</h1>

      <ScanProgressPanel
        phase={store.phase}
        pagesFound={store.pagesFound}
        pageStatesFound={store.pageStatesFound}
        actionsCompleted={store.actionsCompleted}
        issuesFound={store.issuesFound}
        events={store.events}
        isConnected={isConnected}
        isComplete={store.isComplete}
        latestScreenshotUrl={store.latestScreenshotUrl}
      />

      {store.isComplete && (
        <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            Scan complete! Create an account to view full results and manage your projects.
          </p>
        </div>
      )}
    </div>
  );
}
