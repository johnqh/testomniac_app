# Pages Screen + Environment Navigation

## Context

The dashboard currently navigates via Product -> Runner. This plan replaces Runner with Environment as the primary navigation concept (runners become internal/hidden). It also replaces the existing PagesPage with a new screen featuring list and map views, and updates the page detail view with test element actions.

**Key decisions from user:**
- Add `targetPageId` to `test_elements` table
- Add `testEnvironmentId` to `pages`, `test_surfaces`, `test_elements`, `test_actions`, and all run tables
- Replace runner selector with environment selector in sidebar
- All sidebar items use environment context (`/environments/:envId/...`)
- New environment-scoped API endpoints (not client-side aggregation)
- ReactFlow + dagre for map visualization
- External pages stored as full URLs in `relativePath`
- "Test" action creates standalone test element run (no surface run)
- Test elements/surfaces/actions are persistent (not run-scoped)

---

## Phase 1: Schema & Types

### 1A: Database Schema (testomniac_api)

**File: `src/db/schema.ts`**

1. Reorder: move `testEnvironments` definition above `pages` (to allow FK reference)
2. Add to `test_elements`: `targetPageId bigint REFERENCES pages(id)`
3. Add `testEnvironmentId bigint REFERENCES test_environments(id)` to:
   - `pages`
   - `test_surfaces`
   - `test_elements`
   - `test_actions`
   - `test_surface_runs`
   - `test_element_runs`
   - `test_surface_bundle_runs`

**File: `src/db/index.ts`** — add migration SQL:
```sql
ALTER TABLE testomniac.test_elements ADD COLUMN IF NOT EXISTS target_page_id BIGINT REFERENCES testomniac.pages(id);
ALTER TABLE testomniac.pages ADD COLUMN IF NOT EXISTS test_environment_id BIGINT REFERENCES testomniac.test_environments(id);
ALTER TABLE testomniac.test_surfaces ADD COLUMN IF NOT EXISTS test_environment_id BIGINT REFERENCES testomniac.test_environments(id);
ALTER TABLE testomniac.test_elements ADD COLUMN IF NOT EXISTS test_environment_id BIGINT REFERENCES testomniac.test_environments(id);
ALTER TABLE testomniac.test_actions ADD COLUMN IF NOT EXISTS test_environment_id BIGINT REFERENCES testomniac.test_environments(id);
ALTER TABLE testomniac.test_surface_runs ADD COLUMN IF NOT EXISTS test_environment_id BIGINT REFERENCES testomniac.test_environments(id);
ALTER TABLE testomniac.test_element_runs ADD COLUMN IF NOT EXISTS test_environment_id BIGINT REFERENCES testomniac.test_environments(id);
ALTER TABLE testomniac.test_surface_bundle_runs ADD COLUMN IF NOT EXISTS test_environment_id BIGINT REFERENCES testomniac.test_environments(id);
```

All columns nullable for backward compatibility.

### 1B: Types (testomniac_types)

**File: `src/index.ts`**

- `PageResponse` — add `testEnvironmentId: number | null`
- `TestElementResponse` — add `targetPageId: number | null`, `testEnvironmentId: number | null`
- `TestSurfaceResponse` — add `testEnvironmentId: number | null`
- `TestActionResponse` — add `testEnvironmentId: number | null`
- `TestElementRunResponse` — add `testEnvironmentId: number | null`
- `TestSurfaceRunResponse` — add `testEnvironmentId: number | null`
- `TestSurfaceBundleRunResponse` — add `testEnvironmentId: number | null`
- `TestElement` interface — add `target_page_id?: number`

---

## Phase 2: API Endpoints (testomniac_api)

### 2A: List environments for product

**File: `src/routes/projects.ts`** (extend productsRouter)

`GET /products/:id/environments` — returns `TestEnvironmentResponse[]` for the product.

### 2B: Environment-scoped data endpoints

**File: `src/routes/test-environments.ts`** (extend)

- `GET /:envId` — get environment by ID
- `GET /:envId/pages` — pages where `testEnvironmentId = envId`
- `GET /:envId/test-elements` — test elements where `testEnvironmentId = envId`
- `GET /:envId/test-surfaces` — test surfaces where `testEnvironmentId = envId`

Access check: environment -> product -> entity membership.

### 2C: User-auth test element run creation

**File: `src/routes/detail-read.ts`** (extend testElementRunsReadRouter)

`POST /test-element-runs` — accepts `{ testElementId }`, verifies access through test element -> runner -> product -> entity, inserts standalone test element run with status `pending`.

---

## Phase 3: Client Layer (testomniac_client)

### 3A: Network client methods

**File: `src/network/TestomniacClient.ts`**

- `getProductEnvironments(productId, token)` -> `GET /products/:id/environments`
- `getEnvironmentPages(envId, token)` -> `GET /test-environments/:envId/pages`
- `getEnvironmentTestElements(envId, token)` -> `GET /test-environments/:envId/test-elements`
- `getEnvironmentTestSurfaces(envId, token)` -> `GET /test-environments/:envId/test-surfaces`
- `createTestElementRun(data, token)` -> `POST /test-element-runs`

### 3B: Query hooks

New files in `src/hooks/`:

- `useProductEnvironments.ts` — config: `{ productId }`, returns `{ environments, isLoading, error }`
- `useEnvironmentPages.ts` — config: `{ envId }`, returns `{ pages, isLoading, error }`
- `useEnvironmentTestElements.ts` — config: `{ envId }`, returns `{ testElements, isLoading, error }`
- `useEnvironmentTestSurfaces.ts` — config: `{ envId }`, returns `{ testSurfaces, isLoading, error }`
- `useCreateTestElementRun.ts` — mutation hook, returns `{ createRun, isCreating, error }`

Export all from `src/hooks/index.ts`.

---

## Phase 4: Business Logic (testomniac_lib)

### 4A: Page map data

**File: `src/business/hooks/usePageMapData.ts`** (new)

Takes `pages: PageResponse[]` and `testElements: TestElementResponse[]`, returns graph data:

```typescript
interface PageMapNode {
  id: string;
  relativePath: string;
  routeKey: string | null;
  isExternal: boolean;       // relativePath.startsWith('http')
  testElementCount: number;
}

interface PageMapEdge {
  id: string;
  sourcePageId: number | null;  // null for navigation (direct entry)
  targetPageId: number | null;
  testElementId: number;
  testType: string;             // 'navigation' | 'interaction'
  title: string;
}
```

Logic:
1. Filter test elements to `navigation` and `interaction` types only
2. Exclude elements where `pageId === targetPageId` (hovers/self-referencing)
3. Build nodes from pages, marking external ones
4. Build edges from filtered test elements
5. Return `{ nodes: PageMapNode[], edges: PageMapEdge[] }`

### 4B: Environment manager

**File: `src/business/hooks/useEnvironmentManager.ts`** (new)

Follows `useRunManager.ts` pattern. Fetches pages, testElements, testSurfaces for an environment in parallel via `Promise.all`.

Export both from `src/business/hooks/index.ts`.

---

## Phase 5: Frontend — Sidebar & Navigation (testomniac_app)

### 5A: Sidebar environment selector

**File: `src/components/dashboard/DashboardSidebar.tsx`**

- Replace runner selector with environment selector
- Fetch environments via `useProductEnvironments` instead of `useProductRunners`
- Navigate to `/environments/:envId/...` instead of `/runners/:runnerId/...`
- Auto-select if only one environment exists

### 5B: Route structure

**File: `src/App.tsx`**

Replace `runners/:runnerId/...` routes with `environments/:envId/...`:

```
environments/:envId/pages              -> PagesPage
environments/:envId/pages/:pageId      -> PageDetailPage
environments/:envId/test-elements      -> TestElementsPage
environments/:envId/test-surfaces      -> TestSurfacesListPage
environments/:envId/bundles            -> BundlesPage
environments/:envId/runs               -> TestRunsListPage
environments/:envId/runs/:runId        -> TestRunDetailPage
environments/:envId/issues             -> FindingsListPage
environments/:envId/schedules          -> SchedulesPage
environments/:envId/settings           -> SettingsPage
environments/:envId/test-scenarios     -> TestScenariosPage
environments/:envId/scaffolds          -> ScaffoldsPage
environments/:envId/personas           -> PersonasPage
```

### 5C: Update all page components

Every page reading `runnerId` from `useParams` must change to `envId`. Update hook calls from `useRunner*` to `useEnvironment*`. Approximately 15-20 page components affected:

- PagesPage, PageDetailPage, TestElementsPage, TestSurfacesListPage
- BundlesPage, TestRunsListPage, FindingsListPage, SchedulesPage
- RunnerSettingsPage, ScaffoldsPage, PersonasPage, TestScenariosPage
- RunnerGraphPage, PageGraphPage, etc.

---

## Phase 6: Frontend — Pages Screen (testomniac_app)

### 6A: PagesPage with list/map toggle

**File: `src/pages/PagesPage.tsx`** (rewrite)

- Toggle state: `list` | `map`
- Two toggle buttons at top of page
- Fetch via `useEnvironmentPages(envId)` and `useEnvironmentTestElements(envId)`
- Render `<PagesListView>` or `<PagesMapView>` based on toggle

### 6B: List view

**File: `src/components/pages/PagesListView.tsx`** (new)

- Table sorted by `relativePath`
- Columns: Path, Route Key, Requires Login (badge), Test Element Count
- Click row -> navigate to `/environments/:envId/pages/:pageId`

### 6C: Map view

**File: `src/components/pages/PagesMapView.tsx`** (new)

Uses `usePageMapData` from testomniac_lib, renders with ReactFlow + dagre.

**Custom nodes:**

1. **PageNode** — Rectangle showing path text
   - Dark gray border (`border-gray-700`) for internal pages (`relativePath` starts with `/`)
   - Orange border (`border-orange-500`) for external pages (`relativePath` starts with `http`)
   - Double-click -> navigate to page detail

2. **ActionCircleNode** — Small circle with icon
   - Navigation icon for `navigation` type (e.g., `ArrowTopRightOnSquareIcon`)
   - Cursor/click icon for `interaction` type (e.g., `CursorArrowRaysIcon`)

**Edge construction:**

For each qualifying test element:
- **Navigation** (direct URL entry): Create an `ActionCircleNode`, edge from circle -> target page rectangle
- **Mouse click** (page A -> page B): Create an `ActionCircleNode`, edge from source page -> circle, edge from circle -> target page

Edges use `type: 'smoothstep'` or `'bezier'` for curved lines with `markerEnd` arrows.

**Layout:** dagre with `rankdir: 'TB'`, `nodesep: 80`, `ranksep: 100`.

### 6D: Page detail — test elements section

**File: `src/pages/PageDetailPage.tsx`** (update)

Add section showing test elements for this page:

1. Fetch `useEnvironmentTestElements(envId)`
2. Filter into three groups:
   - Starting from this page: `el.pageId === pageId`
   - Landing on this page: `el.targetPageId === pageId`
   - On this page (hover/self): `el.pageId === pageId && el.targetPageId === pageId`
3. Each element row: title, type badge, start/end page paths
4. "..." menu (dropdown) at end of each row
5. "Test" menu item -> calls `useCreateTestElementRun({ testElementId: el.id })`

---

## Phase 7: Scanner Updates (testomniac_api + testomniac_runner)

### 7A: Populate targetPageId

When scanner creates test elements that navigate between pages, set `targetPageId` based on the action result.

**File: `testomniac_api/src/routes/scanner.ts`** — update `POST /scanner/test-elements` to accept and store `targetPageId`.

### 7B: Populate testEnvironmentId

When scanner creates pages, test surfaces, test elements, and test actions, pass `testEnvironmentId` (already available in the discovery run context).

---

## Dependency Order

```
Phase 1A (schema) ──┐
                     ├── Phase 2 (API) ── Phase 3 (client) ── Phase 4 (lib) ── Phase 5+6 (frontend)
Phase 1B (types) ───┘
                                                                                Phase 7 (scanner, after Phase 1A)
```

**Parallel opportunities:**
- 1A and 1B (different repos)
- 2A, 2B, 2C (independent endpoints)
- 3A and 3B (can scaffold simultaneously)
- 5 and 6 (sidebar refactor and pages screen are somewhat independent)
- 7 (scanner) after Phase 1A, independent of frontend

## Phase 8: Push All

After all changes are complete across all projects, run:

```bash
testomniac_app/scripts/push_all.sh
```

This processes projects in dependency order (types -> api -> runner_service -> client -> runner -> lib -> extension -> app -> app_rn), bumping versions and pushing changes.

## Verification

1. **Schema:** Run API server, verify new columns exist via `\d testomniac.test_elements` etc.
2. **API:** Test new endpoints with curl/httpie against running API
3. **Client:** Unit test hooks with mock responses
4. **Frontend — sidebar:** Select environment, verify navigation to `/environments/:envId/pages`
5. **Frontend — list view:** Verify pages sorted by path, click navigates to detail
6. **Frontend — map view:** Verify page rectangles (gray/orange borders), curved edges with action circles, navigation vs click element rendering, double-click navigation
7. **Frontend — page detail:** Verify test elements grouped correctly, "..." menu "Test" action creates a test element run
8. **End-to-end:** Run a scan, verify new fields populated, verify map view shows connections
