interface LiveCountersProps {
  pagesFound: number;
  pageStatesFound: number;
  testRunsCompleted: number;
  findingsFound: number;
}

const COUNTER_ICONS: Record<string, React.ReactNode> = {
  Pages: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="3" y="2" width="10" height="12" rx="1.5" />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
    </svg>
  ),
  States: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
  'Case Runs': (
    <svg
      className="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  ),
  Findings: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 10.5v.5" />
    </svg>
  ),
};

export function LiveCounters({
  pagesFound,
  pageStatesFound,
  testRunsCompleted,
  findingsFound,
}: LiveCountersProps) {
  const counters = [
    {
      label: 'Pages',
      value: pagesFound,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'States',
      value: pageStatesFound,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Case Runs',
      value: testRunsCompleted,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Findings',
      value: findingsFound,
      color: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {counters.map(c => (
        <div key={c.label} className="text-center">
          <div className={`text-2xl font-bold tabular-nums ${c.color}`}>{c.value}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span className={c.color}>{COUNTER_ICONS[c.label]}</span>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
