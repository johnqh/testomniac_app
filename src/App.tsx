import { Suspense, lazy, type ReactNode } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SudobilityAppWithFirebaseAuthAndEntities } from '@sudobility/building_blocks/firebase';
import { LanguageValidator, PerformancePanel } from '@sudobility/components';
import { variants } from '@sudobility/design';
import { isLanguageSupported, CONSTANTS } from './config/constants';
import i18n from './i18n';
import { useDocumentLanguage } from './hooks/useDocumentLanguage';
import { AuthProviderWrapper } from './components/providers/AuthProviderWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';
import ScreenContainer from './components/layout/ScreenContainer';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
const WorkspacesPage = lazy(() => import('./pages/WorkspacesPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const InvitationsPage = lazy(() => import('./pages/InvitationsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const StartScanPage = lazy(() => import('./pages/StartScanPage'));
const ScanProgressPage = lazy(() => import('./pages/ScanProgressPage'));
const PublicScanProgressPage = lazy(() => import('./pages/PublicScanProgressPage'));
const TestCasesPage = lazy(() => import('./pages/TestCasesPage'));
const TestRunsPage = lazy(() => import('./pages/TestRunsPage'));
const IssuesPage = lazy(() => import('./pages/IssuesPage'));
const PagesPage = lazy(() => import('./pages/PagesPage'));
const ComponentsPage = lazy(() => import('./pages/ComponentsPage'));
const PersonasPage = lazy(() => import('./pages/PersonasPage'));
const ScansPage = lazy(() => import('./pages/ScansPage'));
const PageDetailPage = lazy(() => import('./pages/PageDetailPage'));
const PageStateDetailPage = lazy(() => import('./pages/PageStateDetailPage'));
const AppGraphPage = lazy(() => import('./pages/AppGraphPage'));
const PageGraphPage = lazy(() => import('./pages/PageGraphPage'));
const RunRedirect = lazy(() => import('./pages/RunRedirect'));
const LanguageRedirect = lazy(() => import('./components/layout/LanguageRedirect'));
const EntityRedirect = lazy(() => import('./components/layout/EntityRedirect'));
const ProtectedRoute = lazy(() => import('./components/layout/ProtectedRoute'));

/**
 * Full-screen loading spinner displayed while lazy-loaded route
 * components are being fetched.
 */
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
    <div role="status" aria-label="Loading" className={variants.loading.spinner.default()} />
  </div>
);

function DocumentLanguageSync({ children }: { children: ReactNode }) {
  useDocumentLanguage();
  return <>{children}</>;
}

// Stable reference to prevent infinite re-renders
const PERFORMANCE_API_PATTERNS = ['/api/'];

function ScreenContainerLayout() {
  return (
    <ScreenContainer>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </ScreenContainer>
  );
}

function PerformancePanelComponent() {
  if (import.meta.env.VITE_SHOW_PERFORMANCE_MONITOR !== 'true') {
    return null;
  }
  return (
    <PerformancePanel
      enabled={true}
      position="bottom-right"
      apiPatterns={PERFORMANCE_API_PATTERNS}
    />
  );
}

function AppRoutes() {
  return (
    <DocumentLanguageSync>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LanguageRedirect />} />
            <Route
              path="/:lang"
              element={
                <LanguageValidator
                  isLanguageSupported={isLanguageSupported}
                  defaultLanguage="en"
                  storageKey="language"
                />
              }
            >
              <Route element={<ScreenContainerLayout />}>
                <Route index element={<HomePage />} />
                <Route path="docs" element={<DocsPage />} />
                <Route path="sitemap" element={<SitemapPage />} />
                <Route path="scan/:runId/progress" element={<PublicScanProgressPage />} />
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <EntityRedirect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="dashboard/:entitySlug"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardOverview />} />
                  <Route path="scan/new" element={<StartScanPage />} />

                  {/* App-centric routes */}
                  <Route path="apps/:appId/scans" element={<ScansPage />} />
                  <Route path="apps/:appId/scans/:scanId/progress" element={<ScanProgressPage />} />
                  <Route path="apps/:appId/test-cases" element={<TestCasesPage />} />
                  <Route path="apps/:appId/test-runs" element={<TestRunsPage />} />
                  <Route path="apps/:appId/issues" element={<IssuesPage />} />
                  <Route path="apps/:appId/pages" element={<PagesPage />} />
                  <Route path="apps/:appId/pages/:pageId" element={<PageDetailPage />} />
                  <Route
                    path="apps/:appId/pages/:pageId/states/:pageStateId"
                    element={<PageStateDetailPage />}
                  />
                  <Route path="apps/:appId/graph" element={<AppGraphPage />} />
                  <Route path="apps/:appId/pages/:pageId/graph" element={<PageGraphPage />} />
                  <Route path="apps/:appId/components" element={<ComponentsPage />} />
                  <Route path="apps/:appId/personas" element={<PersonasPage />} />

                  {/* Legacy run routes — redirect to app-centric */}
                  <Route path="runs/:runId" element={<RunRedirect />} />
                  <Route path="runs/:runId/*" element={<RunRedirect />} />

                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="workspaces" element={<WorkspacesPage />} />
                  <Route path="members" element={<MembersPage />} />
                  <Route path="invitations" element={<InvitationsPage />} />
                </Route>
              </Route>
              <Route path="login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="." replace />} />
            </Route>
            <Route path="*" element={<LanguageRedirect />} />
          </Routes>
          <PerformancePanelComponent />
        </Suspense>
      </ErrorBoundary>
    </DocumentLanguageSync>
  );
}

function App() {
  return (
    <SudobilityAppWithFirebaseAuthAndEntities
      i18n={i18n}
      baseUrl={CONSTANTS.API_URL}
      apiUrl={CONSTANTS.API_URL}
      testMode={CONSTANTS.DEV_MODE}
      AuthProviderWrapper={AuthProviderWrapper}
    >
      <AppRoutes />
    </SudobilityAppWithFirebaseAuthAndEntities>
  );
}

export default App;
