import { useEffect } from 'react';
import { useAuthStatus } from '@sudobility/auth-components';
import SEOHead from '@/components/SEOHead';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';

export default function AccountPage() {
  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/account', 'Account');
  }, []);

  const { user } = useAuthStatus();

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?';

  return (
    <>
      <SEOHead title="Account" description="" noIndex />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Account</h1>

        <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Avatar'}
              className="w-16 h-16 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-lg font-semibold">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {user.displayName && (
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                {user.displayName}
              </p>
            )}
            {user.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {user.providerId === 'google.com' ? 'Google account' : 'Email account'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
