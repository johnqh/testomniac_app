import type { ReactNode } from 'react';

const PHASE_ICONS: Record<string, ReactNode> = {
  scanning: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 7L10.5 3.5" />
      <circle cx="7" cy="7" r="1" />
    </svg>
  ),
  testing: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 1.5h4" />
      <path d="M5.5 1.5v3.5L3 11a1.5 1.5 0 0 0 1.3 2h5.4a1.5 1.5 0 0 0 1.3-2L8.5 5V1.5" />
    </svg>
  ),
  completed: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="5.5" />
      <polyline points="4.5,7 6.5,9 9.5,5" />
    </svg>
  ),
};

const PHASES = [
  { key: 'scanning', label: 'Scanning' },
  { key: 'testing', label: 'Testing' },
  { key: 'completed', label: 'Complete' },
];

interface PhaseIndicatorProps {
  currentPhase: string;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIndex = PHASES.findIndex(p => p.key === currentPhase);

  return (
    <div className="flex items-center gap-1">
      {PHASES.map((phase, i) => {
        const isActive = i === currentIndex;
        const isComplete = i < currentIndex;
        const baseClass = 'flex items-center gap-1.5';
        const iconColor = isComplete
          ? 'text-green-500'
          : isActive
            ? 'text-blue-500 animate-pulse'
            : 'text-gray-300 dark:text-gray-600';
        const textClass = isActive
          ? 'text-sm font-medium text-blue-600 dark:text-blue-400'
          : isComplete
            ? 'text-sm text-green-600 dark:text-green-400'
            : 'text-sm text-gray-400 dark:text-gray-500';

        return (
          <div key={phase.key} className={baseClass}>
            <span className={iconColor}>{PHASE_ICONS[phase.key]}</span>
            <span className={textClass}>{phase.label}</span>
            {i < PHASES.length - 1 && (
              <div className="w-4 h-px bg-gray-300 dark:bg-gray-600 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
