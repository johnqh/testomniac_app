import { StatusBadge } from './StatusBadge';

interface RunSummaryCardProps {
  runId: number;
  status: string;
  phase?: string | null;
  startedAt?: string | null;
  pagesFound?: number;
  issuesFound?: number;
  onClick?: () => void;
}

export function RunSummaryCard({
  runId,
  status,
  phase,
  startedAt,
  pagesFound,
  issuesFound,
  onClick,
}: RunSummaryCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Run #{runId}</span>
        <StatusBadge status={status} />
      </div>
      {phase && <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phase: {phase}</div>}
      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
        {startedAt && <span>{new Date(startedAt).toLocaleDateString()}</span>}
        {pagesFound !== undefined && <span>{pagesFound} pages</span>}
        {issuesFound !== undefined && <span>{issuesFound} issues</span>}
      </div>
    </div>
  );
}
