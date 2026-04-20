import { useParams } from 'react-router-dom';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

export default function DashboardOverview() {
  const { entitySlug } = useParams<{ entitySlug: string }>();
  const { navigate } = useLocalizedNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Manage your web application tests and scan results.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate(`/dashboard/${entitySlug}/scan/new`)}
          className="p-6 text-left rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
        >
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Start New Scan
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter a URL to discover pages, run tests, and find issues
          </p>
        </button>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Runs</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            No runs yet. Start a scan to see results here.
          </p>
        </div>
      </div>
    </div>
  );
}
