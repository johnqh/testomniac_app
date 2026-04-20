interface PageCard {
  id: number;
  url: string;
  routeKey: string | null;
  stateCount: number;
  requiresLogin: boolean;
}

export default function PagesPage() {
  // const { runId } = useParams<{ runId: string }>();

  // TODO: Replace with useRunPages hook when API is live
  const pages: PageCard[] = [];
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Discovered Pages</h1>

      {pages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No pages discovered yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <div
              key={page.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
            >
              <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-xs text-gray-400">Screenshot</span>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {page.routeKey || new URL(page.url).pathname}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {page.url}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">{page.stateCount} states</span>
                  {page.requiresLogin && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                      Login
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
