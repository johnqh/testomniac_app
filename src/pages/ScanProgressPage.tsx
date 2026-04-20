import { useParams } from 'react-router-dom';
import { useScanProgressStore } from '@sudobility/testomniac_lib';
import { ScanProgressPanel } from '../components/scanner/ScanProgressPanel';
import { useEventSource } from '../hooks/useEventSource';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8027';

export default function ScanProgressPage() {
  const { entitySlug, runId } = useParams<{ entitySlug: string; runId: string }>();
  const store = useScanProgressStore();
  const { navigate } = useLocalizedNavigate();

  const { isConnected } = useEventSource({
    url: runId ? `${API_URL}/api/v1/runs/${runId}/stream` : null,
    onEvent: store.handleEvent,
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Scan Progress</h1>
        {store.isComplete && (
          <button
            onClick={() => navigate(`/dashboard/${entitySlug}/runs/${runId}`)}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            View Results
          </button>
        )}
      </div>

      <ScanProgressPanel
        phase={store.phase}
        pagesFound={store.pagesFound}
        pageStatesFound={store.pageStatesFound}
        actionsCompleted={store.actionsCompleted}
        issuesFound={store.issuesFound}
        events={store.events}
        isConnected={isConnected}
        isComplete={store.isComplete}
      />
    </div>
  );
}
