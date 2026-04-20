import { useParams } from 'react-router-dom';

interface ComponentCard {
  id: number;
  name: string;
  selector: string;
  instanceCount: number;
  identicalCount: number;
  variantCount: number;
}

export default function ComponentsPage() {
  const { runId: _runId } = useParams<{ runId: string }>();

  // TODO: Replace with useRunComponents hook when API is live
  const components: ComponentCard[] = [];
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Reusable Components
      </h1>

      {components.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No reusable components detected.</p>
      ) : (
        <div className="space-y-3">
          {components.map(comp => (
            <div
              key={comp.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {comp.name}
                  </div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                    {comp.selector}
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>{comp.instanceCount} instances</span>
                  <span className="text-green-600">{comp.identicalCount} identical</span>
                  {comp.variantCount > 0 && (
                    <span className="text-yellow-600">{comp.variantCount} variants</span>
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
