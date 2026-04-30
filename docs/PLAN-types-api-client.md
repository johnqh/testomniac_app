# Implementation Plan: Types, API & Client

Align `testomniac_types`, `testomniac_api`, and `testomniac_client` with the spec in `DATA.md`.

---

## Phase 1: testomniac_types — Type Definitions

**File:** `/Users/johnhuang/projects/testomniac_types/src/index.ts`

### 1.1 New types to add

**Enums/constants:**
- `ScanStatus` — pending, running, completed, failed
- `DecompositionJobStatus` — Pending, Done
- `TestRunStatus` — Planned, Running, Completed
- `FindingType` — error, warning

**New interfaces:**
- `AIDecompositionJob` / `AIDecompositionJobResponse` / `CreateAIDecompositionJobRequest`
- `Expertise` / `ExpertiseResponse` / `CreateExpertiseRequest`
- `ExpertiseRule` / `ExpertiseRuleResponse` / `CreateExpertiseRuleRequest`
- `TestRunFinding` / `TestRunFindingResponse` / `CreateTestRunFindingRequest`
- `TestSuiteSuiteLink` / `CreateTestSuiteSuiteLinkRequest` (junction)
- `TestSuiteCaseLink` / `CreateTestSuiteCaseLinkRequest` (junction)
- `TestAction` (DB-persisted version — current TestAction is an embedded JSON object)
- `TestActionResponse` / `CreateTestActionRequest`

### 1.2 Modify existing types

**Rename `name` → `title`:**
- `ProjectResponse.name` → `title`
- `CreateProjectRequest.name` → `title`
- `AppResponse.name` → `title`
- `CreateAppRequest.name` → `title`
- `PersonaResponse.name` → `title`, `CreatePersonaRequest.name` → `title`
- `UseCaseResponse.name` → `title`, `CreateUseCaseRequest.name` → `title`
- `TestSuiteResponse.name` → `title`
- `TestCaseResponse.name` → `title`
- `TestSuite.name` → `title`
- `TestCase.name` → `title`

**Rename `url` → `relativePath` on Page:**
- `PageResponse.url` → `relativePath`
- `FindOrCreatePageRequest.url` → `relativePath`

**Rename `startingUrl` → `startingPath`:**
- `TestSuite.startingUrl` → `startingPath`
- `TestSuiteResponse.startingUrl` → `startingPath`
- `TestCase.startingUrl` → `startingPath`
- `TestCaseResponse.startingUrl` → `startingPath`

**PageState — rename `createdByActionId` → `createdByTestRunId`:**
- `CreatePageStateRequest.createdByActionId` → `createdByTestRunId`
- `PageStateResponse.createdByActionId` → `createdByTestRunId` (if present)

**Scan — add new fields, remove old ones:**
- Add: `scanUrl`, `createdByUserId`, `ownedByUserId`, `createdAt`, `testRunsCompleted`
- Remove: `phase`, `actionsCompleted`, `mouseScanningDurationMs`, `aiAnalysisDurationMs`, `inputScanningDurationMs`, `authScanningDurationMs`, `testGenerationDurationMs`, `testExecutionDurationMs`
- Update: `ScanDetailResponse`, `UpdateScanStatsRequest`, `CompleteScanRequest`

**TestSuite — restructure:**
- Add: `decompositionJobId`, `priority` (number 1-5), `startingPath`
- Remove: `testCasesJson` (replaced by junction table)
- Keep: `startingPageStateId`, `sizeClass`, `dependencyTestCaseId`, `personaIds`/`personaIdsJson`, `reusableHtmlElementId`, `reusableHtmlElementType`, `patternType`, `suiteTags`, `estimatedDurationMs`

**TestCase — modify:**
- Add: `reusableHtmlElementId`, `patternType`, `dependencyTestCaseId`, `startingPath`
- Change: `priority` from string to number (1-5)
- Remove: `startingPageStateId` from embedded TestCase (keep on TestCaseResponse)

**TestRun — modify:**
- Add: `testSuiteId`, `sizeClass`
- Remove: `screen`
- Change: `status` values to Planned/Running/Completed
- Change: timestamps — add `createdAt`, keep `startedAt`/`completedAt`

### 1.3 Deprecate/remove

- `ActionDefinitionResponse`, `CreateActionDefinitionRequest` — Action removed
- `ActionExecutionResponse`, `CreateActionExecutionRequest`, `CompleteActionExecutionRequest` — Action Execution removed
- `IssueResponse`, `CreateIssueRequest`, `FindIssueByRuleRequest` — Issue removed
- `RecordAiUsageRequest` — AI Usage removed
- `IssueRuleName`, `IssueSeverity`, `IssueStatus` enums — Issue removed
- `ActionStatus` enum — Action Execution removed
- Legacy aliases (`RunDetailResponse`, `PendingRunResponse`, etc.)

---

## Phase 2: testomniac_api — Database Schema

**File:** `/Users/johnhuang/projects/testomniac_api/src/db/schema.ts`

### 2.1 New tables

```
aiDecompositionJobs (id, scanId FK, pageStateId FK, personaId FK, status, createdAt, completedAt)
expertises (id, slug unique, title, description, createdAt)
expertiseRules (id, expertiseId FK, title, description, aiEndpointUrl, createdAt)
testRunFindings (id, testRunId FK, expertiseRuleId FK, type, title, description, createdAt)
testSuiteSuites (id, parentSuiteId FK, childSuiteId FK) + unique constraint
testSuiteCases (id, testSuiteId FK, testCaseId FK) + unique constraint
testActions (id, testCaseId FK, stepOrder, actionType, pageStateId FK, elementIdentityId FK, containerType, containerElementIdentityId FK, value, path, playwrightCode, description, expectations JSONB, continueOnFailure)
```

### 2.2 Modify existing tables

**projects:** rename `name` → `title`
**apps:** rename `name` → `title`
**pages:** rename `url` → `relativePath`
**personas:** rename `name` → `title`
**useCases:** rename `name` → `title`

**pageStates:** rename `createdByActionId` → `createdByTestRunId`

**scans:**
- Add columns: `scanUrl`, `createdByUserId`, `ownedByUserId`, `createdAt`, `testRunsCompleted`
- Remove columns: `phase`, `actionsCompleted`, `mouseScanningDurationMs`, `aiAnalysisDurationMs`, `inputScanningDurationMs`, `authScanningDurationMs`, `testGenerationDurationMs`, `testExecutionDurationMs`

**testSuites:**
- Rename `name` → `title`
- Rename `startingUrl` → `startingPath`
- Add columns: `decompositionJobId`, change `priority` to integer
- Remove: `testCasesJson` (replaced by testSuiteCases junction)

**testCases:**
- Rename `name` → `title`
- Add columns: `reusableHtmlElementId`, `patternType`, `dependencyTestCaseId`, `startingPageStateId`, `startingPath`, `globalExpectationsJson`, `estimatedDurationMs`
- Change: `priority` to integer

**testRuns:**
- Rename `screen` → `sizeClass`
- Add columns: `testSuiteId`, `createdAt`
- Change: `status` to use Planned/Running/Completed

### 2.3 Tables to keep but stop using (soft-deprecate)

- `actions` — no new writes, keep for historical data
- `actionExecutions` — no new writes, keep for historical data
- `issues` — no new writes, keep for historical data
- `aiUsage` — no new writes, keep for historical data
- `testCaseActions` — replaced by `testActions` table (direct parent/child)

### 2.4 Database migration

Create a migration file that:
1. Creates new tables (aiDecompositionJobs, expertises, expertiseRules, testRunFindings, testSuiteSuites, testSuiteCases, testActions)
2. Adds new columns to existing tables
3. Renames columns (name→title, url→relativePath, etc.)
4. Adds indexes on new FKs

---

## Phase 3: testomniac_api — Routes

### 3.1 New scanner routes (POST /scanner/*)

```
POST   /ai-decomposition-jobs          — Create job
GET    /ai-decomposition-jobs/pending   — Get next pending job for a scan
PATCH  /ai-decomposition-jobs/:id/complete — Mark done

POST   /test-suite-suites              — Link suite to suite
POST   /test-suite-cases               — Link suite to case

POST   /test-actions                   — Create test action
GET    /test-actions                    — List by testCaseId

POST   /test-run-findings              — Create finding
```

### 3.2 New read routes (GET, Firebase auth)

```
GET    /apps/:appId/test-suites                    — List test suites for app
GET    /apps/:appId/expertises                     — List all expertises (global)
GET    /test-suites/:id/suites                     — List child suites
GET    /test-suites/:id/cases                      — List test cases in suite
GET    /test-cases/:id/actions                     — List test actions
GET    /test-runs/:id/findings                     — List findings for test run
GET    /runs/:runId/decomposition-jobs             — List jobs for scan
GET    /runs/:runId/test-suites                    — List test suites for scan (via jobs)
GET    /expertises                                 — List all expertises
GET    /expertises/:id/rules                       — List rules for expertise
```

### 3.3 Modify existing routes

- `POST /scan` — accept `scanUrl`, pass `createdByUserId`/`ownedByUserId`
- `GET /scanner/scans/pending` — filter by `ownedByUserId IS NULL`
- Rename response fields (name→title, url→relativePath, etc.) across all affected endpoints
- Remove/deprecate action-execution endpoints from scanner routes
- Remove/deprecate issue-creation endpoints from scanner routes
- Remove/deprecate ai-usage endpoint from scanner routes

### 3.4 SSE stream

- Update `ScanStreamEvent` types to reflect new phases (generate/run loop instead of 5 phases)
- Add event types: `decomposition_job_created`, `decomposition_job_completed`, `test_suite_created`, `finding_created`
- Remove: `phase_changed` (no more linear phases)

---

## Phase 4: testomniac_client — SDK & Hooks

**Files:**
- `/Users/johnhuang/projects/testomniac_client/src/network/TestomniacClient.ts`
- `/Users/johnhuang/projects/testomniac_client/src/hooks/index.ts`
- `/Users/johnhuang/projects/testomniac_client/src/types.ts`

### 4.1 New client methods

```typescript
getAppTestSuites(appId, token)
getTestSuiteChildSuites(testSuiteId, token)
getTestSuiteTestCases(testSuiteId, token)
getTestCaseActions(testCaseId, token)
getTestRunFindings(testRunId, token)
getScanDecompositionJobs(runId, token)
getScanTestSuites(runId, token)
getExpertises(token)
getExpertiseRules(expertiseId, token)
```

### 4.2 New hooks

```typescript
useAppTestSuites(config)
useTestSuiteChildSuites(config)
useTestSuiteTestCases(config)
useTestCaseActions(config)
useTestRunFindings(config)
useScanDecompositionJobs(config)
useScanTestSuites(config)
useExpertises(config)
useExpertiseRules(config)
```

### 4.3 New query keys

```typescript
appTestSuites(appId)
testSuiteChildSuites(testSuiteId)
testSuiteTestCases(testSuiteId)
testCaseActions(testCaseId)
testRunFindings(testRunId)
scanDecompositionJobs(runId)
scanTestSuites(runId)
expertises()
expertiseRules(expertiseId)
```

### 4.4 Deprecate/remove

- `getAppActions`, `getAppActionExecutions`, `getAppIssues` methods
- `useAppActions`, `useAppActionExecutions`, `useAppIssues` hooks
- `getRunActions`, `getRunIssues` methods
- `useRunActions`, `useRunIssues` hooks
- Corresponding query keys

### 4.5 Update existing

- Rename response field mappings (name→title, url→relativePath, etc.)
- Update `useRunManager` in testomniac_lib to use new hooks

---

## Dependency Deployment

**Important:** Whenever you modify a lower-level library (e.g., `testomniac_types`, `testomniac_client`), run `/Users/johnhuang/projects/testomniac_app/scripts/push_all.sh`. This deploys the library and updates all higher-level projects' dependencies.

Run `push_all.sh` after:
- Any change to `testomniac_types` (before working on API, client, or app)
- Any change to `testomniac_client` (before working on lib or app)

---

## Execution Order

1. **Types first** — all changes to testomniac_types → run `push_all.sh`
2. **DB migration** — schema changes in testomniac_api
3. **API routes** — new endpoints + modify existing in testomniac_api
4. **Client SDK** — new methods, hooks, query keys in testomniac_client → run `push_all.sh`
5. **App updates** — testomniac_app pages consuming new hooks (separate plan)

---

## Verification

- `bun run typecheck` passes in all four projects
- `bun run build` succeeds in testomniac_types, testomniac_client, testomniac_api
- Existing scanner endpoints still work (backwards-compatible during migration)
- New endpoints return correct data shapes
- New hooks return typed data correctly
