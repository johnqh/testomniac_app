const PHASES = [
  { key: 'mouse_scanning', label: 'Scanning' },
  { key: 'ai_analysis', label: 'AI Analysis' },
  { key: 'input_scanning', label: 'Input Testing' },
  { key: 'test_generation', label: 'Generating' },
  { key: 'test_execution', label: 'Executing' },
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
        const dotClass = isComplete
          ? 'w-2.5 h-2.5 rounded-full bg-green-500'
          : isActive
            ? 'w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse'
            : 'w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600';
        const textClass = isActive
          ? 'text-sm font-medium text-blue-600 dark:text-blue-400'
          : isComplete
            ? 'text-sm text-green-600 dark:text-green-400'
            : 'text-sm text-gray-400 dark:text-gray-500';

        return (
          <div key={phase.key} className={baseClass}>
            <div className={dotClass} />
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
