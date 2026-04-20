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

      <EventLog events={events} />
    </div>
  );
}
