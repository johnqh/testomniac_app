import type { RunStreamEvent } from '@sudobility/testomniac_types';
import { PhaseIndicator } from './PhaseIndicator';
import { LiveCounters } from './LiveCounters';
import { EventLog } from './EventLog';

interface ScanProgressPanelProps {
  phase: string;
  pagesFound: number;
  pageStatesFound: number;
  actionsCompleted: number;
  issuesFound: number;
  events: RunStreamEvent[];
  isConnected: boolean;
  isComplete: boolean;
  latestScreenshotUrl?: string | null;
}

export function ScanProgressPanel({
  phase,
  pagesFound,
  pageStatesFound,
  actionsCompleted,
  issuesFound,
  events,
  isConnected,
  isComplete,
  latestScreenshotUrl,
}: ScanProgressPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PhaseIndicator currentPhase={phase} />
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

      <LiveCounters
        pagesFound={pagesFound}
        pageStatesFound={pageStatesFound}
        actionsCompleted={actionsCompleted}
        issuesFound={issuesFound}
      />

      {latestScreenshotUrl && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Current Page
            </span>
          </div>
          <img src={latestScreenshotUrl} alt="Current scan page" className="w-full h-auto" />
        </div>
      )}

      <EventLog events={events} />
    </div>
  );
}
