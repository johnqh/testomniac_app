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
const TestElementsPage = lazy(() => import('./pages/TestElementsPage'));
const PagesPage = lazy(() => import('./pages/PagesPage'));
const ScaffoldsPage = lazy(() => import('./pages/ScaffoldsPage'));
const PersonasPage = lazy(() => import('./pages/PersonasPage'));
const PageDetailPage = lazy(() => import('./pages/PageDetailPage'));
const PageStateDetailPage = lazy(() => import('./pages/PageStateDetailPage'));
const RunnerGraphPage = lazy(() => import('./pages/RunnerGraphPage'));
const PageGraphPage = lazy(() => import('./pages/PageGraphPage'));
const RunRedirect = lazy(() => import('./pages/RunRedirect'));
const BundlesPage = lazy(() => import('./pages/BundlesPage'));
const SchedulesPage = lazy(() => import('./pages/SchedulesPage'));
const TestSurfacesListPage = lazy(() => import('./pages/TestSurfacesListPage'));
const TestSurfaceDetailPage = lazy(() => import('./pages/TestSurfaceDetailPage'));
const TestElementDetailPage = lazy(() => import('./pages/TestElementDetailPage'));
const TestRunsListPage = lazy(() => import('./pages/TestRunsListPage'));
const TestRunDetailPage = lazy(() => import('./pages/TestRunDetailPage'));
const FindingsListPage = lazy(() => import('./pages/FindingsListPage'));
const TestScenariosPage = lazy(() => import('./pages/TestScenariosPage'));
const TestScenarioDetailPage = lazy(() => import('./pages/TestScenarioDetailPage'));
const RunnerSettingsPage = lazy(() => import('./pages/RunnerSettingsPage'));
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

                  {/* Environment dashboard routes */}
                  <Route path="environments/:envId/bundles" element={<BundlesPage />} />
                  <Route
                    path="environments/:envId/test-surfaces"
                    element={<TestSurfacesListPage />}
                  />
                  <Route
                    path="environments/:envId/test-surfaces/:surfaceId"
                    element={<TestSurfaceDetailPage />}
                  />
                  <Route path="environments/:envId/test-elements" element={<TestElementsPage />} />
                  <Route
                    path="environments/:envId/test-elements/:elementId"
                    element={<TestElementDetailPage />}
                  />
                  <Route path="environments/:envId/runs" element={<TestRunsListPage />} />
                  <Route path="environments/:envId/runs/:runId" element={<TestRunDetailPage />} />
                  <Route path="environments/:envId/runs/:runId/pages" element={<PagesPage />} />
                  <Route
                    path="environments/:envId/runs/:runId/issues"
                    element={<FindingsListPage />}
                  />
                  <Route
                    path="environments/:envId/runs/:runId/pages/:pageId"
                    element={<PageDetailPage />}
                  />
                  <Route
                    path="environments/:envId/runs/:runId/pages/:pageId/states/:pageStateId"
                    element={<PageStateDetailPage />}
                  />
                  <Route
                    path="environments/:envId/runs/:runId/progress"
                    element={<ScanProgressPage />}
                  />
                  <Route
                    path="environments/:envId/test-scenarios"
                    element={<TestScenariosPage />}
                  />
                  <Route
                    path="environments/:envId/test-scenarios/:scenarioId"
                    element={<TestScenarioDetailPage />}
                  />
                  <Route path="environments/:envId/issues" element={<FindingsListPage />} />
                  <Route path="environments/:envId/schedules" element={<SchedulesPage />} />
                  <Route path="environments/:envId/settings" element={<RunnerSettingsPage />} />

                  {/* Additional environment data routes */}
                  <Route path="environments/:envId/pages" element={<PagesPage />} />
                  <Route path="environments/:envId/pages/:pageId" element={<PageDetailPage />} />
                  <Route
                    path="environments/:envId/pages/:pageId/states/:pageStateId"
                    element={<PageStateDetailPage />}
                  />
                  <Route path="environments/:envId/graph" element={<RunnerGraphPage />} />
                  <Route
                    path="environments/:envId/pages/:pageId/graph"
                    element={<PageGraphPage />}
                  />
                  <Route path="environments/:envId/scaffolds" element={<ScaffoldsPage />} />
                  <Route path="environments/:envId/personas" element={<PersonasPage />} />

                  {/* Legacy run routes */}
                  <Route path="runs/:runId" element={<RunRedirect />} />
                  <Route path="runs/:runId/*" element={<RunRedirect />} />

                  {/* Entity management routes */}
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
