# Dashboard Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tree-based dashboard sidebar with a flat menu using project/app selector dropdowns.

**Architecture:** Rewrite DashboardSidebar to render two Select dropdowns (project, app) at the top and a flat nav list below. Add new BundlesPage and SchedulesPage. Update routes to consolidate under `/apps/:appId/`.

**Tech Stack:** React 19, React Router v7, Tailwind CSS, `Select` from `@sudobility/components`, `@sudobility/testomniac_client` hooks

---

### Task 1: Rewrite DashboardSidebar

**Files:**
- Modify: `src/components/dashboard/DashboardSidebar.tsx`

- [ ] **Step 1: Replace the entire DashboardSidebar component**

```tsx
import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@sudobility/components';
import { useEntityProjects, useProjectApps } from '@sudobility/testomniac_client';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { CONSTANTS } from '../../config/constants';

interface DashboardSidebarProps {
  entitySlug: string;
}

const MENU_ITEMS = [
  { label: 'Bundles', path: 'bundles' },
  { label: 'Suites', path: 'test-suites' },
  { label: 'Test Cases', path: 'test-cases' },
  { label: 'Runs', path: 'runs' },
  { label: 'Issues', path: 'issues' },
  { label: 'Schedules', path: 'schedules' },
  { label: 'Settings', path: 'settings' },
];

export function DashboardSidebar({ entitySlug }: DashboardSidebarProps) {
  const { appId: routeAppId } = useParams<{ appId: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();
  const location = useLocation();

  const { projects, isLoading: projectsLoading } = useEntityProjects({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug,
    token: token ?? '',
    enabled: !!token,
  });

  // Auto-select project if only one exists
  const selectedProjectId = useMemo(() => {
    if (projects.length === 1) return String(projects[0].id);
    // Try to infer from current app route
    return null;
  }, [projects]);

  const { apps, isLoading: appsLoading } = useProjectApps({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    projectId: Number(selectedProjectId),
    token: token ?? '',
    enabled: !!selectedProjectId && !!token,
  });

  // Auto-select app if only one exists
  useEffect(() => {
    if (apps.length === 1 && !routeAppId) {
      navigate(`/dashboard/${entitySlug}/apps/${apps[0].id}/bundles`);
    }
  }, [apps, routeAppId, entitySlug, navigate]);

  const handleProjectChange = (value: string) => {
    if (value === 'new') {
      navigate(`/dashboard/${entitySlug}/projects/new`);
      return;
    }
    // When project changes, reset to project's first app (or show app selector)
  };

  const handleAppChange = (value: string) => {
    if (value === 'new') {
      navigate(`/dashboard/${entitySlug}/apps/new`);
      return;
    }
    navigate(`/dashboard/${entitySlug}/apps/${value}/bundles`);
  };

  // Active path detection
  const currentPath = useMemo(() => {
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    return location.pathname.slice(langPrefix.length - 1);
  }, [location.pathname]);

  const appBasePath = `/dashboard/${entitySlug}/apps/${routeAppId}`;

  const isActive = (menuPath: string) => {
    const full = `${appBasePath}/${menuPath}`;
    return currentPath === full || currentPath.startsWith(full + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Project & App Selectors */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
            Project
          </label>
          <Select
            value={selectedProjectId ?? undefined}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={projectsLoading ? 'Loading...' : 'Select project'} />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.title}
                </SelectItem>
              ))}
              <SelectItem value="new">+ Create New...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
            App
          </label>
          <Select
            value={routeAppId ?? undefined}
            onValueChange={handleAppChange}
            disabled={!selectedProjectId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={appsLoading ? 'Loading...' : 'Select app'} />
            </SelectTrigger>
            <SelectContent>
              {apps.map(a => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.title}
                </SelectItem>
              ))}
              <SelectItem value="new">+ Create New...</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Menu */}
      {routeAppId && (
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {MENU_ITEMS.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(`${appBasePath}/${item.path}`)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {!routeAppId && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Select a project and app to get started
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `bun run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/DashboardSidebar.tsx
git commit -m "refactor: rewrite DashboardSidebar with flat menu and project/app selectors"
```

---

### Task 2: Update routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy imports for new pages and consolidate app routes**

Add new lazy imports:
```tsx
const BundlesPage = lazy(() => import('./pages/BundlesPage'));
const SchedulesPage = lazy(() => import('./pages/SchedulesPage'));
```

- [ ] **Step 2: Update the dashboard route block**

Replace the app-centric routes section to consolidate under `apps/:appId/`:

```tsx
<Route path="dashboard/:entitySlug" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}>
  <Route index element={<DashboardOverview />} />

  {/* App dashboard routes */}
  <Route path="apps/:appId/bundles" element={<BundlesPage />} />
  <Route path="apps/:appId/test-suites" element={<TestSuitesListPage />} />
  <Route path="apps/:appId/test-suites/:suiteId" element={<TestSuiteDetailPage />} />
  <Route path="apps/:appId/test-cases" element={<TestCasesPage />} />
  <Route path="apps/:appId/test-cases/:caseId" element={<TestCaseDetailPage />} />
  <Route path="apps/:appId/runs" element={<TestRunsListPage />} />
  <Route path="apps/:appId/runs/:runId" element={<TestRunDetailPage />} />
  <Route path="apps/:appId/issues" element={<FindingsListPage />} />
  <Route path="apps/:appId/schedules" element={<SchedulesPage />} />
  <Route path="apps/:appId/settings" element={<AppSettingsPage />} />

  {/* Keep scan progress route */}
  <Route path="apps/:appId/runs/:runId/progress" element={<ScanProgressPage />} />

  {/* Entity management routes */}
  <Route path="settings" element={<SettingsPage />} />
  <Route path="workspaces" element={<WorkspacesPage />} />
  <Route path="members" element={<MembersPage />} />
  <Route path="invitations" element={<InvitationsPage />} />
</Route>
```

- [ ] **Step 3: Verify it compiles**

Run: `bun run typecheck`

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: consolidate dashboard routes under apps/:appId/"
```

---

### Task 3: Create BundlesPage

**Files:**
- Create: `src/pages/BundlesPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';

export default function BundlesPage() {
  const { entitySlug, appId } = useParams<{ entitySlug: string; appId: string }>();
  const { networkClient, token } = useApi();

  // TODO: useAppBundles hook will be added to testomniac_client
  // For now, show placeholder UI

  return (
    <div className="p-6">
      <SEOHead title="Bundles" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Test Suite Bundles
      </h1>

      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          No bundles yet
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Create a bundle to group test suites for scheduled or manual execution.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/BundlesPage.tsx
git commit -m "feat: add BundlesPage placeholder"
```

---

### Task 4: Create SchedulesPage

**Files:**
- Create: `src/pages/SchedulesPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useParams } from 'react-router-dom';
import { useApi } from '@sudobility/building_blocks/firebase';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';

export default function SchedulesPage() {
  const { entitySlug, appId } = useParams<{ entitySlug: string; appId: string }>();
  const { networkClient, token } = useApi();

  // TODO: useAppSchedules hook will be added to testomniac_client
  // For now, show placeholder UI

  return (
    <div className="p-6">
      <SEOHead title="Schedules" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Schedules
        </h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + New Schedule
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          No schedules yet
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Create a schedule to automatically run test suites, cases, or bundles on a recurring basis.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SchedulesPage.tsx
git commit -m "feat: add SchedulesPage placeholder"
```

---

### Task 5: Update FindingsListPage with filter toggle

**Files:**
- Modify: `src/pages/FindingsListPage.tsx`

- [ ] **Step 1: Add All/Errors Only filter if not already present**

The page already has a filter (`FilterMode` with 'all' | 'errors'). Verify the toggle UI is visible and working. If the `FindingsListPage` already has this functionality, no changes needed — it serves as the "Issues" page.

- [ ] **Step 2: Verify it compiles**

Run: `bun run typecheck`

- [ ] **Step 3: Commit (if changed)**

```bash
git add src/pages/FindingsListPage.tsx
git commit -m "feat: ensure Issues page has All/Errors Only filter"
```

---

### Task 6: Remove AppConsolePage wrapper (if unused)

**Files:**
- Modify: `src/App.tsx` (remove import if not used)
- Potentially delete: `src/pages/AppConsolePage.tsx`

- [ ] **Step 1: Check if AppConsolePage is still referenced in routes**

After Task 2, if AppConsolePage is no longer in any route, remove its lazy import from App.tsx.

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "chore: remove unused AppConsolePage import"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full verify**

```bash
bun run verify
```

Expected: typecheck + lint + build all pass.

- [ ] **Step 2: Manual test**

1. Run `bun run dev`
2. Log in and navigate to dashboard
3. Verify project dropdown shows projects + "Create New..."
4. Verify app dropdown shows apps + "Create New..."
5. Verify auto-selection works when only one project/app exists
6. Verify clicking each menu item navigates correctly
7. Verify active state highlights the current menu item

- [ ] **Step 3: Commit any fixes and push**

```bash
git push
```
