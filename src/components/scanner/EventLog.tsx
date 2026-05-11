import type { TestRunStreamEvent } from '@sudobility/testomniac_types';

interface EventLogProps {
  events: TestRunStreamEvent[];
  maxHeight?: string;
}

export function EventLog({ events, maxHeight = '300px' }: EventLogProps) {
  const renderPayload = (event: TestRunStreamEvent) => {
    const payload = event.payload as Record<string, unknown>;
    if (event.type === 'finding_created') {
      const title = String(payload.title ?? '');
      const description = String(payload.description ?? '');
      return (
        <div className="space-y-0.5">
          <div className="text-red-700 dark:text-red-300">{title}</div>
          {description && (
            <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
              {description}
            </div>
          )}
        </div>
      );
    }
    if (event.type === 'run_failed') {
      const error = String(payload.error ?? payload.status ?? '');
      return (
        <div className="text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
          {error || 'Run failed'}
        </div>
      );
    }

    return (
      <span className="text-gray-600 dark:text-gray-300 break-words">
        {JSON.stringify(event.payload)}
      </span>
    );
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Event Log ({events.length})
        </span>
      </div>
      <div className="overflow-y-auto font-mono text-xs" style={{ maxHeight }}>
        {events.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-400">Waiting for events...</div>
        ) : (
          events.map((event, i) => (
            <div
              key={i}
              className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <span className="text-gray-400">
                {new Date(event.createdAt).toLocaleTimeString()}
              </span>{' '}
              <span className="text-blue-600 dark:text-blue-400">{event.type}</span>{' '}
              {renderPayload(event)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
