# Design: `/combined/next` endpoint

**Date:** 2026-06-10
**Status:** Approved

## Summary

Replace the 5-6 per-interaction API round-trips with a single `POST /api/v1/combined/next` endpoint. The runner captures raw page data from the browser and sends it to the API in one call. The API persists page state, runs all test generators server-side, persists findings, completes the interaction, and returns the next interaction to execute.

## Motivation

Currently, after each test interaction in discovery mode, the runner_service executor makes sequential API calls:

1. `ensurePageStateCombined()` — persist page + state + scaffolds + forms
2. Run 12 generators locally → produce surfaces/interactions
3. `generateAllSurfaceInteractions()` — persist generated tests
4. `ensureTestRunFindingBatch()` — persist findings
5. `completeInteractionRunCombined()` — complete interaction run
6. `getRunnerState()` — get next work

This is 5-6 HTTP round-trips per page landing. With a single `/combined/next` endpoint, this becomes 1.

## Architecture

```
runner (Puppeteer) ──→ runner_service executor ──→ POST /combined/next ──→ API
extension (Chrome) ──→ runner_service executor ──→ POST /combined/next ──→ API
```

Both runner and extension use runner_service's executor. The executor captures page data from the browser and delegates all server-side logic to the API via a single call. Generators move from runner_service to testomniac_api.

## Request: `CombinedNextRequest`

```typescript
interface CombinedNextRequest {
  // === Context (always required) ===
  runnerId: number;
  testRunId: number;
  bundleRunId: number;
  testSurfaceBundleId: number;
  sizeClass: SizeClass;
  testEnvironmentId?: number;

  // === Complete current interaction (omitted on first call) ===
  completion?: {
    testInteractionRunId: number;
    testInteractionId: number;
    testSurfaceId: number;
    surfaceRunId: number | null;
    status: string;
    durationMs?: number;
    errorMessage?: string;
    expectedOutcome?: string;
    observedOutcome?: string;
    screenshotPath?: string;
    consoleLog?: string;
    networkLog?: string;
  };

  // === Page state data (discovery mode only) ===
  pageState?: {
    pageId?: number;
    relativePath?: string;
    screenshotPath?: string;
    html: string;
    contentText: string;
    hashes: PageHashes;
    fixedBodyHash?: string;
    actionableItems: ActionableItem[];
    scaffolds: Array<{ type: string; html: string; hash: string; selector: string }>;
    scaffoldSelectorByItemSelector: Record<string, string>;
    forms?: Array<{ form: FormInfo; formType?: string }>;
    currentTestInteractionId: number;
    beginningPageStateId: number;
    journeySteps?: TestStep[];
    siteOrigin?: string;
    scanScopePath?: string;
    loginDetection?: LoginDetectionResult;
    loginConfig?: LoginConfig;
  };

  // === Findings from this interaction ===
  findings?: EnsureTestRunFindingRequest[];

  // === Stats update ===
  stats?: UpdateTestRunStatsRequest;
}
```

## Response: `CombinedNextResponse`

```typescript
interface CombinedNextResponse {
  // Page state result (if pageState was sent)
  pageState?: {
    pageId: number;
    pageStateId: number;
    isNew: boolean;
    requiresLogin: boolean;
  };

  // Next interaction to execute (null = no more work)
  next: {
    interactionRunId: number;
    surfaceRunId: number;
    testInteraction: TestInteractionResponse;
  } | null;

  // Summary of what the server did
  created: {
    surfaces: number;
    interactions: number;
    findings: number;
  };

  // Surfaces created (runner emits events from these)
  generatedSurfaces: Array<{ surfaceId: number; title: string }>;
}
```

## Server-side handler flow

```
POST /api/v1/combined/next

1. If completion provided:
   → Clear superseded findings for this interaction
   → Mark interaction run as complete

2. If pageState provided:
   → ensurePageState (existing logic) → pageId, pageStateId, scaffoldIdsBySelector
   → Check dedup: has this path/hash already been processed for this run?
   → If not deduped: run all 12 generators server-side
   → Persist generated surfaces + interactions (existing generateAllSurfaceInteractions logic)
   → Mark login page if detected

3. If findings provided:
   → Batch-persist findings

4. If stats provided:
   → Update test run stats

5. Select next work:
   → Query open surface runs + pending interaction runs for bundleRunId
   → Pick highest-priority pending interaction run
   → Load full TestInteraction with steps
   → Return it (or null if done)
```

## Dedup strategy

Generators currently use an in-memory `DedupStore` per run to avoid re-generating tests for pages/hashes already covered. On the server, this uses database queries instead:

- **Path dedup:** Check if a surface already exists for this `startingPath` + `runnerId`
- **Actionable hash dedup:** Check if a page state with this actionable hash already has generated surfaces

## Usage scenarios

| Scenario | Request | Response |
|----------|---------|----------|
| First call (get initial work) | `{ runnerId, testRunId, bundleRunId, ... }` | `{ next: {...} }` |
| Discovery mode | `{ completion, pageState, findings, stats }` | `{ pageState, next, created, generatedSurfaces }` |
| Execution mode (no discovery) | `{ completion, findings, stats }` | `{ next, created }` |
| Last interaction | any | `{ next: null }` |

## Changes per project

### testomniac_types

- Add `CombinedNextRequest` interface
- Add `CombinedNextResponse` interface
- Add `LoginDetectionResult` type (currently only in runner_service, needs to be shared)
- Add `LoginConfig` type (same)

### testomniac_api

- Create `src/routes/combined-next.ts` with `POST /combined/next` handler
- Create `src/generators/` directory with the 12 generator functions moved from runner_service:
  - `render.ts`, `forms.ts`, `navigation.ts`, `scaffolds.ts`, `content.ts`, `e2e.ts`, `dialogs.ts`, `hover-follow-up.ts`, `keyboard-disclosure.ts`, `login.ts`, `semantic-journeys.ts`, `variants.ts`
- Move pure helper functions needed by generators (pageHasOpenDialog, htmlToMarkdown, etc.)
- Implement dedup via DB queries instead of in-memory DedupStore
- Register the new route in `src/routes/index.ts` under scanner auth

### testomniac_runner_service

- **Remove** `src/ai/` directory (dead code — persona/scenario generation uses ShapeShyft API in testomniac_api, not OpenAI)
- **Remove** ai exports from `src/index.ts`
- **Remove** `src/analyzer/page-analyzer/generators/` directory (moved to API)
- **Remove** generator-related methods from PageAnalyzer class
- **Remove** `openai` from peerDependencies and devDependencies
- **Remove** `react`, `@types/react` from peerDependencies and devDependencies
- **Remove** `zustand` from devDependencies
- **Simplify** `test-interaction-executor.ts`: replace post-execution block (ensurePageState → generators → generateAllSurfaces → findings → complete) with single `api.combinedNext()` call
- **Add** `combinedNext()` method to `src/api/client.ts`
- **Update** `src/index.ts` exports to remove generator and ai exports

### testomniac_runner

No direct changes. Uses runner_service which handles the switch internally.

### testomniac_extension

No direct changes. Uses runner_service which handles the switch internally.

## Backward compatibility

- All existing endpoints (`ensurePageStateCombined`, `generateAllSurfaceInteractions`, `completeInteractionRunCombined`, `getRunnerState`) remain available
- The new endpoint is additive — old clients continue to work
- Migration is internal to runner_service's executor

## Testing

- Unit tests for `/combined/next` route handler in testomniac_api
- Test each sub-operation: page state persistence, generator execution, finding persistence, interaction completion, next selection
- Test all usage scenarios: first call, discovery mode, execution mode, last interaction
- Verify runner and extension both work through runner_service's updated executor
