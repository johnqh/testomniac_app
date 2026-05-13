import { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRunnerTestSurfaceBundles, TestomniacClient } from '@sudobility/testomniac_client';
import { CONSTANTS } from '../../config/constants';
import { useDashboardEnvironmentContext } from '../../hooks/useDashboardEnvironmentContext';

type ItemType = 'surface' | 'interaction' | 'scenario';

interface AddToBundleButtonProps {
  itemType: ItemType;
  itemId: number;
}

export function AddToBundleButton({ itemType, itemId }: AddToBundleButtonProps) {
  const { networkClient, token, primaryRunner } = useDashboardEnvironmentContext();
  const runnerId = primaryRunner?.id ?? 0;

  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { bundles } = useRunnerTestSurfaceBundles({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId,
    token,
    enabled: !!token && !!primaryRunner,
  });

  const nonDiscoveryBundles = useMemo(
    () => bundles.filter(b => b.title !== 'Discovery'),
    [bundles]
  );

  const client = useMemo(
    () => new TestomniacClient({ baseUrl: CONSTANTS.API_URL, networkClient }),
    [networkClient]
  );

  const mutation = useMutation({
    mutationFn: async (bundleId: number) => {
      if (itemType === 'surface') {
        return client.addSurfaceToBundle(runnerId, bundleId, itemId, token);
      } else if (itemType === 'interaction') {
        return client.addInteractionToBundle(runnerId, bundleId, itemId, token);
      } else {
        return client.addScenarioToBundle(runnerId, bundleId, itemId, token);
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = async (bundleId: number, bundleTitle: string) => {
    setOpen(false);
    setFeedback(null);
    try {
      await mutation.mutateAsync(bundleId);
      setFeedback(`Added to "${bundleTitle}"`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to add to bundle');
    }
  };

  if (!primaryRunner || nonDiscoveryBundles.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        disabled={mutation.isPending}
        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {mutation.isPending ? 'Adding...' : 'Add to Bundle'}
      </button>
      {feedback && (
        <span className="ml-2 text-xs text-green-600 dark:text-green-400">{feedback}</span>
      )}
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {nonDiscoveryBundles.map(bundle => (
            <button
              key={bundle.id}
              onClick={() => handleSelect(bundle.id, bundle.title)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {bundle.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
