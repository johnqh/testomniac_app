import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import { useRunnerScaffolds } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';

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

export default function ScaffoldsPage() {
  const { envId } = useParams<{ envId: string }>();
  const { networkClient, token } = useApi();

  const { scaffolds, isLoading, error } = useRunnerScaffolds({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: Number(envId),
    token: token ?? '',
    enabled: !!envId && !!token,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Scaffolds" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Scaffolds</h1>

      {scaffolds.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No scaffolds detected.</p>
      ) : (
        <div className="space-y-3">
          {scaffolds.map(scaffold => (
            <div
              key={scaffold.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {SCAFFOLD_LABELS[scaffold.type] ?? scaffold.type}
                  </div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                    {scaffold.type} · Element #{scaffold.htmlElementId}
                  </div>
                </div>
                {scaffold.htmlHash && (
                  <div className="text-xs font-mono text-gray-400 dark:text-gray-500">
                    {scaffold.htmlHash.slice(0, 8)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
