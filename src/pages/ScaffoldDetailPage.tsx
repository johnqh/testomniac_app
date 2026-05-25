import { type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useRunScaffolds } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import BackLink from '../components/navigation/BackLink';
import { CONSTANTS } from '../config/constants';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const SCAFFOLD_LABELS: Record<string, string> = {
  topMenu: 'Top navigation',
  footer: 'Footer',
  breadcrumb: 'Breadcrumb',
  leftMenu: 'Left navigation',
  hamburgerMenu: 'Hamburger menu',
  rightSidebar: 'Right sidebar',
  searchBar: 'Search bar',
  userMenu: 'User menu',
  cookieBanner: 'Cookie banner',
  chatWidget: 'Chat widget',
  socialLinks: 'Social links',
  skipNav: 'Skip navigation',
  languageSwitcher: 'Language switcher',
  announcementBar: 'Announcement bar',
  backToTop: 'Back to top',
};

const SCAFFOLD_ICONS: Record<string, ReactNode> = {
  topMenu: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="1" width="12" height="3" rx="0.5" />
      <line x1="3" y1="2.5" x2="5" y2="2.5" />
      <line x1="6.5" y1="2.5" x2="8.5" y2="2.5" />
      <line x1="10" y1="2.5" x2="11" y2="2.5" />
    </svg>
  ),
  footer: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="10" width="12" height="3" rx="0.5" />
      <line x1="3" y1="11.5" x2="7" y2="11.5" />
    </svg>
  ),
  breadcrumb: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2,5 4.5,7 2,9" />
      <polyline points="5.5,5 8,7 5.5,9" />
      <polyline points="9,5 11.5,7 9,9" />
    </svg>
  ),
  leftMenu: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="1" width="12" height="12" rx="1" />
      <line x1="5" y1="1" x2="5" y2="13" />
      <line x1="2.5" y1="4" x2="4" y2="4" />
      <line x1="2.5" y1="6.5" x2="4" y2="6.5" />
      <line x1="2.5" y1="9" x2="4" y2="9" />
    </svg>
  ),
  hamburgerMenu: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="2" y1="3.5" x2="12" y2="3.5" />
      <line x1="2" y1="7" x2="12" y2="7" />
      <line x1="2" y1="10.5" x2="12" y2="10.5" />
    </svg>
  ),
  rightSidebar: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="1" width="12" height="12" rx="1" />
      <line x1="9" y1="1" x2="9" y2="13" />
      <line x1="10" y1="4" x2="11.5" y2="4" />
      <line x1="10" y1="6.5" x2="11.5" y2="6.5" />
    </svg>
  ),
  searchBar: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="6" cy="6" r="4" />
      <line x1="9" y1="9" x2="12.5" y2="12.5" />
    </svg>
  ),
  userMenu: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="7" cy="5" r="2.5" />
      <path d="M2.5 13c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
    </svg>
  ),
  cookieBanner: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 3.5C2 2.67 2.67 2 3.5 2h7c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5h-7C2.67 12 2 11.33 2 10.5v-7z" />
      <path d="M5 5.5v0" strokeWidth="2" />
      <path d="M7 8v0" strokeWidth="2" />
      <path d="M9.5 5v0" strokeWidth="2" />
    </svg>
  ),
  chatWidget: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2.5C2 1.67 2.67 1 3.5 1h7c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5H6l-2.5 2.5V9H3.5C2.67 9 2 8.33 2 7.5v-5z" />
    </svg>
  ),
  socialLinks: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="3" cy="7" r="1.5" />
      <circle cx="11" cy="3.5" r="1.5" />
      <circle cx="11" cy="10.5" r="1.5" />
      <line x1="4.3" y1="6.3" x2="9.7" y2="4.2" />
      <line x1="4.3" y1="7.7" x2="9.7" y2="9.8" />
    </svg>
  ),
  skipNav: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2,3 7,7 2,11" />
      <line x1="7" y1="3" x2="7" y2="11" />
      <line x1="10" y1="3" x2="10" y2="11" />
      <polyline points="10,5 12.5,7 10,9" />
    </svg>
  ),
  languageSwitcher: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="7" cy="7" r="5.5" />
      <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
      <line x1="1.5" y1="7" x2="12.5" y2="7" />
    </svg>
  ),
  announcementBar: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 2L4 5H2.5C1.67 5 1 5.67 1 6.5v0c0 .83.67 1.5 1.5 1.5H4l7 3V2z" />
      <line x1="13" y1="5" x2="13" y2="8" />
      <line x1="4" y1="8" x2="4.5" y2="12" />
    </svg>
  ),
  backToTop: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="7" y1="12" x2="7" y2="3" />
      <polyline points="3.5,6 7,2.5 10.5,6" />
    </svg>
  ),
};

export default function ScaffoldDetailPage() {
  const { entitySlug, envId, scaffoldId } = useParams<{
    entitySlug: string;
    envId: string;
    scaffoldId: string;
  }>();
  const { navigate } = useLocalizedNavigate();
  const {
    networkClient,
    token,
    latestRun,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const basePath = `/dashboard/${entitySlug}/environments/${envId}`;

  const { scaffolds, isLoading, error } = useRunScaffolds({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runId: latestRun?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!latestRun,
  });

  const numericScaffoldId = Number(scaffoldId);
  const scaffold = scaffolds.find(s => s.id === numericScaffoldId);
  const pagePaths = Array.isArray((scaffold as unknown as { pagePaths?: string[] })?.pagePaths)
    ? (scaffold as unknown as { pagePaths: string[] }).pagePaths
    : [];

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

  if (!scaffold) {
    return (
      <div className="p-6">
        <BackLink label="Scaffolds" onClick={() => navigate(`${basePath}/scaffolds`)} />
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Scaffold not found</div>
      </div>
    );
  }

  const label = SCAFFOLD_LABELS[scaffold.type] ?? scaffold.type;

  return (
    <div className="p-6">
      <SEOHead title={label} description="" noIndex />
      <BackLink label="Scaffolds" onClick={() => navigate(`${basePath}/scaffolds`)} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <span className="text-gray-500 dark:text-gray-400">{SCAFFOLD_ICONS[scaffold.type]}</span>
          <h1 className="text-2xl font-bold">{label}</h1>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          <DetailRow label="Type" value={scaffold.type} />
          <DetailRow label="Element ID" value={String(scaffold.htmlElementId)} mono />
          {scaffold.htmlHash && <DetailRow label="HTML Hash" value={scaffold.htmlHash} mono />}
          {scaffold.createdAt && (
            <DetailRow label="Created" value={new Date(scaffold.createdAt).toLocaleString()} />
          )}
        </div>

        {/* Page paths */}
        {pagePaths.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Page paths ({pagePaths.length})
            </h2>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {pagePaths.map((path: string) => (
                <div
                  key={path}
                  className="px-4 py-2.5 text-sm font-mono text-gray-700 dark:text-gray-300"
                >
                  {path}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center px-4 py-3">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">
        {label}
      </span>
      <span className={`text-sm text-gray-900 dark:text-gray-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
