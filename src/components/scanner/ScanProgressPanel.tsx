import type { TestRunStreamEvent } from '@sudobility/testomniac_types';
import { LiveCounters } from './LiveCounters';
import { EventLog } from './EventLog';

interface ScanProgressPanelProps {
  pagesFound: number;
  pageStatesFound: number;
  testRunsCompleted: number;
  findingsFound: number;
  error?: string | null;
  events: TestRunStreamEvent[];
  isConnected: boolean;
  isComplete: boolean;
  latestScreenshotUrl?: string | null;
  currentPageUrl?: string | null;
}

export function ScanProgressPanel({
  pagesFound,
  pageStatesFound,
  testRunsCompleted,
  findingsFound,
  error,
  events,
  isConnected,
  isComplete,
  latestScreenshotUrl,
  currentPageUrl,
}: ScanProgressPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isComplete ? 'Discovery run finished' : 'Running discovery...'}
        </span>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Complete</span>
          ) : (
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <LiveCounters
        pagesFound={pagesFound}
        pageStatesFound={pageStatesFound}
        testRunsCompleted={testRunsCompleted}
        findingsFound={findingsFound}
      />

      {(latestScreenshotUrl || currentPageUrl) && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Current Page
            </span>
            {currentPageUrl && (
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate ml-2 max-w-[300px]">
                {currentPageUrl}
              </span>
            )}
          </div>
          {latestScreenshotUrl && (
            <img src={latestScreenshotUrl} alt="Current discovery page" className="w-full h-auto" />
          )}
        </div>
      )}

      <EventLog events={events} />
    </div>
  );
}
