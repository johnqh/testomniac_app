# Quick Scan Feature Design

## Overview

Add a `quickScan` option that speeds up discovery runs by skipping hover-type test interaction execution on elements that already have a navigation-type interaction. Test interactions are still created (both hover and navigation types), but hover interactions on linked elements are not executed during the run.

## Behavior

When `quickScan` is enabled on a testRun:

1. **Crawling** proceeds normally — the runner still navigates to pages via direct navigation, and still hovers/clicks on elements that do NOT have an href (to discover hidden pages).
2. **Test interaction creation** is unchanged — both hover and navigation interactions are recorded.
3. **Execution skip logic**: When selecting the next interaction to run, if `quickScan` is true and the interaction is a hover-type interaction AND a navigation-type interaction exists for the same element, skip executing it.

## Data Model

### `testRuns` table (testomniac_api schema)

Add column:
```sql
quickScan boolean DEFAULT false
```

### `CreateDiscoveryRunRequest` (testomniac_types)

Add field:
```typescript
quickScan?: boolean;
```

## Changes by Project

### 1. testomniac_types

**File:** `src/index.ts`

- Add `quickScan?: boolean` to `CreateDiscoveryRunRequest` interface

### 2. testomniac_api

**File:** `src/db/schema.ts`

- Add `quickScan: boolean({ default: false })` column to `testRuns` table

**File:** `src/routes/scan.ts`

- Read `quickScan` from request body
- Pass it through to the testRun insert (alongside existing fields like `scanScopePath`)

### 3. testomniac_runner_service

**File:** `src/orchestrator/runner.ts`

The skip logic goes in the interaction selection phase. The runner already has access to the testRun config and all interactions for a surface.

**Skip condition** (in `selectNextOpenTestInteractionRun` or as a pre-filter):
```
if runConfig.quickScan
  && isHoverInteraction(interaction)
  && existsNavigationInteractionForSameElement(interaction, allInteractions)
then skip
```

**Element identity**: Two interactions target the "same element" if they share the same `testSurfaceId` and their first action step targets the same selector. Alternatively, if the hover interaction's `dependencyTestInteractionId` points to or is pointed to by a navigation interaction on the same page, they share an element.

The existing `isHoverInteraction()` function (lines 676-687 of runner.ts) already identifies hover interactions via `surfaceTags.includes("hover")` or `title.startsWith("Hover over ")`.

For navigation interactions: check `testType === "navigation"` on interactions within the same surface.

**RunConfig**: Add `quickScan?: boolean` to the `RunConfig` interface. Populate it from the testRun record when the runner picks up the job.

### 4. testomniac_app

**File:** `src/pages/StartScanPage.tsx`

- Add `quickScan` state (default: `false`)
- Add checkbox in the Options section
- Pass `quickScan` in the `submitScan()` call

### 5. testomniac_extension

**File:** `src/sidepanel/SidePanel.tsx`

- Add `quickScan` state (default: `false`)
- Add checkbox in the scan form (alongside existing expertise checkboxes)
- Include `quickScan` in the `scanBody` sent to `POST /api/v1/scan`
- Pass through in `START_SCAN` message to background (for display purposes / state tracking)

## UI

### Web App (StartScanPage)

A checkbox under the existing "Options" section:
```
[x] Quick scan
    Skip hover interactions on linked elements for faster discovery
```

### Extension (SidePanel)

A checkbox in the scan configuration area (below expertise checkboxes):
```
[x] Quick scan
    Skip hover interactions on linked elements
```

## Migration

A simple ALTER TABLE adding a nullable boolean column with a default value. No data migration needed — existing runs are `false` by default.

```sql
ALTER TABLE test_runs ADD COLUMN quick_scan BOOLEAN DEFAULT false;
```
