# Data Model Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Scan object with discovery-mode Test Runs, simplify Test Suite/Case to 1:many, add Test Suite Bundles, Test Schedules, and intermediate run objects (Test Case Run, Test Suite Run, Test Suite Bundle Run).

**Architecture:** The Scan table is removed. Test Runs become the top-level execution record, forming a tree via `parentTestRunId`/`rootTestRunId`. Test Runs point to intermediate run objects (Test Case Run / Test Suite Run / Test Suite Bundle Run) which in turn reference the test artifacts. Test Suites own Test Cases directly (1:many FK). A new Test Schedule object handles recurring execution.

**Tech Stack:** TypeScript, Drizzle ORM, Hono, PostgreSQL, TanStack Query, React, Zustand

**Deployment:** Use `testomniac_app/scripts/push_all.sh --starting-project <project>` to build/publish each layer and update downstream dependencies.

---

## Phase 1: Types (`testomniac_types`)

### Task 1: Remove Scan types and add new enums

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Remove ScanStatus enum and replace with expanded TestRunStatus**

In `src/index.ts`, find the `ScanStatus` enum and remove it. Update `TestRunStatus`:

```typescript
// REMOVE:
// export const ScanStatus = { ... } as const;
// export type ScanStatus = ...;

// UPDATE TestRunStatus to:
export const TestRunStatus = {
  Pending: "pending",
  Planned: "planned",
  Running: "running",
  Completed: "completed",
  Failed: "failed",
} as const;
export type TestRunStatus = (typeof TestRunStatus)[keyof typeof TestRunStatus];
```

- [ ] **Step 2: Add RecurrenceType enum**

```typescript
export const RecurrenceType = {
  OneTime: "one_time",
  Weekday: "weekday",
  Daily: "daily",
  Weekly: "weekly",
} as const;
export type RecurrenceType = (typeof RecurrenceType)[keyof typeof RecurrenceType];
```

- [ ] **Step 3: Remove Scan request/response types**

Remove these interfaces:
- `CreateScanRequest`
- `CreateScanResponse`
- `ScanDetailResponse`
- `PendingScanResponse`
- `ScanStreamEvent`
- `UpdateScanStatsRequest`
- `CompleteScanRequest`
- All deprecated aliases (`RunDetailResponse`, `PendingRunResponse`, `RunStreamEvent`, etc.)

- [ ] **Step 4: Remove junction table types**

Remove:
- `CreateTestSuiteSuiteLinkRequest`
- `TestSuiteSuiteLinkResponse`
- `CreateTestSuiteCaseLinkRequest`
- `TestSuiteCaseLinkResponse`

- [ ] **Step 5: Update tests to remove scan-related tests**

In `src/index.test.ts`, remove all tests referencing `ScanStatus`, `CreateScanRequest`, `CreateScanResponse`, `ScanDetailResponse`, `ScanStreamEvent`, junction link types.

- [ ] **Step 6: Run tests**

Run: `cd /Users/johnhuang/projects/testomniac_types && bun run verify`

- [ ] **Step 7: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_types
git add -A && git commit -m "refactor: remove Scan types and junction table types, expand TestRunStatus"
```

### Task 2: Add Test Suite Bundle types

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Add Test Suite Bundle interfaces**

```typescript
// --- Test Suite Bundle ---

export interface TestSuiteBundleResponse {
  id: number;
  appId: number;
  title: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateTestSuiteBundleRequest {
  appId: number;
  title: string;
  description?: string;
}

export interface UpdateTestSuiteBundleRequest {
  title?: string;
  description?: string;
}

export interface TestSuiteBundleSuiteLinkRequest {
  testSuiteBundleId: number;
  testSuiteId: number;
}

export interface TestSuiteBundleSuiteLinkResponse {
  id: number;
  testSuiteBundleId: number;
  testSuiteId: number;
}
```

- [ ] **Step 2: Add tests for new types**

- [ ] **Step 3: Run verify**

Run: `cd /Users/johnhuang/projects/testomniac_types && bun run verify`

- [ ] **Step 4: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_types
git add -A && git commit -m "feat: add TestSuiteBundle types"
```

### Task 3: Add Test Case Run, Test Suite Run, Test Suite Bundle Run types

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Add Test Case Run types**

```typescript
// --- Test Case Run ---

export interface CreateTestCaseRunRequest {
  testCaseId: number;
  testSuiteRunId?: number;
}

export interface TestCaseRunResponse {
  id: number;
  testCaseId: number;
  testSuiteRunId: number | null;
  status: string;
  durationMs: number | null;
  errorMessage: string | null;
  screenshotPath: string | null;
  consoleLog: string | null;
  networkLog: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
}

export interface CompleteTestCaseRunRequest {
  status: string;
  durationMs?: number;
  errorMessage?: string;
  screenshotPath?: string;
  consoleLog?: string;
  networkLog?: string;
}
```

- [ ] **Step 2: Add Test Suite Run types**

```typescript
// --- Test Suite Run ---

export interface CreateTestSuiteRunRequest {
  testSuiteId: number;
  testSuiteBundleRunId?: number;
}

export interface TestSuiteRunResponse {
  id: number;
  testSuiteId: number;
  testSuiteBundleRunId: number | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
}

export interface CompleteTestSuiteRunRequest {
  status: string;
}
```

- [ ] **Step 3: Add Test Suite Bundle Run types**

```typescript
// --- Test Suite Bundle Run ---

export interface CreateTestSuiteBundleRunRequest {
  testSuiteBundleId: number;
}

export interface TestSuiteBundleRunResponse {
  id: number;
  testSuiteBundleId: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
}

export interface CompleteTestSuiteBundleRunRequest {
  status: string;
}
```

- [ ] **Step 4: Add tests, run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run verify
git add -A && git commit -m "feat: add TestCaseRun, TestSuiteRun, TestSuiteBundleRun types"
```

### Task 4: Update Test Run types (remove scanId, add new fields)

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Update CreateTestRunRequest**

```typescript
export interface CreateTestRunRequest {
  appId: number;
  testCaseRunId?: number;
  testSuiteRunId?: number;
  testSuiteBundleRunId?: number;
  discovery?: boolean;
  parentTestRunId?: number;
  rootTestRunId?: number;
  sizeClass: string;
  createdByUserId?: string;
  ownedByUserId?: string;
  scanUrl?: string;
}
```

- [ ] **Step 2: Update TestRunResponse**

```typescript
export interface TestRunResponse {
  id: number;
  appId: number;
  testCaseRunId: number | null;
  testSuiteRunId: number | null;
  testSuiteBundleRunId: number | null;
  discovery: boolean;
  parentTestRunId: number | null;
  rootTestRunId: number | null;
  sizeClass: string;
  status: string;
  createdByUserId: string | null;
  ownedByUserId: string | null;
  scanUrl: string | null;
  pagesFound: number | null;
  pageStatesFound: number | null;
  testRunsCompleted: number | null;
  aiSummary: string | null;
  totalDurationMs: number | null;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}
```

- [ ] **Step 3: Add CompleteTestRunRequest**

```typescript
export interface CompleteTestRunRequest {
  status: string;
  aiSummary?: string;
  totalDurationMs?: number;
  pagesFound?: number;
  pageStatesFound?: number;
  testRunsCompleted?: number;
}
```

- [ ] **Step 4: Add TestRunStreamEvent (replaces ScanStreamEvent)**

```typescript
export interface TestRunStreamEvent {
  testRunId: number;
  rootTestRunId: number;
  type:
    | "run_started"
    | "page_discovered"
    | "page_state_created"
    | "stats_update"
    | "decomposition_job_created"
    | "decomposition_job_completed"
    | "test_suite_created"
    | "child_run_created"
    | "child_run_completed"
    | "finding_created"
    | "run_completed"
    | "run_failed";
  payload: Record<string, unknown>;
  createdAt: string;
}
```

- [ ] **Step 5: Update tests, run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run verify
git add -A && git commit -m "refactor: update TestRun types - remove scanId, add discovery/tree/run-object fields"
```

### Task 5: Update TestCase, DecompositionJob, ReportEmail, ElementIdentity, TestRunFinding types

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Add testSuiteId to TestCase insert request**

Find `InsertTestCaseRequest` (or equivalent) and ensure `testSuiteId` is required:

```typescript
export interface InsertTestCaseRequest {
  appId: number;
  testSuiteId: number;
  testCase: TestCase;
}
```

- [ ] **Step 2: Update DecompositionJob types**

```typescript
export interface CreateDecompositionJobRequest {
  testRunId: number;  // was scanId
  pageStateId: number;
  personaId?: number;
}

export interface DecompositionJobResponse {
  id: number;
  testRunId: number;  // was scanId
  pageStateId: number;
  personaId: number | null;
  status: string;
  createdAt: string | null;
  completedAt: string | null;
}
```

- [ ] **Step 3: Update ReportEmail types**

```typescript
export interface CreateReportEmailRequest {
  rootTestRunId: number;  // was scanId
  userEmail: string;
  deepLinkToken: string;
}

export interface ReportEmailResponse {
  id: number;
  rootTestRunId: number;  // was scanId
  userEmail: string;
  deepLinkToken: string;
  sentAt: string | null;
}
```

- [ ] **Step 4: Update ElementIdentity types**

In `CreateElementIdentityRequest`, rename `scanId` to `testRunId`:
```typescript
export interface CreateElementIdentityRequest {
  appId: number;
  testRunId: number;  // was scanId
  // ... rest unchanged
}
```

In `ElementIdentityResponse`, rename:
```typescript
  firstSeenTestRunId: number;  // was firstSeenScanId
  lastSeenTestRunId: number;   // was lastSeenScanId
```

In `UpdateElementIdentityRequest`, rename:
```typescript
export interface UpdateElementIdentityRequest {
  lastSeenTestRunId: number;  // was lastSeenScanId
  // ... rest unchanged
}
```

- [ ] **Step 5: Update TestRunFinding to reference testCaseRunId**

```typescript
export interface CreateTestRunFindingRequest {
  testCaseRunId: number;  // was testRunId
  expertiseRuleId?: number;
  type: FindingType;
  title: string;
  description: string;
}

export interface TestRunFindingResponse {
  id: number;
  testCaseRunId: number;  // was testRunId
  expertiseRuleId: number | null;
  type: string;
  title: string;
  description: string;
  createdAt: string | null;
}
```

- [ ] **Step 6: Update tests, run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run verify
git add -A && git commit -m "refactor: update TestCase, DecompositionJob, ReportEmail, ElementIdentity, TestRunFinding types"
```

### Task 6: Add Test Schedule and Discovery Run types

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Add Test Schedule types**

```typescript
// --- Test Schedule ---

export interface TestScheduleResponse {
  id: number;
  appId: number;
  title: string;
  testSuiteId: number | null;
  testCaseId: number | null;
  testSuiteBundleId: number | null;
  discovery: boolean;
  recurrenceType: string;
  timeOfDay: string;
  dayOfWeek: number | null;
  timezone: string;
  enabled: boolean;
  sizeClass: string;
  createdByUserId: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateTestScheduleRequest {
  appId: number;
  title: string;
  testSuiteId?: number;
  testCaseId?: number;
  testSuiteBundleId?: number;
  discovery?: boolean;
  recurrenceType: RecurrenceType;
  timeOfDay: string;
  dayOfWeek?: number;
  timezone: string;
  sizeClass: SizeClass;
}

export interface UpdateTestScheduleRequest {
  title?: string;
  testSuiteId?: number | null;
  testCaseId?: number | null;
  testSuiteBundleId?: number | null;
  discovery?: boolean;
  recurrenceType?: RecurrenceType;
  timeOfDay?: string;
  dayOfWeek?: number | null;
  timezone?: string;
  enabled?: boolean;
  sizeClass?: SizeClass;
}
```

- [ ] **Step 2: Add CreateDiscoveryRunRequest (replaces CreateScanRequest)**

```typescript
export interface CreateDiscoveryRunRequest {
  url: string;
  sizeClass?: SizeClass;
  createdByUserId?: string;
  ownedByUserId?: string;
  credentials?: {
    username?: string;
    email?: string;
    password: string;
    twoFactorCode?: string;
  };
  reportEmail?: string;
}

export interface CreateDiscoveryRunResponse {
  status: "pending" | "duplicate_owned" | "duplicate_unclaimed" | "validation_error";
  testRunId?: number;
  projectId?: number;
  appId?: number;
  message?: string;
  streamPath?: string;
  suggestedNextStep?: "watch_progress" | "contact_owner" | "claim_project";
}
```

- [ ] **Step 3: Update tests, run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run verify
git add -A && git commit -m "feat: add TestSchedule and CreateDiscoveryRun types"
```

### Task 7: Publish testomniac_types

- [ ] **Step 1: Deploy using push_all.sh**

```bash
cd /Users/johnhuang/projects/testomniac_app
bash scripts/push_all.sh --starting-project testomniac_types
```

This will build, version bump, publish `testomniac_types`, then cascade updates through all downstream projects.

---

## Phase 2: API (`testomniac_api`)

### Task 8: Add new database tables

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/schema.ts`

- [ ] **Step 1: Add testSuiteBundles table**

```typescript
// =============================================================================
// Test Suite Bundles (user-created grouping)
// =============================================================================

export const testSuiteBundles = starterSchema.table("test_suite_bundles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  appId: bigserial("app_id", { mode: "number" })
    .references(() => apps.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 2: Add testSuiteBundleSuites junction table**

```typescript
export const testSuiteBundleSuites = starterSchema.table(
  "test_suite_bundle_suites",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    testSuiteBundleId: bigserial("test_suite_bundle_id", { mode: "number" })
      .references(() => testSuiteBundles.id, { onDelete: "cascade" })
      .notNull(),
    testSuiteId: bigserial("test_suite_id", { mode: "number" })
      .references(() => testSuites.id, { onDelete: "cascade" })
      .notNull(),
  },
  table => ({
    bundleSuiteUniqueIdx: uniqueIndex(
      "testomniac_bundle_suites_uidx"
    ).on(table.testSuiteBundleId, table.testSuiteId),
  })
);
```

- [ ] **Step 3: Add testCaseRuns table**

```typescript
export const testCaseRuns = starterSchema.table("test_case_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  testCaseId: bigserial("test_case_id", { mode: "number" })
    .references(() => testCases.id)
    .notNull(),
  testSuiteRunId: bigserial("test_suite_run_id", { mode: "number" }),
  status: text("status").notNull().default("pending"),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  screenshotPath: text("screenshot_path"),
  consoleLog: text("console_log"),
  networkLog: text("network_log"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 4: Add testSuiteRuns table**

```typescript
export const testSuiteRuns = starterSchema.table("test_suite_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  testSuiteId: bigserial("test_suite_id", { mode: "number" })
    .references(() => testSuites.id)
    .notNull(),
  testSuiteBundleRunId: bigserial("test_suite_bundle_run_id", { mode: "number" }),
  status: text("status").notNull().default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 5: Add testSuiteBundleRuns table**

```typescript
export const testSuiteBundleRuns = starterSchema.table("test_suite_bundle_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  testSuiteBundleId: bigserial("test_suite_bundle_id", { mode: "number" })
    .references(() => testSuiteBundles.id)
    .notNull(),
  status: text("status").notNull().default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 6: Add testSchedules table**

```typescript
export const testSchedules = starterSchema.table("test_schedules", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  appId: bigserial("app_id", { mode: "number" })
    .references(() => apps.id)
    .notNull(),
  title: text("title").notNull(),
  testSuiteId: bigserial("test_suite_id", { mode: "number" }).references(
    () => testSuites.id
  ),
  testCaseId: bigserial("test_case_id", { mode: "number" }).references(
    () => testCases.id
  ),
  testSuiteBundleId: bigserial("test_suite_bundle_id", { mode: "number" }).references(
    () => testSuiteBundles.id
  ),
  discovery: boolean("discovery").notNull().default(false),
  recurrenceType: text("recurrence_type").notNull(),
  timeOfDay: text("time_of_day").notNull(),
  dayOfWeek: integer("day_of_week"),
  timezone: text("timezone").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sizeClass: text("size_class").notNull().default("desktop"),
  createdByUserId: text("created_by_user_id").notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 7: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_api
git add -A && git commit -m "feat: add new tables - testSuiteBundles, run objects, testSchedules"
```

### Task 9: Modify existing tables (testCases, testRuns, related)

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/schema.ts`

- [ ] **Step 1: Add testSuiteId to testCases table**

Add to the `testCases` table definition:
```typescript
  testSuiteId: bigserial("test_suite_id", { mode: "number" }).references(
    () => testSuites.id
  ),
```

- [ ] **Step 2: Replace testRuns table with new structure**

Replace the entire `testRuns` table definition:

```typescript
export const testRuns = starterSchema.table("test_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  appId: bigserial("app_id", { mode: "number" })
    .references(() => apps.id)
    .notNull(),
  testCaseRunId: bigserial("test_case_run_id", { mode: "number" }).references(
    () => testCaseRuns.id
  ),
  testSuiteRunId: bigserial("test_suite_run_id", { mode: "number" }).references(
    () => testSuiteRuns.id
  ),
  testSuiteBundleRunId: bigserial("test_suite_bundle_run_id", { mode: "number" }).references(
    () => testSuiteBundleRuns.id
  ),
  discovery: boolean("discovery").notNull().default(false),
  parentTestRunId: bigserial("parent_test_run_id", { mode: "number" }),
  rootTestRunId: bigserial("root_test_run_id", { mode: "number" }),
  sizeClass: text("size_class").notNull().default("desktop"),
  status: text("status").notNull().default("pending"),
  createdByUserId: text("created_by_user_id"),
  ownedByUserId: text("owned_by_user_id"),
  scanUrl: text("scan_url"),
  pagesFound: integer("pages_found"),
  pageStatesFound: integer("page_states_found"),
  testRunsCompleted: integer("test_runs_completed"),
  aiSummary: text("ai_summary"),
  totalDurationMs: integer("total_duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
```

- [ ] **Step 3: Update aiDecompositionJobs — scanId → testRunId**

```typescript
export const aiDecompositionJobs = starterSchema.table("ai_decomposition_jobs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  testRunId: bigserial("test_run_id", { mode: "number" })
    .references(() => testRuns.id)
    .notNull(),
  pageStateId: bigserial("page_state_id", { mode: "number" })
    .references(() => pageStates.id)
    .notNull(),
  personaId: bigserial("persona_id", { mode: "number" }).references(
    () => personas.id
  ),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
```

- [ ] **Step 4: Update reportEmails — scanId → rootTestRunId**

```typescript
export const reportEmails = starterSchema.table("report_emails", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  rootTestRunId: bigserial("root_test_run_id", { mode: "number" }).references(
    () => testRuns.id
  ),
  userEmail: text("user_email").notNull(),
  deepLinkToken: text("deep_link_token").unique(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 5: Update testRunFindings — testRunId → testCaseRunId**

```typescript
export const testRunFindings = starterSchema.table("test_run_findings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  testCaseRunId: bigserial("test_case_run_id", { mode: "number" })
    .references(() => testCaseRuns.id)
    .notNull(),
  expertiseRuleId: bigserial("expertise_rule_id", { mode: "number" }).references(
    () => expertiseRules.id
  ),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 6: Update elementIdentities — firstSeenScanId/lastSeenScanId → testRunId**

Find `elementIdentities` table and rename:
- `firstSeenScanId` → `firstSeenTestRunId`
- `lastSeenScanId` → `lastSeenTestRunId`

- [ ] **Step 7: Remove scans table, testSuiteSuites, testSuiteCases junction tables**

Remove or comment out:
- `export const scans = ...` (and its alias `runs`)
- `export const testSuiteSuites = ...`
- `export const testSuiteCases = ...`

Also remove `scanId` from `issues` and `aiUsage` tables (replace with `testRunId` where appropriate).

- [ ] **Step 8: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run verify
git add -A && git commit -m "refactor: update schema - remove scans, update testRuns, add run objects"
```

### Task 10: Update API routes — scanner endpoints

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/scanner.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/scan.ts`

- [ ] **Step 1: Replace scan.ts with discovery-run.ts**

Rename `scan.ts` to `discovery-run.ts`. Update the `POST /scan` endpoint to `POST /discovery-run`:
- Instead of inserting into `scans` table, create:
  1. Find/create "Direct Navigations" test suite for the app
  2. Create test case with navigation action
  3. Create a test case run
  4. Create root test run pointing to the test case run
- Return `CreateDiscoveryRunResponse` (testRunId, streamPath, etc.)

- [ ] **Step 2: Update scanner.ts — replace scan endpoints with test run endpoints**

Replace:
- `GET /scanner/scans/pending` → `GET /scanner/test-runs/pending` (query: `parentTestRunId IS NULL AND ownedByUserId IS NULL AND status = 'pending'`)
- `GET /scanner/scans/:id` → remove (use test run endpoints)
- `PATCH /scanner/scans/:id/stats` → `PATCH /scanner/test-runs/:id/stats`
- `PATCH /scanner/scans/:id/complete` → `PATCH /scanner/test-runs/:id/complete`

Add new endpoints:
- `POST /scanner/test-case-runs` — create test case run
- `PATCH /scanner/test-case-runs/:id/complete` — complete test case run
- `POST /scanner/test-suite-runs` — create test suite run
- `PATCH /scanner/test-suite-runs/:id/complete` — complete test suite run
- `POST /scanner/test-suite-bundle-runs` — create bundle run
- `PATCH /scanner/test-suite-bundle-runs/:id/complete` — complete bundle run

- [ ] **Step 3: Update scanner.ts — test run creation**

Update `POST /scanner/test-runs` to accept new fields:
- `appId`, `testCaseRunId`/`testSuiteRunId`/`testSuiteBundleRunId`
- `discovery`, `parentTestRunId`, `rootTestRunId`
- `createdByUserId`, `ownedByUserId`, `scanUrl`

Remove `scanId` from the request body.

- [ ] **Step 4: Update decomposition job endpoints**

Change `POST /scanner/ai-decomposition-jobs`:
- Accept `testRunId` instead of `scanId`

Change `GET /scanner/ai-decomposition-jobs/pending`:
- Query param: `testRunId` instead of `scanId`

- [ ] **Step 5: Remove test-suite-suites and test-suite-cases endpoints**

Remove:
- `POST /scanner/test-suite-suites`
- `POST /scanner/test-suite-cases`

- [ ] **Step 6: Add test-suite-id to test case creation**

Update `POST /scanner/test-cases` to require `testSuiteId` in the request body.

- [ ] **Step 7: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run verify
git add -A && git commit -m "refactor: update scanner routes - replace scan with discovery run"
```

### Task 11: Update API routes — read endpoints

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/runs-read.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/detail-read.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/projects.ts`

- [ ] **Step 1: Update runs-read.ts**

Replace scan-based read endpoints:
- `GET /runs/:runId` → `GET /test-runs/:testRunId` (read from `testRuns` table)
- `GET /runs/:runId/test-runs` → `GET /test-runs/:testRunId/child-runs` (query by `rootTestRunId`)
- `GET /runs/:runId/stream` → `GET /test-runs/:testRunId/stream` (SSE keyed by rootTestRunId)
- Keep other sub-resource routes but re-key by app from the test run's `appId`

- [ ] **Step 2: Update detail-read.ts**

- Remove `GET /test-suites/:id/suites` (no more child suites)
- Update `GET /test-suites/:id/cases` to query `testCases` by `testSuiteId` FK directly
- Update `GET /test-runs/:id/findings` → `GET /test-case-runs/:id/findings` (query by `testCaseRunId`)
- Add `GET /test-suite-runs/:id/case-runs` — list test case runs for a suite run
- Add `GET /test-suite-bundle-runs/:id/suite-runs` — list suite runs for a bundle run

- [ ] **Step 3: Update projects.ts**

- `GET /projects/:id/runs` → query root test runs (where `parentTestRunId IS NULL`) for the project's apps

- [ ] **Step 4: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run verify
git add -A && git commit -m "refactor: update read routes for new data model"
```

### Task 12: Add Test Schedule and Test Suite Bundle routes

**Files:**
- Create: `/Users/johnhuang/projects/testomniac_api/src/routes/schedules.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/routes/bundles.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/index.ts`

- [ ] **Step 1: Create bundles.ts**

Endpoints:
- `GET /apps/:appId/bundles` — list bundles for app
- `POST /apps/:appId/bundles` — create bundle
- `PATCH /bundles/:id` — update bundle
- `DELETE /bundles/:id` — delete bundle
- `POST /bundles/:id/suites` — add suite to bundle
- `DELETE /bundles/:id/suites/:suiteId` — remove suite from bundle
- `GET /bundles/:id/suites` — list suites in bundle

- [ ] **Step 2: Create schedules.ts**

Endpoints:
- `GET /apps/:appId/schedules` — list schedules
- `POST /apps/:appId/schedules` — create schedule
- `PATCH /schedules/:id` — update schedule
- `DELETE /schedules/:id` — delete schedule

- [ ] **Step 3: Register routes in index.ts**

- [ ] **Step 4: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run verify
git add -A && git commit -m "feat: add bundle and schedule API routes"
```

### Task 13: Deploy types and API

- [ ] **Step 1: Deploy**

```bash
cd /Users/johnhuang/projects/testomniac_app
bash scripts/push_all.sh --starting-project testomniac_types
```

---

## Phase 3: Client (`testomniac_client`)

### Task 14: Update TestomniacClient methods

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_client/src/network/TestomniacClient.ts`

- [ ] **Step 1: Remove scan methods, add discovery run method**

Remove: `submitScan()`, `submitScanAuthenticated()`, `getAppScans()`

Add:
```typescript
async submitDiscoveryRun(request: CreateDiscoveryRunRequest): Promise<CreateDiscoveryRunResponse>
async submitDiscoveryRunAuthenticated(token: string, request: CreateDiscoveryRunRequest): Promise<CreateDiscoveryRunResponse>
```

- [ ] **Step 2: Update test run methods**

Update `getRunTestRuns()` → `getTestRunChildRuns(testRunId)` (query child runs by rootTestRunId)

Add:
```typescript
async getTestRun(testRunId: number): Promise<TestRunResponse>
async getTestCaseRuns(testSuiteRunId: number): Promise<TestCaseRunResponse[]>
async getTestSuiteRuns(testSuiteBundleRunId: number): Promise<TestSuiteRunResponse[]>
async getTestCaseRunFindings(testCaseRunId: number): Promise<TestRunFindingResponse[]>
```

- [ ] **Step 3: Remove suite-junction methods**

Remove: `getTestSuiteChildSuites()`

Update: `getTestSuiteTestCases()` to query by direct FK (URL param change: `GET /test-suites/:id/cases`)

- [ ] **Step 4: Add bundle and schedule methods**

```typescript
async getAppBundles(appId: number): Promise<TestSuiteBundleResponse[]>
async createBundle(request: CreateTestSuiteBundleRequest): Promise<TestSuiteBundleResponse>
async getAppSchedules(appId: number): Promise<TestScheduleResponse[]>
async createSchedule(request: CreateTestScheduleRequest): Promise<TestScheduleResponse>
```

- [ ] **Step 5: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_client && bun run verify
git add -A && git commit -m "refactor: update client - replace scan with discovery run, add bundles/schedules"
```

### Task 15: Update TanStack Query hooks

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/` (multiple files)
- Modify: `/Users/johnhuang/projects/testomniac_client/src/types.ts`

- [ ] **Step 1: Update QUERY_KEYS**

In `types.ts`, update:
- Remove: `appScans`
- Rename: `appTestRuns` stays but semantics change
- Add: `testRunChildRuns`, `testCaseRuns`, `testSuiteRuns`, `appBundles`, `appSchedules`, `testCaseRunFindings`

- [ ] **Step 2: Remove scan hooks**

Remove: `useAppScans`, `useSubmitScan`

- [ ] **Step 3: Add new hooks**

- `useSubmitDiscoveryRun` — mutation hook
- `useAppBundles` — query hook
- `useAppSchedules` — query hook
- `useTestRunChildRuns` — query hook
- `useTestCaseRuns` — query hook for case runs within a suite run
- `useTestSuiteRuns` — query hook for suite runs within a bundle run
- `useTestCaseRunFindings` — query hook

- [ ] **Step 4: Remove useTestSuiteChildSuites hook**

- [ ] **Step 5: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_client && bun run verify
git add -A && git commit -m "refactor: update hooks - replace scan with discovery, add bundle/schedule hooks"
```

### Task 16: Deploy client

- [ ] **Step 1: Deploy**

```bash
cd /Users/johnhuang/projects/testomniac_app
bash scripts/push_all.sh --starting-project testomniac_client
```

---

## Phase 4: Runner Service & Runner (`testomniac_runner_service`, `testomniac_runner`)

### Task 17: Update testomniac_runner_service

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/` (ApiClient and orchestrator references)

- [ ] **Step 1: Update ApiClient usage**

The runner service uses `getApiClient()` which calls scanner endpoints. Update all calls:
- Replace calls to `/scanner/scans/pending` → `/scanner/test-runs/pending`
- Replace calls to `PATCH /scanner/scans/:id/stats` → `PATCH /scanner/test-runs/:id/stats`
- Replace calls to `PATCH /scanner/scans/:id/complete` → `PATCH /scanner/test-runs/:id/complete`
- Replace `scanId` parameters with `testRunId` in all decomposition job creation
- Replace `POST /scanner/test-suite-cases` with direct `testSuiteId` in test case creation
- Remove calls to `POST /scanner/test-suite-suites`

- [ ] **Step 2: Update orchestrator to use new run objects**

When creating test runs, the orchestrator should:
1. Create a test case run (POST /scanner/test-case-runs)
2. Create a test run pointing to the test case run
3. On completion, complete the test case run first, then the test run

- [ ] **Step 3: Update ScanEventHandler to use TestRunStreamEvent**

Rename `ScanEventHandler` → `TestRunEventHandler` (or keep name but change event types).
All events now use `testRunId` and `rootTestRunId` instead of `scanId`.

- [ ] **Step 4: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && bun run verify
git add -A && git commit -m "refactor: update runner service - replace scan with test run model"
```

### Task 18: Update testomniac_runner

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner/src/orchestrator.ts`

- [ ] **Step 1: Update polling logic in index.ts**

Change from polling `/scanner/scans/pending` to `/scanner/test-runs/pending`.
The response shape changes from `ScanDetailResponse` to `TestRunResponse`.

- [ ] **Step 2: Update orchestrator.ts**

Replace `runFullScan(scan)` pattern with `executeTestRun(testRun)`:
- Read `testRun.discovery` flag
- Create appropriate run objects (test case run, test suite run) via API
- Complete runs via the new endpoints
- Pass `testRunId` to decomposition job creation instead of `scanId`

- [ ] **Step 3: Update health endpoint**

In `index.ts`, update the service name and health endpoint to reflect that this is a "runner" not a "scanner".

- [ ] **Step 4: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner && bun run verify
git add -A && git commit -m "refactor: update runner - poll test runs instead of scans"
```

### Task 19: Update testomniac_extension

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_extension/src/background/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_extension/src/adapters/ChromeAdapter.ts`

- [ ] **Step 1: Update background/index.ts**

Replace scan-based flow with discovery run flow:
- Call `submitDiscoveryRun()` instead of `submitScan()`
- Subscribe to test run stream instead of scan stream
- Handle `TestRunStreamEvent` instead of `ScanStreamEvent`

- [ ] **Step 2: Update event handling**

All event references change from `scanId` to `testRunId`/`rootTestRunId`.

- [ ] **Step 3: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_extension && bun run verify
git add -A && git commit -m "refactor: update extension - use discovery runs instead of scans"
```

### Task 20: Deploy runner layer

- [ ] **Step 1: Deploy**

```bash
cd /Users/johnhuang/projects/testomniac_app
bash scripts/push_all.sh --starting-project testomniac_runner_service
```

---

## Phase 5: Lib & App (`testomniac_lib`, `testomniac_app`)

### Task 21: Update testomniac_lib

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_lib/src/business/hooks/useScanManager.ts`
- Modify: `/Users/johnhuang/projects/testomniac_lib/src/business/stores/scanProgressStore.ts`
- Modify: `/Users/johnhuang/projects/testomniac_lib/src/business/hooks/useRunManager.ts`

- [ ] **Step 1: Rename useScanManager → useDiscoveryManager**

Update the hook to:
- Call `submitDiscoveryRun()` instead of `submitScan()`
- Track `testRunId` instead of `runId`/`scanId`
- Handle `TestRunStreamEvent` events

- [ ] **Step 2: Rename scanProgressStore → discoveryProgressStore**

Update the Zustand store:
- Rename state field `runId` → `testRunId`
- Update event types to match `TestRunStreamEvent`
- Keep same counter fields (pagesFound, pageStatesFound, etc.)

- [ ] **Step 3: Update useRunManager**

- Replace `getRun()` (which fetched a scan) with `getTestRun()`
- Response shape is now `TestRunResponse` instead of `ScanDetailResponse`
- Update field access accordingly

- [ ] **Step 4: Update exports in index.ts**

Rename exports to match new hook/store names.

- [ ] **Step 5: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_lib && bun run verify
git add -A && git commit -m "refactor: rename scan hooks to discovery, update for new data model"
```

### Task 22: Update testomniac_app — pages and components

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/StartScanPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/ScanProgressPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/PublicScanProgressPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/components/scanner/ScanForm.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/components/scanner/ScanProgressPanel.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/components/scanner/RunSummaryCard.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/RunDetailsPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/TestRunsPage.tsx`

- [ ] **Step 1: Update ScanForm → DiscoveryForm**

Rename component. Change from `useSubmitScan` to `useSubmitDiscoveryRun`. Update form submission to use `CreateDiscoveryRunRequest`.

- [ ] **Step 2: Update ScanProgressPanel → DiscoveryProgressPanel**

- Subscribe to test run stream (`/test-runs/:testRunId/stream`)
- Handle `TestRunStreamEvent` instead of `ScanStreamEvent`
- Use `useDiscoveryManager` instead of `useScanManager`

- [ ] **Step 3: Update StartScanPage → StartDiscoveryPage**

Rename and use updated form component.

- [ ] **Step 4: Update RunDetailsPage**

- Fetch `TestRunResponse` instead of `ScanDetailResponse`
- Display new fields: `discovery`, child run count, etc.
- Remove references to `scanId`

- [ ] **Step 5: Update TestRunsPage**

- Show test runs with their targets (case run / suite run / bundle run)
- Add `discovery` badge column
- Show parent/child relationship

- [ ] **Step 6: Update progress pages**

`ScanProgressPage` and `PublicScanProgressPage`:
- Use `testRunId` from URL params instead of `runId`/`scanId`
- Subscribe to test run stream

- [ ] **Step 7: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_app && bun run verify
git add -A && git commit -m "refactor: update app pages - replace scan with discovery run"
```

### Task 23: Update testomniac_app — routing and sidebar

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_app/src/App.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/components/dashboard/DashboardSidebar.tsx`

- [ ] **Step 1: Update routes in App.tsx**

- Rename `scan/new` route to `discovery/new`
- Update route params from `runId` to `testRunId` where applicable
- Add new routes for bundles and schedules pages (future)

- [ ] **Step 2: Update DashboardSidebar**

- Rename "Start Scan" → "Start Discovery"
- Add "Bundles" nav item (future)
- Add "Schedules" nav item (future)

- [ ] **Step 3: Run verify, commit**

```bash
cd /Users/johnhuang/projects/testomniac_app && bun run verify
git add -A && git commit -m "refactor: update routing and sidebar for discovery model"
```

### Task 24: Deploy lib and app

- [ ] **Step 1: Deploy**

```bash
cd /Users/johnhuang/projects/testomniac_app
bash scripts/push_all.sh --starting-project testomniac_lib
```

---

## Phase 6: Verification

### Task 25: End-to-end verification

- [ ] **Step 1: Start API locally**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run dev
```

- [ ] **Step 2: Start app locally**

```bash
cd /Users/johnhuang/projects/testomniac_app && bun run dev
```

- [ ] **Step 3: Test discovery flow**

1. Navigate to the Start Discovery page
2. Submit a URL
3. Verify a root test run is created (check API response)
4. Verify progress stream connects and shows events
5. Verify the "Direct Navigations" suite is created in the dashboard

- [ ] **Step 4: Verify API endpoints**

```bash
# List pending test runs
curl http://localhost:8027/scanner/test-runs/pending

# Create a test case run
curl -X POST http://localhost:8027/scanner/test-case-runs -d '{"testCaseId": 1}'

# Complete a test case run
curl -X PATCH http://localhost:8027/scanner/test-case-runs/1/complete -d '{"status": "completed"}'
```

- [ ] **Step 5: Run all project tests**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run test
cd /Users/johnhuang/projects/testomniac_api && bun run test
cd /Users/johnhuang/projects/testomniac_runner_service && bun run test
cd /Users/johnhuang/projects/testomniac_runner && bun run test
cd /Users/johnhuang/projects/testomniac_app && bun run typecheck
```
