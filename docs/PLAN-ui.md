# Implementation Plan: UI Changes

Align `testomniac_app` with the new data model and console layout.

**Depends on:** Types, API & Client plan must be completed first.

---

## Overview

Once logged in, user navigates: Entity → Project → App → Console.

The App Console uses a **master/detail layout** with a left sidebar listing sections and a right panel showing detail content.

---

## Console Sections

### 1. Test Suites (master/detail with drill-down)

**Master list:** Shows top-level test suites (those not contained by any other suite) with folder icons.

**Detail interactions:**
- Click a test suite → detail panel shows a list of its children (child test suites with folder icons + test cases with file icons), using the `test_suite_suites` and `test_suite_cases` junction tables
- Click a child test suite → drill down again (same view, now showing that suite's children). Breadcrumb navigation at the top to go back.
- Click a test case → show test case detail view:
  - Title, testType, sizeClass, priority
  - Starting path, page reference
  - Persona / use case associations
  - Ordered list of test actions (stepOrder, actionType, description, playwrightCode)
  - Global expectations

**Data hooks:**
- `useAppTestSuites(appId)` → top-level list
- `useTestSuiteChildSuites(testSuiteId)` → child suites
- `useTestSuiteTestCases(testSuiteId)` → cases in suite
- `useTestCaseActions(testCaseId)` → actions for case

### 2. Test Runs

**Master list:** Shows all test runs with status badges (Planned=gray, Running=blue, Completed=green).

**Detail:** Click a test run → show:
- Status, sizeClass, duration
- Linked test suite or test case title
- Console log, network log, screenshot
- Error message (if any)
- List of Test Run Findings (errors in red, warnings in yellow)

**Data hooks:**
- `useAppTestRuns(appId)` → list
- `useTestRunFindings(testRunId)` → findings

### 3. Findings

**Master list:** All findings across all test runs for this app, sorted by most recent.

**Filter bar:** Toggle between "All" and "Errors only" (filters by `type === 'error'`).

**Each finding shows:** type badge (error=red, warning=yellow), title, description, linked test run ID.

**Detail:** Click a finding → show full detail with:
- Expertise rule that produced it (if any)
- Parent test run details
- Link to navigate to the test run

**Data hooks:**
- New: `useAppFindings(appId)` — needs a new API endpoint `GET /apps/:appId/findings`
- `useTestRunFindings(testRunId)` for detail view

### 4. Settings

Reserved for future use. Show placeholder page.

---

## Route Structure

```
/:lang/dashboard/:entitySlug/                          → Dashboard overview (projects list)
/:lang/dashboard/:entitySlug/projects/:projectId/       → Project overview (apps list)
/:lang/dashboard/:entitySlug/apps/:appId/               → App console (master/detail)
/:lang/dashboard/:entitySlug/apps/:appId/test-suites    → Test Suites section
/:lang/dashboard/:entitySlug/apps/:appId/test-suites/:suiteId → Drill into suite
/:lang/dashboard/:entitySlug/apps/:appId/test-cases/:caseId   → Test case detail
/:lang/dashboard/:entitySlug/apps/:appId/test-runs      → Test Runs section
/:lang/dashboard/:entitySlug/apps/:appId/test-runs/:runId     → Test run detail
/:lang/dashboard/:entitySlug/apps/:appId/findings       → Findings section
/:lang/dashboard/:entitySlug/apps/:appId/settings       → Settings (placeholder)
```

---

## New/Modified Components

### Layout

**AppConsolePage.tsx** — New page component with master/detail layout:
- Left sidebar: section list (Test Suites, Test Runs, Findings, Settings)
- Active section highlighted
- Right panel: `<Outlet>` for section content

**AppConsoleSidebar.tsx** — Left sidebar component:
- Four nav items with icons
- Uses `useLocalizedNavigate` for routing

### Test Suites Section

**TestSuitesListPage.tsx** — Top-level suites list:
- Fetches suites with `useAppTestSuites`
- Renders each as a clickable row with folder icon, title, priority badge, sizeClass badge
- Click navigates to drill-down view

**TestSuiteDetailPage.tsx** — Drill-down into a suite:
- Breadcrumb trail showing suite hierarchy
- Two sub-lists: child suites (folder icons) + test cases (file icons)
- Uses `useTestSuiteChildSuites` and `useTestSuiteTestCases`
- Click suite → navigate deeper, click case → navigate to case detail

**TestCaseDetailPage.tsx** — Test case detail view:
- Header: title, testType badge, priority, sizeClass
- Info section: starting path, page, persona, use case, dependency
- Test Actions list: ordered table showing stepOrder, actionType, description
- Expandable rows showing playwrightCode and expectations JSON
- Uses `useTestCaseActions`

### Test Runs Section

**TestRunsListPage.tsx** — List of all test runs:
- DataTable with columns: id, linked suite/case title, sizeClass, status (StatusBadge), duration, createdAt
- Click row → navigate to detail

**TestRunDetailPage.tsx** — Test run detail:
- Summary: status, duration, sizeClass, timestamps
- Error message (if any)
- Findings list (TestRunFindingsList sub-component)
- Console/network log (collapsible)
- Screenshot

### Findings Section

**FindingsListPage.tsx** — All findings for app:
- Filter bar: "All" | "Errors only" toggle
- List of findings: type badge, title, description, linked test run
- Click → expand or navigate to finding detail
- Uses new `useAppFindings` hook

### Settings Section

**AppSettingsPage.tsx** — Placeholder:
- "Settings coming soon" message

---

## Modified Existing Components

### StatusBadge.tsx

Add new status mappings:
```
Planned → gray
Running → blue (animated pulse)
Completed → green
```

### DashboardSidebar.tsx

Update to show the new app-level navigation when inside an app console context.

### DashboardPage.tsx / DashboardOverview.tsx

Update project/app listing to use `title` instead of `name`.

---

## Pages to Remove/Deprecate

These pages are replaced by the new console layout:

- `IssuesPage.tsx` — replaced by Findings section
- `MapPage.tsx` — removed (was TODO/empty state)
- `ComponentsPage.tsx` — component data accessible through test suite drill-down
- `PersonasPage.tsx` — persona info shown on test case details
- `PagesPage.tsx` — page info shown on test case details
- `ScansPage.tsx` — scan concept simplified; test runs replace it in the UI

Pages that stay but need field renames (name→title, url→relativePath):
- `DashboardOverview.tsx`
- `StartScanPage.tsx`
- `ScanProgressPage.tsx`

---

## New API Endpoint Needed

`GET /apps/:appId/findings` — Returns all `TestRunFinding` records across all test runs for the app. Joins through: testRunFindings → testRuns → scans → app.

Add to:
- testomniac_api: `apps-read.ts`
- testomniac_client: `getAppFindings(appId, token)` method + `useAppFindings` hook + query key

---

## Dependency Deployment

**Important:** Whenever you modify a lower-level library (e.g., `testomniac_types`, `testomniac_client`), run `/Users/johnhuang/projects/testomniac_app/scripts/push_all.sh`. This deploys the library and updates all higher-level projects' dependencies.

The app depends on `testomniac_types`, `testomniac_client`, and `testomniac_lib`. After changes to any of these, run `push_all.sh` before working on the app.

---

## Execution Order

1. **Routes & layout** — AppConsolePage with sidebar and Outlet
2. **Test Suites section** — list + drill-down + test case detail
3. **Test Runs section** — list + detail with findings
4. **Findings section** — list with filter + new API endpoint
5. **Settings placeholder**
6. **Cleanup** — remove deprecated pages, update field names

---

## Verification

- Navigate Entity → Project → App → Console
- Test Suites: drill into suites, see children, click test case, see actions
- Test Runs: see list with status badges, click for detail with findings
- Findings: toggle filter between All and Errors only
- Breadcrumbs work for suite drill-down navigation
- All field names show `title` not `name`
- Language-prefixed routes work for all 16 languages
