import SEOHead from '@/components/SEOHead';

export default function SchedulesPage() {
  return (
    <div className="p-6">
      <SEOHead title="Schedules" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedules</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Schedule
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          No schedules yet
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Create a schedule to automatically run test suites, cases, or bundles on a recurring
          basis.
        </p>
      </div>
    </div>
  );
}
