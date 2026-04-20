interface LiveCountersProps {
  pagesFound: number;
  pageStatesFound: number;
  actionsCompleted: number;
  issuesFound: number;
}

export function LiveCounters({
  pagesFound,
  pageStatesFound,
  actionsCompleted,
  issuesFound,
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
      label: 'Actions',
      value: actionsCompleted,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Issues',
      value: issuesFound,
      color: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {counters.map(c => (
        <div key={c.label} className="text-center">
          <div className={`text-2xl font-bold tabular-nums ${c.color}`}>{c.value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
