import SEOHead from '@/components/SEOHead';

export default function BundlesPage() {
  return (
    <div className="p-6">
      <SEOHead title="Bundles" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Test Suite Bundles
      </h1>

      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">No bundles yet</div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Create a bundle to group test suites for scheduled or manual execution.
        </p>
      </div>
    </div>
  );
}
