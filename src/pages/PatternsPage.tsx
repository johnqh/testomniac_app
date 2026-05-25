import { type ReactNode, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunPatterns } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

const PATTERN_LABELS: Record<string, string> = {
  card: 'Card',
  table: 'Table',
  form: 'Form',
  modal: 'Modal',
  toast: 'Toast',
  alert: 'Alert',
  tabs: 'Tabs',
  accordion: 'Accordion',
  carousel: 'Carousel',
  dropdown: 'Dropdown',
  pagination: 'Pagination',
  skeleton: 'Skeleton',
  emptyState: 'Empty State',
  errorMessage: 'Error Message',
  progressBar: 'Progress Bar',
  tooltip: 'Tooltip',
  badge: 'Badge',
  avatar: 'Avatar',
  tag: 'Tag',
  stepper: 'Stepper',
};

const PATTERN_ICONS: Record<string, ReactNode> = {
  card: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="2" width="12" height="10" rx="1" />
      <line x1="1" y1="5.5" x2="13" y2="5.5" />
    </svg>
  ),
  table: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="1" width="12" height="12" rx="1" />
      <line x1="1" y1="5" x2="13" y2="5" />
      <line x1="1" y1="9" x2="13" y2="9" />
      <line x1="5" y1="1" x2="5" y2="13" />
      <line x1="9" y1="1" x2="9" y2="13" />
    </svg>
  ),
  form: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="10" height="3" rx="0.5" />
      <rect x="2" y="7" width="10" height="3" rx="0.5" />
      <rect x="4" y="11.5" width="6" height="1.5" rx="0.5" />
    </svg>
  ),
  modal: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="3" width="10" height="8" rx="1" />
      <line x1="10" y1="4.5" x2="10.5" y2="4.5" strokeWidth="2" />
    </svg>
  ),
  toast: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="9" width="12" height="4" rx="1" />
      <line x1="3" y1="11" x2="8" y2="11" />
    </svg>
  ),
  alert: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 1L13 12H1L7 1z" />
      <line x1="7" y1="5" x2="7" y2="8" />
      <circle cx="7" cy="10" r="0.5" fill="currentColor" />
    </svg>
  ),
  tabs: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="4" width="12" height="9" rx="0.5" />
      <rect x="1" y="1" width="4" height="3" rx="0.5" />
      <rect x="5.5" y="1" width="4" height="3" rx="0.5" />
    </svg>
  ),
  accordion: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="1" width="12" height="3" rx="0.5" />
      <rect x="1" y="5.5" width="12" height="3" rx="0.5" />
      <rect x="1" y="10" width="12" height="3" rx="0.5" />
      <polyline points="10,2.5 11,3 10,3.5" />
    </svg>
  ),
  carousel: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="2" width="8" height="8" rx="0.5" />
      <polyline points="1,5 2,7 1,9" />
      <polyline points="13,5 12,7 13,9" />
      <circle cx="5.5" cy="12" r="0.7" fill="currentColor" />
      <circle cx="7" cy="12" r="0.7" fill="currentColor" />
      <circle cx="8.5" cy="12" r="0.7" fill="currentColor" />
    </svg>
  ),
  dropdown: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="10" height="3" rx="0.5" />
      <polyline points="9,3 10,4 11,3" />
      <rect x="2" y="6" width="10" height="7" rx="0.5" />
      <line x1="4" y1="8" x2="10" y2="8" />
      <line x1="4" y1="10.5" x2="10" y2="10.5" />
    </svg>
  ),
  pagination: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <polyline points="2,7 3.5,5.5 2,4" />
      <rect x="4.5" y="4.5" width="2" height="5" rx="0.5" />
      <rect x="7.5" y="4.5" width="2" height="5" rx="0.5" />
      <polyline points="12,4 10.5,5.5 12,7" />
    </svg>
  ),
  skeleton: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="2" width="5" height="3" rx="0.5" strokeDasharray="2 1" />
      <rect x="8" y="2" width="5" height="3" rx="0.5" strokeDasharray="2 1" />
      <rect x="1" y="7" width="12" height="2" rx="0.5" strokeDasharray="2 1" />
      <rect x="1" y="11" width="8" height="2" rx="0.5" strokeDasharray="2 1" />
    </svg>
  ),
  emptyState: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="10" height="10" rx="1" strokeDasharray="2 2" />
      <line x1="5" y1="7" x2="9" y2="7" />
    </svg>
  ),
  errorMessage: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="7" cy="7" r="5.5" />
      <line x1="7" y1="4" x2="7" y2="7.5" />
      <circle cx="7" cy="9.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  progressBar: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="5.5" width="12" height="3" rx="1.5" />
      <rect x="1" y="5.5" width="7" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  tooltip: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="10" height="6" rx="1" />
      <path d="M6 8L7 10L8 8" />
    </svg>
  ),
  badge: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="4.5" width="10" height="5" rx="2.5" />
      <line x1="5" y1="7" x2="9" y2="7" />
    </svg>
  ),
  avatar: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="7" cy="5" r="3" />
      <path d="M2 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
    </svg>
  ),
  tag: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 7.5V2.5C1 1.9 1.4 1.5 2 1.5H7L13 7.5L7.5 13L1 7.5z" />
      <circle cx="4" cy="4.5" r="1" fill="currentColor" />
    </svg>
  ),
  stepper: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="3" cy="7" r="2" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="11" cy="7" r="2" />
      <line x1="5" y1="7" x2="5" y2="7" />
      <line x1="9" y1="7" x2="9" y2="7" />
    </svg>
  ),
};

interface GroupedPattern {
  patternType: string;
  totalCount: number;
  pageStateIds: number[];
}

export default function PatternsPage() {
  const { envId } = useParams<{ envId: string }>();
  const { networkClient, token } = useApi();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const {
    latestRun,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const { patterns, isLoading, error } = useRunPatterns({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: latestRun?.id ?? 0,
    token: token ?? '',
    enabled: !!envId && !!token && !!latestRun,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, GroupedPattern>();
    for (const p of patterns) {
      const existing = map.get(p.patternType);
      if (existing) {
        existing.totalCount += p.count;
        if (!existing.pageStateIds.includes(p.pageStateId)) {
          existing.pageStateIds.push(p.pageStateId);
        }
      } else {
        map.set(p.patternType, {
          patternType: p.patternType,
          totalCount: p.count,
          pageStateIds: [p.pageStateId],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.patternType.localeCompare(b.patternType));
  }, [patterns]);

  const uniqueTypes = useMemo(() => grouped.map(g => g.patternType), [grouped]);

  const filteredPatterns = typeFilter ? grouped.filter(g => g.patternType === typeFilter) : grouped;

  if (contextLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (contextError || error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error: {contextError || error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="UI Patterns" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">UI Patterns</h1>

      {uniqueTypes.length > 1 && (
        <div className="mb-4">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>
                {PATTERN_LABELS[type] ?? type}
              </option>
            ))}
          </select>
        </div>
      )}

      {filteredPatterns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No UI patterns detected
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            UI patterns will appear here after a scan detects them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatterns.map(pattern => (
            <div
              key={pattern.patternType}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-500 dark:text-gray-400">
                  {PATTERN_ICONS[pattern.patternType] ?? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="2" y="2" width="10" height="10" rx="1" />
                    </svg>
                  )}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {PATTERN_LABELS[pattern.patternType] ?? pattern.patternType}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {pattern.totalCount} instance{pattern.totalCount !== 1 ? 's' : ''}
                </span>
                <span>
                  {pattern.pageStateIds.length} page state
                  {pattern.pageStateIds.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
