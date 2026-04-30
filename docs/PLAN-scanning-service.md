# Implementation Plan: Scanning Service, Scanner & Extension

Align `testomniac_scanning_service`, `testomniac_scanner`, and `testomniac_extension` with the new data model.

**Depends on:** Types, API & Client plan must be completed first.

**Projects:**
- `testomniac_scanning_service` (`/Users/johnhuang/projects/testomniac_scanning_service`) — Core scanning logic library, shared by scanner and extension
- `testomniac_scanner` (`/Users/johnhuang/projects/testomniac_scanner`) — Server-side worker that polls for pending scans and runs them via Puppeteer
- `testomniac_extension` (`/Users/johnhuang/projects/testomniac_extension`) — Chrome extension that runs scans in the user's browser via Chrome Debugger Protocol

---

## Overview of Changes

The scanning service currently runs a linear 5-phase pipeline:
```
mouse_scanning → ai_analysis → input_scanning → test_generation → test_execution
```

It needs to change to a **Generate/Run loop:**
```
Create AI Decomposition Job → Generate Test Suites/Cases → Run Test Cases → (new page state?) → loop
```

Key architectural changes:
- **Remove:** Action/ActionExecution creation, Issue creation, AI Usage tracking, 5-phase orchestration
- **Add:** AI Decomposition Job workflow, Test Suite/Case creation via decomposition, Test Run Finding creation via Expertise Rules
- **Change:** Test generation now creates persisted TestAction rows (not embedded JSON), Test Suite membership via junction tables

---

## Phase 1: API Client Updates

**File:** `/Users/johnhuang/projects/testomniac_scanning_service/src/api/client.ts`

### 1.1 New API calls to add

```typescript
// AI Decomposition Jobs
createDecompositionJob(scanId, pageStateId, personaId?)
getPendingDecompositionJobs(scanId)
completeDecompositionJob(jobId)

// Test Suite junction tables
linkSuiteToSuite(parentSuiteId, childSuiteId)
linkSuiteToCase(testSuiteId, testCaseId)

// Test Actions (persisted)
createTestAction(testCaseId, action)

// Test Run Findings
createTestRunFinding(testRunId, finding)

// Expertise
getExpertises()
getExpertiseRules(expertiseId)

// Updated scan management
updateScanStats(scanId, { pagesFound, pageStatesFound, testRunsCompleted })
```

### 1.2 Remove/deprecate API calls

```typescript
// Action/ActionExecution (removed)
createActionDefinition(...)
createActionExecution(...)
startAction(...)
completeAction(...)
getNextOpenAction(...)
getOpenActionCount(...)
getActionChain(...)

// Issues (removed — replaced by Test Run Findings)
createIssue(...)
getIssuesByScan(...)
findIssueByRule(...)

// AI Usage (removed)
recordAiUsage(...)

// Phase management (removed — no more linear phases)
updateRunPhase(...)
updatePhaseDuration(...)
```

### 1.3 Modify existing calls

- `createPageState(...)` — send `createdByTestRunId` instead of `createdByActionId`
- `findOrCreatePage(...)` — send `relativePath` instead of `url`
- `completeRun(...)` — remove phase duration fields
- `createTestRun(...)` — send `sizeClass` instead of `screen`, add `testSuiteId`
- `insertTestSuite(...)` — send `title` instead of `name`, include `decompositionJobId`, junction links
- `insertTestCase(...)` — send `title` instead of `name`, include new fields

---

## Phase 2: New Orchestrator — Generate/Run Loop

**Replace:** `/Users/johnhuang/projects/testomniac_scanning_service/src/orchestrator/`

### 2.1 New orchestrator entry point

Replace the linear 5-phase `runScan()` with a loop:

```
async function runScan(config: ScanConfig):
  1. Navigate to scanUrl, capture initial page state
  2. Create AI Decomposition Job for initial page state
  3. Enter loop:
     a. Process all pending decomposition jobs (GENERATE phase)
        - For each job: decompose page state → create test suites + test cases
        - Mark job as Done
     b. Run all pending test cases (RUN phase)
        - For each test case: create Test Run, execute, create Findings
        - If execution produces a NEW page state:
          → Create new AI Decomposition Job
     c. If no new decomposition jobs were created → exit loop
  4. Complete scan
```

### 2.2 Decomposition module (new)

**File:** `src/orchestrator/decomposition.ts`

Replaces the old `mouse-scanning.ts` + `ai-analysis.ts` + `test-generation.ts` pipeline:

```
async function processDecompositionJob(job, browserAdapter):
  1. Load page state (screenshot, HTML, hashes)
  2. Detect reusable elements (header, footer, sidebar, etc.)
  3. Detect UI patterns (cards, tables, modals, etc.)
  4. For the main body (fixedBody):
     - Create Test Suite (reusableHtmlElementId=null, patternType=null)
     - Generate test cases (render, interaction, navigation)
     - Create Test Actions for each test case
     - Link test cases to suite via junction
  5. For each reusable element:
     - Create or find existing Test Suite (with reusableHtmlElementId)
     - Generate test cases specific to this component
     - Link test cases to suite
     - Link component suite to parent body suite (suite-to-suite)
  6. For each detected pattern:
     - Create or find existing Test Suite (with patternType)
     - Generate pattern-specific test cases
     - Link to parent suite
  7. Dedup: check if equivalent suites/cases already exist before creating
  8. Mark decomposition job as Done
```

### 2.3 Test execution module (modified)

**File:** `src/orchestrator/test-execution.ts`

Modify to work with the new model:

```
async function executeTestCases(scanId, browserAdapter):
  1. Get all test cases for this scan (via decomposition jobs → suites → cases)
  2. For each test case without a completed test run in this scan:
     a. Check dependency (dependencyTestCaseId) — skip if not met
     b. Create Test Run (status=Planned, sizeClass from test case)
     c. Update Test Run (status=Running, startedAt=now)
     d. Execute test actions in order:
        - Navigate/click/fill/select per actionType
        - Check expectations after each action
        - Capture page state after navigation actions
     e. Run Expertise Rules against resulting page state:
        - Get all expertises and their rules
        - For deterministic rules: execute code check
        - For AI rules: call aiEndpointUrl with page state
        - Create Test Run Findings for any errors/warnings
     f. Complete Test Run (status=Completed, completedAt=now)
     g. If a new page state was discovered:
        - Create new AI Decomposition Job → return true
  3. Return whether any new jobs were created
```

---

## Phase 3: Remove Old Modules

### 3.1 Remove/archive

- `src/orchestrator/mouse-scanning.ts` — replaced by decomposition + test execution loop
- `src/orchestrator/ai-analysis.ts` — persona generation stays but moves to initial scan setup
- `src/orchestrator/input-scanning.ts` — form testing now happens via generated test cases
- `src/orchestrator/test-generation.ts` — replaced by decomposition module
- `src/detectors/issue-creator.ts` — replaced by Test Run Findings
- `src/detectors/rules/*.ts` — migrated to Expertise Rules (deterministic code stays, but invoked differently)
- `src/scanner/action-queue.ts` — no more action queue
- `src/scanner/action-classifier.ts` — no more action classification

### 3.2 Keep and modify

- `src/scanner/component-detector.ts` — still needed for decomposition
- `src/scanner/pattern-detector.ts` — still needed for decomposition
- `src/scanner/html-decomposer.ts` — still needed for decomposition
- `src/browser/page-utils.ts` — hash computation stays
- `src/identity/element-matcher.ts` — element identity matching stays
- `src/identity/playwright-locator.ts` — locator generation stays
- `src/generation/render.ts` — test generation logic stays, output format changes
- `src/generation/interaction.ts` — same
- `src/generation/form.ts` — same
- `src/generation/navigation.ts` — same
- `src/generation/e2e.ts` — same

### 3.3 Migrate detection rules to Expertise

The 12 existing detection rules become Expertise Rules:
```
broken_link       → Expertise "link-checker", deterministic rule
console_error     → Expertise "browser-errors", deterministic rule
network_error     → Expertise "browser-errors", deterministic rule
dead_click        → Expertise "interaction-quality", deterministic rule
broken_image      → Expertise "media-integrity", deterministic rule
broken_media      → Expertise "media-integrity", deterministic rule
error_page        → Expertise "page-quality", deterministic rule
blank_page        → Expertise "page-quality", deterministic rule
placeholder_text  → Expertise "content-quality", deterministic rule
duplicate_heading → Expertise "accessibility", deterministic rule
empty_link        → Expertise "accessibility", deterministic rule
duplicate_id      → Expertise "accessibility", deterministic rule
```

Scanner seeds these expertises/rules on startup if they don't exist (using slugs for lookup).

---

## Phase 4: Update ScanConfig and Event Types

### 4.1 ScanConfig changes

```typescript
interface ScanConfig {
  scanId: number;       // was runId
  appId: number;
  scanUrl: string;      // new — the URL to scan
  baseUrl: string;      // app's base URL for relativePath computation
  sizeClass: SizeClass;
  openaiApiKey?: string;
  testWorkerCount?: number;
  signal?: AbortSignal;
  // Remove: phases array (no more selectable phases)
}
```

### 4.2 ScanEventHandler changes

```typescript
interface ScanEventHandler {
  // Keep:
  onPageFound(page): void;
  onPageStateCreated(state): void;
  onStatsUpdated(stats): void;
  onScreenshotCaptured(data): void;
  onScanComplete(summary): void;
  onError(error): void;

  // New:
  onDecompositionJobCreated(job): void;
  onDecompositionJobCompleted(job): void;
  onTestSuiteCreated(suite): void;
  onTestRunCompleted(run): void;
  onFindingCreated(finding): void;

  // Remove:
  onPhaseChanged(phase): void;      // no more linear phases
  onActionCompleted(action): void;  // no more standalone actions
  onIssueDetected(issue): void;     // replaced by onFindingCreated
}
```

---

## Phase 5: testomniac_scanner — Server-Side Worker

**Project:** `/Users/johnhuang/projects/testomniac_scanner`

The scanner is a standalone Bun service that polls for pending scans and runs them via Puppeteer. Currently runs the full 5-phase pipeline. Needs to adopt the new Generate/Run loop.

### 5.1 Polling changes

**File:** `src/index.ts`

- Poll `GET /scanner/scans/pending` — API now only returns scans where `ownedByUserId IS NULL` (server-side scans)
- Remove phase updates (`updateRunPhase`) — no more linear phases
- Update status to `running` on pickup, `completed`/`failed` on finish

### 5.2 Orchestrator changes

**File:** `src/orchestrator.ts`

- Replace `runScan()` call (which takes a `phases` array) with new loop-based `runScan()` from scanning_service
- Remove phase-by-phase orchestration
- Pass `scanUrl` and `baseUrl` (for relativePath computation) from scan config
- Pass `sizeClass` instead of iterating size classes (scan already specifies sizeClass)

### 5.3 Test execution changes

**File:** `src/runner/worker-pool.ts`

- Replace `createIssue()` calls with `createTestRunFinding()` — findings replace issues
- Replace `screen` parameter with `sizeClass` in `createTestRun()`
- Use new `TestAction` format (persisted rows) instead of `LegacyTestAction`
- Run Expertise Rules after each test case execution

**File:** `src/runner/executor.ts`

- Update `mapActionToPuppeteer()` to handle new `TestAction` format (actionType, path, elementIdentityId) instead of `LegacyTestAction`
- Use `path` (relative) instead of `url` — construct full URL from `baseUrl + path`

### 5.4 Migrate plugins to Expertise Rules

**Files:** `src/plugins/seo/`, `src/plugins/security/`, `src/plugins/content/`, `src/plugins/ui-consistency/`

The scanner's plugin system (SEO, security, content, UI consistency checks) should be registered as Expertise Rules:

```
seo/*            → Expertise slug "seo", multiple rules (title, meta, h1, images, structured-data, open-graph)
security/*       → Expertise slug "security", multiple rules (api-keys, headers, csrf, mixed-content)
content/*        → Expertise slug "content", multiple rules (placeholders, readability, copyright, spelling)
ui-consistency/* → Expertise slug "ui-consistency", multiple rules (fonts, colors, spacing)
```

- Scanner seeds these expertises/rules on startup via API (idempotent, lookup by slug)
- Plugin `analyze()` results now create `TestRunFinding` objects instead of `Issue` objects
- Plugin interface stays the same internally, just the output mapping changes

### 5.5 Authentication & credential changes

- `src/auth/login-executor.ts` — keep, but credential lookup uses `title` instead of `name` for app
- `src/auth/credential-manager.ts` — keep as-is
- Email reports — keep, `createReportEmail()` unchanged

---

## Phase 6: testomniac_extension — Chrome Extension

**Project:** `/Users/johnhuang/projects/testomniac_extension`

The extension runs scans in the user's browser. It currently only runs `mouse_scanning` phase locally. Scans initiated from the extension set `ownedByUserId` so the server-side scanner does NOT pick them up.

### 6.1 Background service worker changes

**File:** `src/background/index.ts`

- Update `runScan()` call to use new loop-based API from scanning_service
- Remove `phases: ['mouse_scanning']` — the new `runScan()` uses the Generate/Run loop
- Pass `scanUrl` and `baseUrl` in ScanConfig
- Update `ScanEventHandler` to use new event callbacks:
  - Remove: `onPhaseChanged`, `onActionCompleted`, `onIssueDetected`
  - Add: `onDecompositionJobCreated`, `onDecompositionJobCompleted`, `onTestSuiteCreated`, `onTestRunCompleted`, `onFindingCreated`
- Bridge new events to side panel via `chrome.runtime.sendMessage()`
- On scan submission, ensure `ownedByUserId` is set to current user's Firebase UID

### 6.2 Side panel UI changes

**File:** `src/sidepanel/SidePanel.tsx`

**Phase display — replace 5-phase indicator with loop status:**
- Remove: mouse_scanning → ai_analysis → input_scanning → test_generation → test_execution dots
- Add: Show current loop iteration, "Generating..." / "Running..." status with counts

**Live counters — update labels:**
- Keep: Pages, States
- Change: "Actions" → "Test Runs", "Issues" → "Findings"
- Add: "Suites" counter (test suites created)

**Results tabs — update:**
- Remove: "Issues" tab, "Actions" tab
- Add: "Findings" tab (errors in red, warnings in yellow)
- Keep: "Overview" (screenshot), "Pages", "Events"
- Add: "Test Suites" tab showing created suites

**API calls — field renames:**
- Project/App creation: `name` → `title`
- Scan submission: include `scanUrl`, `createdByUserId`, `ownedByUserId`

### 6.3 Message protocol changes

Update message types between background and side panel:

```typescript
// Remove:
PHASE_CHANGED, ACTION_COMPLETED, ISSUE_DETECTED

// Add:
DECOMPOSITION_JOB_CREATED, DECOMPOSITION_JOB_COMPLETED,
TEST_SUITE_CREATED, TEST_RUN_COMPLETED, FINDING_CREATED

// Keep:
PAGE_FOUND, PAGE_STATE_CREATED, STATS_UPDATE,
SCREENSHOT_CAPTURED, SCAN_COMPLETE, SCAN_ERROR
```

### 6.4 ChromeAdapter changes

**File:** `src/adapters/ChromeAdapter.ts`

- No major changes needed — `BrowserAdapter` interface stays the same
- The adapter implementation (CDP + chrome.scripting) is independent of the data model

---

## Dependency Deployment

**Important:** Whenever you modify a lower-level library (e.g., `testomniac_types`, `testomniac_client`, `testomniac_scanning_service`), run `/Users/johnhuang/projects/testomniac_app/scripts/push_all.sh`. This deploys the library and updates all higher-level projects' dependencies.

Dependency chain: `testomniac_types` → `testomniac_scanning_service` → `testomniac_scanner` / `testomniac_extension`

Run `push_all.sh` after changes to types or scanning_service, before working on scanner or extension.

---

## Execution Order

1. **Scanning service API client** (Phase 1) — update HTTP client in testomniac_scanning_service
2. **Scanning service orchestrator** (Phase 2) — build the generate/run loop → run `push_all.sh`
3. **Scanning service cleanup** (Phase 3) — remove deprecated modules → run `push_all.sh`
4. **Scanning service events** (Phase 4) — update event types → run `push_all.sh`
5. **Scanner** (Phase 5) — update testomniac_scanner to use new scanning_service
6. **Extension** (Phase 6) — update testomniac_extension UI and background worker

---

## Verification

### Scanning service
- New `runScan()` function implements Generate/Run loop correctly
- Decomposition jobs create test suites with proper junction links
- Expertise rules produce findings equivalent to old issues
- Event handler fires new event types

### Scanner (server-side)
- Polls and picks up only scans where `ownedByUserId IS NULL`
- Runs full Generate/Run loop via Puppeteer
- Test runs create findings, not issues
- Plugins registered as Expertise Rules on startup
- Scan completes when no new page states discovered
- Email reports still sent

### Extension (client-side)
- Scans submitted with `ownedByUserId` set — scanner ignores them
- Side panel shows loop status instead of 5-phase dots
- Live counters show Test Runs and Findings instead of Actions and Issues
- Findings tab displays errors/warnings correctly
- New events bridge from background to side panel
