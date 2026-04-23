# Dashboard Data Restructuring Plan

## Context

The dashboard currently shows placeholder/empty data on all pages (test cases, issues, pages, map, etc.). Routes are run-centric (`/runs/:runId/pages`), but the desired model is app-centric with aggregate data across all scans. The sidebar is a flat list that needs to become an expandable tree: Project > App > (Scans, Test Cases, Issues, Pages, Graph, etc.).

This plan covers full-stack changes across testomniac_types, testomniac_api, testomniac_client, and testomniac_app.

## Design Decisions (from user)

- **App-level aggregate data** (not scoped to a specific scan)
- **Tree sidebar** with expandable nodes: Project > App > sections > Pages > Page States
- **App-centric routes**: `/dashboard/:entitySlug/apps/:appId/pages` replaces `/runs/:runId/pages`
- **App graph**: pages as nodes, actions as edges (derived from page states)
- **Page graph**: page states as nodes, actions as edges between states
- **Page state detail**: body shown as rendered iframe + syntax-highlighted source (toggle)

---

## Phase 1: Types Foundation -- DONE

Pure additive type changes. No breaking changes.

### `testomniac_types/src/index.ts`

Add:
- `PageStateReusableElementResponse` — junction type: `{ id, pageStateId, reusableHtmlElementId }`
- Add `appId?: number` to `CreateScanResponse`

### `testomniac_client/src/types.ts`

Add query keys to `QUERY_KEYS`:
```
app, projectApps, appPages, appPageStates, appActions, appActionExecutions,
appScans, appTestCases, appTestRuns, appIssues, appComponents, appPersonas,
pageActions, pageStateReusableElements, htmlElement
```

### Verify
```bash
cd testomniac_types && bun run typecheck
cd testomniac_client && bun run typecheck
```

---

## Phase 2: API Endpoints -- DONE

Keep existing run-scoped endpoints. Add app-scoped endpoints alongside.

### New file: `testomniac_api/src/routes/apps-read.ts`

Create `appsReadRouter` (Hono) with Firebase auth middleware. Each endpoint resolves app -> project -> entity for access control. Extract a shared `checkAppAccess(c, appId)` helper.

| Method | Path | Query | Notes |
|--------|------|-------|-------|
| GET | `/apps/:appId` | — | App details |
| GET | `/apps/:appId/pages` | — | `pages WHERE appId` |
| GET | `/apps/:appId/page-states` | — | Join pages + page_states for app |
| GET | `/apps/:appId/actions` | — | `actions WHERE appId` |
| GET | `/apps/:appId/action-executions` | — | Join through actions.appId |
| GET | `/apps/:appId/scans` | — | `scans WHERE appId` |
| GET | `/apps/:appId/test-cases` | — | `testCases WHERE appId` |
| GET | `/apps/:appId/test-runs` | — | Join through testCases.appId |
| GET | `/apps/:appId/issues` | — | `issues WHERE appId` |
| GET | `/apps/:appId/components` | — | `reusableHtmlElements WHERE appId` |
| GET | `/apps/:appId/personas` | — | `personas WHERE appId` |

### Modify: `testomniac_api/src/routes/entities.ts`

Add: `GET /entities/:entitySlug/projects` — resolve entity, verify membership, query `projects WHERE entityId`

### Modify: `testomniac_api/src/routes/projects.ts`

Add: `GET /projects/:id/apps` — query `apps WHERE projectId`

### New file: `testomniac_api/src/routes/page-details-read.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/pages/:pageId/actions` | Actions where startingPageStateId belongs to this page |
| GET | `/page-states/:pageStateId/reusable-elements` | Junction table query |
| GET | `/html-elements/:id` | Single HTML element by ID |

### Modify: `testomniac_api/src/routes/scan.ts`

- Include `appId` in `CreateScanResponse`
- When authenticated user submits scan, set `project.entityId` to the user's entity

### Mount routes in `testomniac_api/src/routes/index.ts`

### Verify
```bash
cd testomniac_api && bun run typecheck
# Test endpoints with curl against dev DB
```

---

## Phase 3: Client Hooks -- DONE

### Modify: `testomniac_client/src/network/TestomniacClient.ts`

Add methods (following existing pattern like `getRunPages`):
```
getApp, getProjectApps, getAppPages, getAppPageStates, getAppActions,
getAppActionExecutions, getAppScans, getAppTestCases, getAppTestRuns,
getAppIssues, getAppComponents, getAppPersonas, getPageActions,
getPageStateReusableElements, getHtmlElement
```

### New hooks in `testomniac_client/src/hooks/`

One file per hook, following `useRunPages.ts` pattern:
```
useApp, useProjectApps, useAppPages, useAppPageStates, useAppActions,
useAppActionExecutions, useAppScans, useAppTestCases, useAppTestRuns,
useAppIssues, useAppComponents, useAppPersonas, usePageActions,
usePageStateReusableElements, useHtmlElement
```

Export all from `hooks/index.ts`.

### Verify
```bash
cd testomniac_client && bun run typecheck
```

---

## Phase 4: Routes + Sidebar -- DONE

### Modify: `testomniac_app/src/App.tsx`

Replace run-centric routes with app-centric:
```
/dashboard/:entitySlug/
  index -> DashboardOverview
  scan/new -> StartScanPage
  apps/:appId/ -> AppLayout (provides appId context)
    index -> AppOverview
    scans -> ScansPage
    scans/:scanId/progress -> ScanProgressPage
    test-cases -> TestCasesPage
    test-runs -> TestRunsPage
    issues -> IssuesPage
    pages -> AppPagesPage
    pages/:pageId -> PageDetailPage
    pages/:pageId/states/:pageStateId -> PageStateDetailPage
    graph -> AppGraphPage
    pages/:pageId/graph -> PageGraphPage
    components -> ComponentsPage
    personas -> PersonasPage
  runs/:runId/* -> RunRedirect (backward compat)
  settings, workspaces, members, invitations (unchanged)
```

### New: `testomniac_app/src/pages/AppLayout.tsx`

Thin wrapper: reads `appId` from params, provides via context or just renders `<Outlet />`.

### Rewrite: `testomniac_app/src/components/dashboard/DashboardSidebar.tsx`

Tree sidebar with expandable nodes:

```
[Entity Name]
[Start New Scan]

Projects
  v Project A
    v app.example.com
      > Scans (3)
      > Test Cases (42)
      > Test Runs (18)
      > Issues (7)
      > Pages (12)
        > /home
          > desktop-state-1
          > mobile-state-2
          > Page Graph
        > /about
      > Graph
      > Components
      > Personas
    > other.example.com
  > Project B

---
Workspaces | Members | Invitations | Settings
```

Implementation:
- `useEntityProjects(entitySlug)` for top-level project list
- `useProjectApps(projectId)` loaded when project is expanded
- `useAppPages(appId)` loaded when Pages node is expanded
- `usePageStates(pageId)` loaded when a page node is expanded
- Local state (useState) tracks which nodes are expanded
- Active state highlights current route's tree node
- Counts shown in parentheses (from already-loaded data)

Consider splitting into sub-components: `ProjectTree`, `AppTree`, `PageTree` for readability.

### Modify: `testomniac_app/src/pages/DashboardOverview.tsx`

Show project/app summary cards with counts and links to app detail pages.

### Verify
```bash
cd testomniac_app && bun run dev
# Navigate sidebar tree, verify routes match
```

---

## Phase 5: Data Pages (App-Scoped) -- DONE

Wire placeholder pages to real data. All get `appId` from route params.

| Page | Hook | Key change |
|------|------|-----------|
| `TestCasesPage.tsx` | `useAppTestCases` | Replace empty array with hook data |
| `TestRunsPage.tsx` | `useAppTestRuns` | Replace empty array; join with test case names |
| `IssuesPage.tsx` | `useAppIssues` | Replace empty array |
| `ComponentsPage.tsx` | `useAppComponents` | Replace empty array |
| `PersonasPage.tsx` | `useAppPersonas` | Replace empty array |

### New: `testomniac_app/src/pages/ScansPage.tsx`

DataTable listing scans for the app: ID, Status, Phase, Pages Found, Started At, Duration. Uses `useAppScans`.

### Rename: `PagesPage.tsx` -> `AppPagesPage.tsx`

Grid of pages with screenshot thumbnails, URL, state count. Links to `/pages/:pageId`.

### Verify
```bash
cd testomniac_app && bun run dev
# Load each page with real appId, confirm data renders
```

---

## Phase 6: Page Detail + Page State Detail -- DONE

### New: `testomniac_app/src/pages/PageDetailPage.tsx`

Route: `/apps/:appId/pages/:pageId`
- Page URL, route key, requires-login badge
- List page states via `usePageStates({ pageId })`
- Each state: screenshot thumbnail, size class, captured time
- Click state -> navigate to PageStateDetailPage
- Link to page graph

### New: `testomniac_app/src/pages/PageStateDetailPage.tsx`

Route: `/apps/:appId/pages/:pageId/states/:pageStateId`

Three sections:
1. **Body** — Toggle between:
   - Rendered: `<iframe sandbox>` loading `/api/v1/artifacts/{rawHtmlPath}`
   - Source: fetch HTML via `useHtmlElement(bodyHtmlElementId)`, show syntax-highlighted
2. **Content** — Same toggle for `contentHtmlElementId` + show `contentText`
3. **Reusable Components** — `usePageStateReusableElements(pageStateId)` -> for each, show type label + HTML preview

### Verify
```bash
# Navigate to a page with states, view body/content/components
```

---

## Phase 7: Graph Pages (ReactFlow) -- DONE

### New: `testomniac_app/src/pages/AppGraphPage.tsx`

Route: `/apps/:appId/graph`

Data: `useAppPages` + `useAppActions` + `useAppActionExecutions` + `useAppPageStates`

Logic:
1. Build `pageStateId -> pageId` lookup from page states
2. For each action: get `startingPageStateId` -> source page
3. For each execution: get `targetPageStateId` -> target page
4. Create deduplicated edges between pages
5. Layout with dagre (TB direction)
6. Click node -> navigate to page detail

### New: `testomniac_app/src/pages/PageGraphPage.tsx`

Route: `/apps/:appId/pages/:pageId/graph`

Data: `usePageStates(pageId)` + `usePageActions(pageId)` + action executions

Logic:
1. Nodes = page states for this page
2. Edges = actions connecting states (startingPageStateId -> targetPageStateId)
3. Layout with dagre
4. Click node -> navigate to page state detail

### New: `testomniac_app/src/utils/graphLayout.ts`

Shared utilities:
- `layoutWithDagre(nodes, edges, options)` — apply dagre layout
- Consistent edge/node styling

### Verify
```bash
# Load graph pages with real scan data, verify nodes/edges render
cd testomniac_app && bun run typecheck
```

---

## Phase 8: Scan Flow Integration -- DONE

### Modify: `testomniac_app/src/pages/StartScanPage.tsx`

- Use `appId` from `CreateScanResponse` (added in Phase 2)
- Redirect to `/dashboard/:entitySlug/apps/:appId/scans/:scanId/progress`

### New: `testomniac_app/src/pages/RunRedirect.tsx`

- Fetches run by ID via `useRun({ runId })`
- Resolves appId from run data
- Redirects to `/dashboard/:entitySlug/apps/:appId/scans/:scanId`

---

## Phase 9: Cleanup

- Remove unused run-centric route definitions
- Add i18n keys for sidebar labels across all 16 languages
- Run `bun run verify` in testomniac_app

---

## Dependency Order

```
Phase 1 (Types) -> Phase 2 (API) -> Phase 3 (Client)
                                          |
                                    Phase 4 (Routes + Sidebar)
                                          |
                        +--------+--------+--------+--------+
                        |        |        |        |        |
                    Phase 5  Phase 6  Phase 7  Phase 8      |
                    (Data)   (Detail) (Graphs) (Scan flow)  |
                        |        |        |        |        |
                        +--------+--------+--------+--------+
                                          |
                                    Phase 9 (Cleanup)
```

Phases 5-8 are independent and can be parallelized.

---

## Key Files

### New files
- `testomniac_api/src/routes/apps-read.ts` — app-scoped API endpoints
- `testomniac_api/src/routes/page-details-read.ts` — page/state detail endpoints
- `testomniac_client/src/hooks/useApp*.ts` (12 new hook files)
- `testomniac_app/src/pages/AppLayout.tsx`
- `testomniac_app/src/pages/ScansPage.tsx`
- `testomniac_app/src/pages/AppPagesPage.tsx`
- `testomniac_app/src/pages/PageDetailPage.tsx`
- `testomniac_app/src/pages/PageStateDetailPage.tsx`
- `testomniac_app/src/pages/AppGraphPage.tsx`
- `testomniac_app/src/pages/PageGraphPage.tsx`
- `testomniac_app/src/pages/RunRedirect.tsx`
- `testomniac_app/src/utils/graphLayout.ts`

### Modified files
- `testomniac_types/src/index.ts` — new types
- `testomniac_api/src/routes/entities.ts` — add projects endpoint
- `testomniac_api/src/routes/projects.ts` — add apps endpoint
- `testomniac_api/src/routes/scan.ts` — add appId to response, link entity
- `testomniac_api/src/routes/index.ts` — mount new routers
- `testomniac_client/src/network/TestomniacClient.ts` — new HTTP methods
- `testomniac_client/src/hooks/index.ts` — export new hooks
- `testomniac_client/src/types.ts` — new query keys
- `testomniac_app/src/App.tsx` — app-centric route tree
- `testomniac_app/src/components/dashboard/DashboardSidebar.tsx` — tree navigation
- `testomniac_app/src/pages/DashboardOverview.tsx` — show real project data
- `testomniac_app/src/pages/StartScanPage.tsx` — redirect to app-centric URL
- `testomniac_app/src/pages/TestCasesPage.tsx` — wire to useAppTestCases
- `testomniac_app/src/pages/TestRunsPage.tsx` — wire to useAppTestRuns
- `testomniac_app/src/pages/IssuesPage.tsx` — wire to useAppIssues
- `testomniac_app/src/pages/ComponentsPage.tsx` — wire to useAppComponents
- `testomniac_app/src/pages/PersonasPage.tsx` — wire to useAppPersonas

## Verification

After each phase:
1. `bun run typecheck` in the affected project
2. `bun run verify` in testomniac_app (typecheck + lint + format)
3. Manual testing: `bun run dev` and navigate the dashboard with real scan data
4. End-to-end: submit a scan, watch progress, verify data appears in all pages and graphs
