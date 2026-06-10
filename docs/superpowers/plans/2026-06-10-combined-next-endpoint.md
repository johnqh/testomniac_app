# Combined Next Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 5-6 per-interaction API round-trips with a single `POST /api/v1/combined/next` endpoint by moving generator logic from runner_service to the API.

**Architecture:** The runner captures raw page data from the browser and sends it to the API in one call. The API persists page state, runs all test generators server-side, persists findings, completes the interaction, and returns the next interaction to execute. Generators move from `testomniac_runner_service/src/analyzer/page-analyzer/generators/` to `testomniac_api/src/generators/`.

**Tech Stack:** TypeScript, Bun, Hono (API), Drizzle ORM (DB), Vitest (tests)

**Spec:** `docs/superpowers/specs/2026-06-10-combined-next-endpoint-design.md`

---

## File Structure

### testomniac_types (1 file modified)
- Modify: `src/index.ts` — Add `CombinedNextRequest`, `CombinedNextResponse`, `LoginDetectionResult`, `LoginConfig`, `SSOButtonInfo` types

### testomniac_runner_service (files modified + deleted)
- Delete: `src/ai/analyzer.ts`, `src/ai/persona-generator.ts`, `src/ai/use-case-generator.ts`, `src/ai/input-generator.ts`
- Delete: `src/analyzer/page-analyzer/generators/` (all 12 files) — after API migration is confirmed working
- Modify: `src/index.ts` — Remove ai exports, remove generator exports
- Modify: `src/api/client.ts` — Add `combinedNext()` method
- Modify: `src/orchestrator/test-interaction-executor.ts` — Replace post-execution block with single `combinedNext()` call
- Modify: `src/analyzer/page-analyzer/index.ts` — Remove `generateTestInteractions()` and generator orchestration
- Modify: `package.json` — Remove openai, react, @types/react, zustand

### testomniac_api (files created + modified)
- Create: `src/generators/helpers.ts` — Extracted PageAnalyzer builder methods (pure functions)
- Create: `src/generators/dedup.ts` — DB-based dedup replacing in-memory DedupStore
- Create: `src/generators/orchestrator.ts` — Runs all generators, collects outputs
- Create: `src/generators/render.ts` — Render test generator
- Create: `src/generators/navigation.ts` — Navigation test generator
- Create: `src/generators/forms.ts` — Form test generator
- Create: `src/generators/scaffolds.ts` — Scaffold test generator
- Create: `src/generators/content.ts` — Content test generator
- Create: `src/generators/e2e.ts` — E2E test generator
- Create: `src/generators/dialogs.ts` — Dialog test generator
- Create: `src/generators/hover-follow-up.ts` — Hover follow-up generator
- Create: `src/generators/keyboard-disclosure.ts` — Keyboard/disclosure generator
- Create: `src/generators/login.ts` — Login test generator
- Create: `src/generators/semantic-journeys.ts` — Semantic journey generator
- Create: `src/generators/variants.ts` — Variant test generator
- Create: `src/generators/index.ts` — Re-exports
- Create: `src/routes/combined-next.ts` — POST /combined/next handler
- Create: `src/routes/combined-next.test.ts` — Tests
- Modify: `src/routes/index.ts` — Register new route

---

## Task 1: Add shared types to testomniac_types

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`

- [ ] **Step 1: Add LoginDetectionResult, SSOButtonInfo, LoginSignal types**

These types currently exist only in `testomniac_runner_service/src/scanner/login-detector.ts`. Add them to the shared types package so both the API and runner_service can use them.

Add before the `// === Response helpers ===` section:

```typescript
// ============================================================================
// Login Detection
// ============================================================================

export type LoginSignal =
  | 'url_pattern'
  | 'password_field'
  | 'email_password_form'
  | 'sso_buttons'
  | 'login_heading';

export interface SSOButtonInfo {
  provider: string;
  selector: string;
  text: string;
}

export interface LoginDetectionResult {
  isLoginPage: boolean;
  confidence: 'high' | 'medium' | 'low';
  signals: LoginSignal[];
  loginForm: FormInfo | null;
  ssoButtons: SSOButtonInfo[];
}

export interface LoginConfig {
  loginUrl?: string;
  email?: string;
  username?: string;
  password?: string;
  twoFactorCode?: string;
  authProvider?: string;
}
```

- [ ] **Step 2: Add CombinedNextRequest and CombinedNextResponse types**

Add after the LoginConfig interface:

```typescript
// ============================================================================
// Combined Next Endpoint
// ============================================================================

export interface CombinedNextCompletionPayload {
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
}

export interface CombinedNextPageStatePayload {
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
}

export interface CombinedNextRequest {
  runnerId: number;
  testRunId: number;
  bundleRunId: number;
  testSurfaceBundleId: number;
  sizeClass: SizeClass;
  testEnvironmentId?: number;
  completion?: CombinedNextCompletionPayload;
  pageState?: CombinedNextPageStatePayload;
  findings?: EnsureTestRunFindingRequest[];
  stats?: UpdateTestRunStatsRequest;
}

export interface CombinedNextResponseNext {
  interactionRunId: number;
  surfaceRunId: number;
  testInteraction: TestInteractionResponse;
}

export interface CombinedNextResponse {
  pageState?: {
    pageId: number;
    pageStateId: number;
    isNew: boolean;
    requiresLogin: boolean;
  };
  next: CombinedNextResponseNext | null;
  created: {
    surfaces: number;
    interactions: number;
    findings: number;
  };
  generatedSurfaces: Array<{ surfaceId: number; title: string }>;
}
```

- [ ] **Step 3: Run typecheck**

Run: `cd /Users/johnhuang/projects/testomniac_types && bun run typecheck`
Expected: PASS

- [ ] **Step 4: Run tests**

Run: `cd /Users/johnhuang/projects/testomniac_types && bun test`
Expected: PASS

- [ ] **Step 5: Build and commit**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run build
git add src/index.ts && git commit -m "feat: add CombinedNext and LoginDetection shared types"
```

---

## Task 2: Clean up runner_service dead code and dependencies

**Files:**
- Delete: `/Users/johnhuang/projects/testomniac_runner_service/src/ai/analyzer.ts`
- Delete: `/Users/johnhuang/projects/testomniac_runner_service/src/ai/persona-generator.ts`
- Delete: `/Users/johnhuang/projects/testomniac_runner_service/src/ai/use-case-generator.ts`
- Delete: `/Users/johnhuang/projects/testomniac_runner_service/src/ai/input-generator.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/package.json`

- [ ] **Step 1: Delete the src/ai/ directory**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
rm -rf src/ai/
```

- [ ] **Step 2: Remove AI exports from src/index.ts**

Remove these lines from `src/index.ts`:

```typescript
export { runAiAnalysis, type AnalyzerOptions } from "./ai/analyzer";
export { generatePersonas, type PersonaResult } from "./ai/persona-generator";
export { generateUseCases, type UseCaseResult } from "./ai/use-case-generator";
export { generateInputValues, type InputValueResult } from "./ai/input-generator";
```

- [ ] **Step 3: Remove unused dependencies from package.json**

In `peerDependencies`, remove:
```json
"openai": ">=6.0.0",
"react": ">=18.0.0"
```

Also remove `peerDependenciesMeta` entries for openai and react if they exist.

In `devDependencies`, remove:
```json
"@types/react": "^19.2.0",
"openai": "^6.7.0",
"react": "^19.2.0",
"zustand": "^5.0.0"
```

- [ ] **Step 4: Update LoginDetectionResult and LoginConfig imports to use shared types**

In `src/scanner/login-detector.ts`, remove the local `LoginDetectionResult`, `SSOButtonInfo`, and `LoginSignal` type definitions and import them from `@sudobility/testomniac_types` instead. Keep the `detectLoginPage` function implementation.

In `src/orchestrator/login-manager.ts`, remove the local `LoginConfig` interface and import it from `@sudobility/testomniac_types` instead. Keep the `LoginManager` class implementation.

Update `src/index.ts` exports to re-export these types from `@sudobility/testomniac_types` instead of the local files.

- [ ] **Step 5: Install dependencies and typecheck**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
bun install
bun run typecheck
```

Expected: PASS (no code references the removed ai/ module)

- [ ] **Step 6: Run tests**

```bash
bun test
```

Expected: All existing tests PASS

- [ ] **Step 7: Build and commit**

```bash
bun run build
git add -A && git commit -m "chore: remove dead ai module and unused openai/react/zustand dependencies"
```

---

## Task 3: Create generator helpers in testomniac_api

The 12 generators depend on 25+ PageAnalyzer helper methods. These are pure functions that build TestInteraction/TestSurface objects from page data. Extract them into `src/generators/helpers.ts` in the API.

**Files:**
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/helpers.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/dedup.ts`

- [ ] **Step 1: Copy PageAnalyzer builder methods to helpers.ts**

Read `/Users/johnhuang/projects/testomniac_runner_service/src/analyzer/page-analyzer/index.ts` and extract all `build*` methods, `select*` methods, `is*` predicate methods, `plan*` methods, and utility methods used by generators into standalone functions in `src/generators/helpers.ts`.

The key transformation: methods like `this.buildRenderTestInteraction(...)` become exported functions `buildRenderTestInteraction(...)`. Any references to `this.` that access instance state (like dedup stores) should be replaced with parameters.

Methods to extract (with approximate line ranges in PageAnalyzer):
- `getGeneratedKey` (1002-1008)
- `getPrimarySelector` (974-980)
- `getItemKey` (982-1020)
- `selectRepresentativeItems` (4051-4094)
- `getScaffoldSurfaceItems` (736-750)
- `isSurfaceCandidate` (810-816)
- `isMouseActionable` (781-787)
- `isDialogCloseItem` (4299-4301)
- `isDisclosureItem`, `isKeyboardPrimaryAction`, `isFocusableControl`
- `isNegativeCandidateField` (3087-3097)
- `isPasswordScenario` (3099-3107)
- `isSearchForm` (1954-1960)
- `isAddToCartItem`, `isCheckoutItem`, etc. (4160-4297)
- `shouldUseDirectControlInteraction` (3747-3762)
- `pageHasOpenDialog` (4303-4311)
- `identifyFormType` (1898-1952)
- `describeForm` (2208-2213)
- `normalizeForms`
- `planFormValues` (1845-1896)
- `detectPasswordRequirements` (4433-4525)
- `extractVisibleText` (4424-4432)
- `buildRenderTestInteraction` (1235-1302)
- `buildNavigationTestInteraction` (831-866)
- `buildHoverTestInteraction` (868-909)
- `buildControlInteractionTestInteraction` (3764-3882)
- `buildFormTestInteraction` (1305-1393)
- `buildNegativeFormTestInteraction` (1395-1452)
- `buildFormCorrectionTestInteraction` (1454-1551)
- `buildPasswordTestInteractions` (1554-1612)
- `buildSearchTestInteractions` (1977-2173)
- `buildE2ETestInteraction` (1614-1639)
- `buildSemanticJourneyTestInteractions` (2215-2960)
- `buildJourneyTestInteraction` (2962-2988)
- `buildJourneyAction` (2990-3018)
- `buildDialogCloseTestInteraction` (3648-3697)
- `buildEscapeDialogTestInteraction` (3699-3740)
- `buildKeyboardAndDisclosureTestInteractions` (3113-3222)
- `buildDisclosureToggleTestInteraction` (3530-3578)
- `buildKeyboardActivateTestInteraction` (3580-3646)
- `buildVariantTestInteractions` (3224-3270)
- `buildVariantTestInteraction` (3273-3331)
- `buildVariantPurchaseJourney` (3333-3460)
- `buildRequiredVariantGuardTestInteraction` (3463-3527)
- `estimateCollectionCount` (4178-4215)

Each method becomes an exported function. Instance state (`this.store`, `this.surfacesCache`) becomes parameters. Import types from `@sudobility/testomniac_types`.

```typescript
// src/generators/helpers.ts
import type {
  ActionableItem,
  TestInteraction,
  TestSurface,
  TestStep,
  FormInfo,
  SizeClass,
  LoginDetectionResult,
  LoginConfig,
} from '@sudobility/testomniac_types';

// Each PageAnalyzer method becomes an exported standalone function.
// Example pattern:
//
// Before (in PageAnalyzer class):
//   buildRenderTestInteraction(path, sizeClass, uid, pageStateId, pageId) { ... }
//
// After (standalone function):
//   export function buildRenderTestInteraction(
//     path: string, sizeClass: SizeClass, uid: string | undefined,
//     pageStateId: number, pageId: number
//   ): TestInteraction { ... }
```

- [ ] **Step 2: Create dedup.ts for DB-based deduplication**

```typescript
// src/generators/dedup.ts
import { db } from '../db';
import { testSurfaces, testInteractions } from '../db/schema';
import { and, eq, like } from 'drizzle-orm';

export interface GeneratorDedup {
  hasGeneratedForPath(path: string): Promise<boolean>;
  hasGeneratedForActionableHash(hash: string): Promise<boolean>;
  hasGeneratedSelectorForBasePath(
    basePath: string,
    actionType: string,
    selector: string
  ): Promise<boolean>;
  markGeneratedSelectorForBasePath(
    basePath: string,
    actionType: string,
    selector: string
  ): void;
}

export function createGeneratorDedup(runnerId: number): GeneratorDedup {
  // In-memory set for within-request dedup (selectors generated in this batch)
  const generatedSelectors = new Set<string>();

  return {
    async hasGeneratedForPath(path: string): Promise<boolean> {
      const existing = await db
        .select({ id: testSurfaces.id })
        .from(testSurfaces)
        .where(
          and(
            eq(testSurfaces.runnerId, runnerId),
            eq(testSurfaces.startingPath, path)
          )
        )
        .limit(1);
      return existing.length > 0;
    },

    async hasGeneratedForActionableHash(hash: string): Promise<boolean> {
      // Check if any page state with this actionable hash already has surfaces
      // This is approximated by checking if surfaces exist for this runner
      // with a matching path pattern
      return false; // Conservative: always generate
    },

    async hasGeneratedSelectorForBasePath(
      basePath: string,
      actionType: string,
      selector: string
    ): Promise<boolean> {
      const key = `${basePath}:${actionType}:${selector}`;
      return generatedSelectors.has(key);
    },

    markGeneratedSelectorForBasePath(
      basePath: string,
      actionType: string,
      selector: string
    ): void {
      const key = `${basePath}:${actionType}:${selector}`;
      generatedSelectors.add(key);
    },
  };
}
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/generators/ && git commit -m "feat: add generator helpers and dedup infrastructure"
```

---

## Task 4: Move generators to testomniac_api

Copy each of the 12 generator files from `testomniac_runner_service/src/analyzer/page-analyzer/generators/` to `testomniac_api/src/generators/`. For each file, apply these mechanical transformations:

1. Replace `analyzer: any` parameter with explicit imports from `./helpers`
2. Replace `analyzer.buildXXX()` calls with `buildXXX()` imported from `./helpers`
3. Replace `analyzer.selectRepresentativeItems()` with `selectRepresentativeItems()` from `./helpers`
4. Replace `analyzer.hasGeneratedSelectorForBasePath()` / `markGeneratedSelectorForBasePath()` with `dedup.hasGeneratedSelectorForBasePath()` / `dedup.markGeneratedSelectorForBasePath()` passed as parameter
5. For generators that make API calls (navigation, hover-follow-up, login): replace `context.api.*` calls with direct DB operations using Drizzle

**Files:**
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/render.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/navigation.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/forms.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/scaffolds.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/content.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/e2e.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/dialogs.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/hover-follow-up.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/keyboard-disclosure.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/login.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/semantic-journeys.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/variants.ts`
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/index.ts`

- [ ] **Step 1: Copy and adapt each generator**

For each generator file, copy from runner_service and apply the transformation pattern. Example for `render.ts` (simplest generator):

**Source** (`testomniac_runner_service/src/analyzer/page-analyzer/generators/render.ts`):
```typescript
export async function generateRenderTestInteractions(
  analyzer: any,
  context: AnalyzerContext
): Promise<GeneratorOutput> {
  const interaction = analyzer.buildRenderTestInteraction(
    context.currentPath, context.sizeClass, context.uid,
    context.currentPageStateId, context.pageId
  );
  const key = analyzer.getGeneratedKey(interaction);
  return {
    creates: [{
      testSurface: { /* ... */ },
      interactions: [{ testInteraction: interaction, generatedKey: key }],
      desiredKeys: [key],
    }],
    reconciles: [],
  };
}
```

**Target** (`testomniac_api/src/generators/render.ts`):
```typescript
import type { GeneratorOutput } from './types';
import type { GeneratorContext } from './orchestrator';
import { buildRenderTestInteraction, getGeneratedKey } from './helpers';

export async function generateRenderTestInteractions(
  context: GeneratorContext
): Promise<GeneratorOutput> {
  const interaction = buildRenderTestInteraction(
    context.currentPath, context.sizeClass, context.uid,
    context.currentPageStateId, context.pageId
  );
  const key = getGeneratedKey(interaction);
  return {
    creates: [{
      testSurface: { /* ... */ },
      interactions: [{ testInteraction: interaction, generatedKey: key }],
      desiredKeys: [key],
    }],
    reconciles: [],
  };
}
```

**The pattern for ALL generators is the same:**
- Remove `analyzer: any` parameter
- Import helper functions from `./helpers`
- Replace `analyzer.method()` with direct function call
- For generators with API calls, replace with DB operations or pass a `db` context

Apply this pattern to all 12 generators. The generators with direct API calls need additional adaptation:

**navigation.ts**: Replace `api.getOpenTestSurfaceRuns()` and `api.ensureTestInteractionBatch()` with direct Drizzle DB queries.

**hover-follow-up.ts**: Replace `api.getItemsByPageState()` and `api.ensureTestInteractionBatch()` with direct DB queries.

**login.ts**: Replace `api.ensureTestSurfaceWithRun()`, `analyzer.ensureTestInteraction()`, and `analyzer.ensureInteractionRun()` with direct DB operations.

**scaffolds.ts**: Replace `api.getTestSurfacesByRunner()` with direct DB query.

- [ ] **Step 2: Create GeneratorContext type and index.ts**

```typescript
// src/generators/types.ts
import type {
  ActionableItem, FormInfo, TestStep, SizeClass,
  LoginDetectionResult, LoginConfig, PageHashes,
  GeneratorSurfaceOutput, GeneratorReconcileOutput,
} from '@sudobility/testomniac_types';
import type { GeneratorDedup } from './dedup';

export interface GeneratorContext {
  runnerId: number;
  testRunId: number;
  testEnvironmentId?: number;
  sizeClass: SizeClass;
  uid?: string;
  currentTestInteractionId: number;
  currentTestSurfaceId: number;
  currentSurfaceRunId: number | null;
  html: string;
  currentPageStateId: number;
  beginningPageStateId: number;
  currentPath: string;
  pageId: number;
  pageRequiresLogin: boolean;
  scaffolds: Array<{ type: string; html: string; hash: string; selector: string }>;
  scaffoldSelectorByItemSelector: Record<string, string>;
  scaffoldIdsBySelector: Record<string, number>;
  actionableItems: ActionableItem[];
  forms: FormInfo[];
  journeySteps: TestStep[];
  siteOrigin?: string;
  scanScopePath?: string;
  loginDetection?: LoginDetectionResult;
  loginConfig?: LoginConfig;
  navigationSurfaceId: number;
  bundleRunId: number;
  testSurfaceBundleId: number;
  dedup: GeneratorDedup;
}

export interface GeneratorOutput {
  creates: GeneratorSurfaceOutput[];
  reconciles: GeneratorReconcileOutput[];
}
```

```typescript
// src/generators/index.ts
export { runAllGenerators } from './orchestrator';
export type { GeneratorContext, GeneratorOutput } from './types';
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/generators/ && git commit -m "feat: migrate 12 test generators from runner_service to API"
```

---

## Task 5: Create generator orchestrator

**Files:**
- Create: `/Users/johnhuang/projects/testomniac_api/src/generators/orchestrator.ts`

- [ ] **Step 1: Create orchestrator that runs all generators and collects outputs**

```typescript
// src/generators/orchestrator.ts
import type { GeneratorContext, GeneratorOutput } from './types';
import type {
  GeneratorSurfaceOutput,
  GeneratorReconcileOutput,
} from '@sudobility/testomniac_types';

import { generateRenderTestInteractions } from './render';
import { generateFormTestInteractions } from './forms';
import { generateScaffoldTestInteractions } from './scaffolds';
import { generateContentTestInteractions } from './content';
import { generateE2ETestInteractions } from './e2e';
import { generateSemanticJourneyTestInteractions } from './semantic-journeys';
import { generateDialogLifecycleTestInteractions } from './dialogs';
import { generateKeyboardAndDisclosureTestInteractions } from './keyboard-disclosure';
import { generateVariantTestInteractions } from './variants';
import { generateNavigationTestInteractions } from './navigation';
import { generateHoverFollowUpCases } from './hover-follow-up';
import { generateLoginTestInteractions } from './login';

export interface GeneratorResults {
  creates: GeneratorSurfaceOutput[];
  reconciles: GeneratorReconcileOutput[];
  navigationCreated: number;
  loginCreated: number;
}

export async function runAllGenerators(
  context: GeneratorContext,
  isHoverOnly: boolean
): Promise<GeneratorResults> {
  // Hover-only interactions only generate follow-up hover cases
  if (isHoverOnly) {
    const hoverCount = await generateHoverFollowUpCases(context);
    return { creates: [], reconciles: [], navigationCreated: 0, loginCreated: hoverCount };
  }

  // Run all batch generators concurrently
  const [
    renderOutput,
    formOutput,
    scaffoldOutput,
    contentOutput,
    e2eOutput,
    journeyOutput,
    dialogOutput,
    keyboardOutput,
    variantOutput,
  ] = await Promise.all([
    generateRenderTestInteractions(context),
    generateFormTestInteractions(context),
    generateScaffoldTestInteractions(context),
    generateContentTestInteractions(context),
    generateE2ETestInteractions(context),
    generateSemanticJourneyTestInteractions(context),
    generateDialogLifecycleTestInteractions(context),
    generateKeyboardAndDisclosureTestInteractions(context),
    generateVariantTestInteractions(context),
  ]);

  const allOutputs = [
    renderOutput, formOutput, scaffoldOutput, contentOutput,
    e2eOutput, journeyOutput, dialogOutput, keyboardOutput, variantOutput,
  ];

  const creates = allOutputs.flatMap(o => o.creates);
  const reconciles = allOutputs.flatMap(o => o.reconciles);

  // Login generator (direct DB operations, runs if login page detected)
  let loginCreated = 0;
  if (context.loginDetection?.isLoginPage) {
    loginCreated = await generateLoginTestInteractions(context);
  }

  // Navigation generator (direct DB operations, runs last)
  const navigationCreated = await generateNavigationTestInteractions(context);

  return { creates, reconciles, navigationCreated, loginCreated };
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/generators/orchestrator.ts && git commit -m "feat: add generator orchestrator"
```

---

## Task 6: Create /combined/next route handler

**Files:**
- Create: `/Users/johnhuang/projects/testomniac_api/src/routes/combined-next.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/index.ts`

- [ ] **Step 1: Write the route handler test**

Create `/Users/johnhuang/projects/testomniac_api/src/routes/combined-next.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  CombinedNextRequest,
  CombinedNextResponse,
} from '@sudobility/testomniac_types';

describe('CombinedNextRequest validation', () => {
  it('requires context fields', () => {
    const request: CombinedNextRequest = {
      runnerId: 1,
      testRunId: 1,
      bundleRunId: 1,
      testSurfaceBundleId: 1,
      sizeClass: 'desktop',
    };
    expect(request.runnerId).toBe(1);
    expect(request.completion).toBeUndefined();
    expect(request.pageState).toBeUndefined();
  });

  it('accepts completion payload', () => {
    const request: CombinedNextRequest = {
      runnerId: 1,
      testRunId: 1,
      bundleRunId: 1,
      testSurfaceBundleId: 1,
      sizeClass: 'desktop',
      completion: {
        testInteractionRunId: 10,
        testInteractionId: 5,
        testSurfaceId: 3,
        surfaceRunId: 7,
        status: 'passed',
        durationMs: 1500,
      },
    };
    expect(request.completion?.status).toBe('passed');
  });

  it('response shape with next interaction', () => {
    const response: CombinedNextResponse = {
      next: {
        interactionRunId: 42,
        surfaceRunId: 12,
        testInteraction: {} as any,
      },
      created: { surfaces: 3, interactions: 15, findings: 2 },
      generatedSurfaces: [{ surfaceId: 1, title: 'Render: /home' }],
    };
    expect(response.next?.interactionRunId).toBe(42);
    expect(response.created.surfaces).toBe(3);
  });

  it('response shape when no more work', () => {
    const response: CombinedNextResponse = {
      next: null,
      created: { surfaces: 0, interactions: 0, findings: 0 },
      generatedSurfaces: [],
    };
    expect(response.next).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it passes (type validation)**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun test src/routes/combined-next.test.ts
```

Expected: PASS

- [ ] **Step 3: Create the route handler**

Create `/Users/johnhuang/projects/testomniac_api/src/routes/combined-next.ts`:

```typescript
import { Hono } from 'hono';
import { db } from '../db';
import {
  testInteractionRuns,
  testRunFindings,
  testSurfaceRuns,
  testRuns,
  testInteractions,
} from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import {
  successResponse,
  errorResponse,
  type CombinedNextRequest,
  type CombinedNextResponse,
} from '@sudobility/testomniac_types';
import { runAllGenerators } from '../generators/orchestrator';
import { createGeneratorDedup } from '../generators/dedup';

const combinedNextRouter = new Hono();

combinedNextRouter.post('/next', async (c) => {
  const body = (await c.req.json()) as CombinedNextRequest;
  const {
    runnerId, testRunId, bundleRunId, testSurfaceBundleId,
    sizeClass, testEnvironmentId,
    completion, pageState, findings, stats,
  } = body;

  let surfacesCreated = 0;
  let interactionsCreated = 0;
  let findingsCreated = 0;
  let pageStateResult: CombinedNextResponse['pageState'] | undefined;
  const generatedSurfaces: CombinedNextResponse['generatedSurfaces'] = [];

  // --- Step 1: Complete current interaction ---
  if (completion) {
    // Clear superseded findings
    await db.delete(testRunFindings).where(
      and(
        eq(testRunFindings.testInteractionRunId, completion.testInteractionRunId),
        // Additional conditions for superseded findings
      )
    );

    // Mark interaction run as complete
    await db.update(testInteractionRuns)
      .set({
        status: completion.status,
        durationMs: completion.durationMs,
        errorMessage: completion.errorMessage,
        expectedOutcome: completion.expectedOutcome,
        observedOutcome: completion.observedOutcome,
        screenshotPath: completion.screenshotPath,
        consoleLog: completion.consoleLog,
        networkLog: completion.networkLog,
        completedAt: new Date().toISOString(),
      })
      .where(eq(testInteractionRuns.id, completion.testInteractionRunId));
  }

  // --- Step 2: Ensure page state + run generators ---
  if (pageState) {
    // Reuse existing ensurePageState logic from combined.ts
    // This is the same logic as POST /combined/ensure-page-state
    const ensureResult = await ensurePageStateInternal({
      pageId: pageState.pageId,
      relativePath: pageState.relativePath,
      runnerId,
      testEnvironmentId,
      sizeClass,
      screenshotPath: pageState.screenshotPath,
      html: pageState.html,
      contentText: pageState.contentText,
      hashes: pageState.hashes,
      fixedBodyHash: pageState.fixedBodyHash,
      actionableItems: pageState.actionableItems,
      scaffolds: pageState.scaffolds,
      scaffoldSelectorByItemSelector: pageState.scaffoldSelectorByItemSelector,
      forms: pageState.forms,
      createdByTestRunId: testRunId,
    });

    pageStateResult = {
      pageId: ensureResult.pageId,
      pageStateId: ensureResult.pageStateId,
      isNew: ensureResult.isNew,
      requiresLogin: ensureResult.requiresLogin,
    };

    // Run generators
    const dedup = createGeneratorDedup(runnerId);
    const generatorContext = {
      runnerId,
      testRunId,
      testEnvironmentId,
      sizeClass: sizeClass as any,
      uid: undefined,
      currentTestInteractionId: pageState.currentTestInteractionId,
      currentTestSurfaceId: completion?.testSurfaceId ?? 0,
      currentSurfaceRunId: completion?.surfaceRunId ?? null,
      html: pageState.html,
      currentPageStateId: ensureResult.pageStateId,
      beginningPageStateId: pageState.beginningPageStateId,
      currentPath: pageState.relativePath ?? '',
      pageId: ensureResult.pageId,
      pageRequiresLogin: ensureResult.requiresLogin,
      scaffolds: pageState.scaffolds,
      scaffoldSelectorByItemSelector: pageState.scaffoldSelectorByItemSelector,
      scaffoldIdsBySelector: ensureResult.scaffoldIdsBySelector,
      actionableItems: pageState.actionableItems,
      forms: (pageState.forms ?? []).map(f => f.form),
      journeySteps: pageState.journeySteps ?? [],
      siteOrigin: pageState.siteOrigin,
      scanScopePath: pageState.scanScopePath,
      loginDetection: pageState.loginDetection,
      loginConfig: pageState.loginConfig,
      navigationSurfaceId: 0, // Resolved from DB
      bundleRunId,
      testSurfaceBundleId,
      dedup,
    };

    // Resolve navigation surface ID
    // (query for the "Direct Navigations" surface for this runner)
    const navSurface = await db.select({ id: testSurfaces.id })
      .from(testSurfaces)
      .where(and(
        eq(testSurfaces.runnerId, runnerId),
        eq(testSurfaces.title, 'Direct Navigations')
      ))
      .limit(1);
    if (navSurface.length > 0) {
      generatorContext.navigationSurfaceId = navSurface[0].id;
    }

    const isHoverOnly = false; // Determined by test interaction type
    const generatorResults = await runAllGenerators(generatorContext, isHoverOnly);

    // Persist generator outputs using existing generateAllSurfaceInteractions logic
    if (generatorResults.creates.length > 0 || generatorResults.reconciles.length > 0) {
      const persistResult = await persistGeneratorOutputs({
        runnerId,
        testEnvironmentId,
        sizeClass,
        testSurfaceBundleId,
        testSurfaceBundleRunId: bundleRunId,
        surfaces: generatorResults.creates,
        reconcileOnly: generatorResults.reconciles,
      });

      surfacesCreated = persistResult.surfacesCreated;
      interactionsCreated = persistResult.interactionsCreated;
      generatedSurfaces.push(...persistResult.generatedSurfaces);
    }

    surfacesCreated += generatorResults.navigationCreated;
    interactionsCreated += generatorResults.loginCreated;

    // Mark login page if detected
    if (pageState.loginDetection?.isLoginPage) {
      await db.update(pages)
        .set({ isLoginPage: true })
        .where(eq(pages.id, ensureResult.pageId));
    }
  }

  // --- Step 3: Persist findings ---
  if (findings && findings.length > 0) {
    // Reuse existing ensureTestRunFindingBatch logic
    const created = await ensureFindingsBatch(findings);
    findingsCreated = created.length;
  }

  // --- Step 4: Update stats ---
  if (stats) {
    await db.update(testRuns)
      .set({
        pagesFound: stats.pagesFound,
        pageStatesFound: stats.pageStatesFound,
        testRunsCompleted: stats.testRunsCompleted,
        statusUpdate: stats.status_update,
      })
      .where(eq(testRuns.id, testRunId));
  }

  // --- Step 5: Select next work ---
  const next = await selectNextInteraction(bundleRunId);

  const response: CombinedNextResponse = {
    pageState: pageStateResult,
    next,
    created: {
      surfaces: surfacesCreated,
      interactions: interactionsCreated,
      findings: findingsCreated,
    },
    generatedSurfaces,
  };

  return c.json(successResponse(response));
});

async function selectNextInteraction(
  bundleRunId: number
): Promise<CombinedNextResponse['next']> {
  // Query for pending interaction runs within open surface runs for this bundle
  const pendingRuns = await db
    .select({
      interactionRunId: testInteractionRuns.id,
      surfaceRunId: testInteractionRuns.testSurfaceRunId,
      testInteractionId: testInteractionRuns.testInteractionId,
    })
    .from(testInteractionRuns)
    .innerJoin(
      testSurfaceRuns,
      eq(testInteractionRuns.testSurfaceRunId, testSurfaceRuns.id)
    )
    .where(
      and(
        eq(testSurfaceRuns.testSurfaceBundleRunId, bundleRunId),
        eq(testInteractionRuns.status, 'pending'),
        eq(testSurfaceRuns.status, 'pending')
      )
    )
    .orderBy(testInteractionRuns.priority)
    .limit(1);

  if (pendingRuns.length === 0) {
    return null;
  }

  const pending = pendingRuns[0];

  // Load the full test interaction with steps
  const [interaction] = await db
    .select()
    .from(testInteractions)
    .where(eq(testInteractions.id, pending.testInteractionId))
    .limit(1);

  if (!interaction) {
    return null;
  }

  return {
    interactionRunId: pending.interactionRunId,
    surfaceRunId: pending.surfaceRunId,
    testInteraction: interaction as any,
  };
}

export { combinedNextRouter };
```

Note: `ensurePageStateInternal`, `persistGeneratorOutputs`, and `ensureFindingsBatch` should be extracted from the existing `combined.ts` as reusable internal functions. The existing combined.ts already has this logic — extract it into shared helpers rather than duplicating.

- [ ] **Step 4: Register the route**

In `/Users/johnhuang/projects/testomniac_api/src/routes/index.ts`, add:

```typescript
import { combinedNextRouter } from './combined-next';
```

And in the scanner-auth section, add:

```typescript
scannerRoutes.route("/combined", combinedNextRouter);
```

- [ ] **Step 5: Typecheck and test**

```bash
cd /Users/johnhuang/projects/testomniac_api
bun run typecheck
bun test src/routes/combined-next.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/routes/combined-next.ts src/routes/combined-next.test.ts src/routes/index.ts
git commit -m "feat: add POST /combined/next endpoint"
```

---

## Task 7: Add combinedNext() to runner_service ApiClient

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/api/client.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/index.ts`

- [ ] **Step 1: Add combinedNext method to ApiClient**

In `src/api/client.ts`, add the new method:

```typescript
async combinedNext(
  params: CombinedNextRequest
): Promise<CombinedNextResponse> {
  const res = await this.post<CombinedNextResponse>(
    '/combined/next',
    params
  );
  return res;
}
```

Add the import at the top:

```typescript
import type {
  CombinedNextRequest,
  CombinedNextResponse,
} from '@sudobility/testomniac_types';
```

- [ ] **Step 2: Export the new types from index.ts**

In `src/index.ts`, ensure `CombinedNextRequest` and `CombinedNextResponse` are re-exported from testomniac_types (they should already be available via the types package).

- [ ] **Step 3: Typecheck**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && bun run typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/api/client.ts src/index.ts
git commit -m "feat: add combinedNext() method to ApiClient"
```

---

## Task 8: Simplify test-interaction-executor in runner_service

Replace the post-execution block that makes 5-6 API calls with a single `api.combinedNext()` call.

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/test-interaction-executor.ts`

- [ ] **Step 1: Replace post-execution block**

In `test-interaction-executor.ts`, find the section after test execution completes (approximately lines 800-940) where it:
1. Calls `api.completeInteractionRunCombined()`
2. Calls `analyzer.generateTestInteractions()`
3. Calls `api.ensureTestRunFindingBatch()`

Replace this entire block with a single `api.combinedNext()` call:

```typescript
// Build the combined request
const combinedRequest: CombinedNextRequest = {
  runnerId: testRun.runnerId,
  testRunId: testRun.id,
  bundleRunId: discoveryContext?.bundleRun.id ?? 0,
  testSurfaceBundleId: discoveryContext?.bundleRun.testSurfaceBundleId ?? 0,
  sizeClass: testRun.sizeClass as SizeClass,
  testEnvironmentId: testRun.testEnvironmentId ?? undefined,

  completion: {
    testInteractionRunId: testInteractionRun.id,
    testInteractionId: testInteraction.id,
    testSurfaceId: testInteraction.testSurfaceId,
    surfaceRunId: testInteractionRun.testSurfaceRunId,
    status: overallStatus,
    durationMs: Date.now() - startTime,
    errorMessage: errorMessage ?? undefined,
    expectedOutcome: expectedOutcome ?? undefined,
    observedOutcome: observedOutcome ?? undefined,
    screenshotPath: screenshotPath ?? undefined,
    consoleLog: consoleLog ?? undefined,
    networkLog: networkLog ?? undefined,
  },

  // Page state data (discovery mode only)
  pageState: analyzer && discoveryContext ? {
    pageId: 0,
    relativePath: currentPath,
    screenshotPath,
    html,
    contentText: htmlToMarkdown(html).slice(0, 5000),
    hashes: computeHashes(html),
    fixedBodyHash: computeFixedBodyHash(html, scaffolds),
    actionableItems: items,
    scaffolds: scaffolds.map(s => ({
      type: s.type, html: s.outerHtml, hash: s.hash, selector: s.selector,
    })),
    scaffoldSelectorByItemSelector,
    forms: forms.map(f => ({ form: f, formType: undefined })),
    currentTestInteractionId: testInteraction.id,
    beginningPageStateId: testInteraction.startingPageStateId ?? 0,
    journeySteps,
    siteOrigin: new URL(currentUrl).origin,
    scanScopePath,
    loginDetection,
    loginConfig: loginManager?.getConfig(),
  } : undefined,

  findings: allFindings.length > 0 ? allFindings : undefined,

  stats: {
    pagesFound: stats.pagesFound,
    pageStatesFound: stats.pageStatesFound,
    testRunsCompleted: stats.testRunsCompleted,
  },
};

const result = await api.combinedNext(combinedRequest);

// Emit events from the response
if (result.pageState) {
  events.onPageFound?.({
    pageId: result.pageState.pageId,
    path: currentPath,
  });
}
for (const surface of result.generatedSurfaces) {
  events.onTestSurfaceCreated?.(surface);
}

// The result.next is used by the main loop (returned or stored for next iteration)
```

- [ ] **Step 2: Remove generator-related imports**

Remove imports of:
- `PageAnalyzer` (if no longer needed)
- Individual generator functions
- `ensurePageStateCombined` related types (if no longer called directly)

- [ ] **Step 3: Typecheck**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && bun run typecheck
```

Expected: PASS

- [ ] **Step 4: Run tests**

```bash
bun test
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/orchestrator/test-interaction-executor.ts
git commit -m "refactor: replace 5-6 post-execution API calls with single combinedNext()"
```

---

## Task 9: Update runner.ts main loop to use combinedNext response

The main execution loop in `runner.ts` currently calls `getRunnerState()` to find the next interaction. With `/combined/next`, the response already contains the next interaction.

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/runner.ts`

- [ ] **Step 1: Update the main loop**

Modify the main execution loop to use the `next` field from the `combinedNext()` response instead of calling `getRunnerState()` separately. The first iteration still needs to call `getRunnerState()` (or `combinedNext` without completion/pageState) to get the initial interaction.

- [ ] **Step 2: Typecheck and test**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
bun run typecheck && bun test
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/orchestrator/runner.ts
git commit -m "refactor: use combinedNext response for next interaction selection"
```

---

## Task 10: Remove generators from runner_service

Now that generators run server-side, remove them from runner_service.

**Files:**
- Delete: `/Users/johnhuang/projects/testomniac_runner_service/src/analyzer/page-analyzer/generators/` (all 12 files)
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/analyzer/page-analyzer/index.ts` — Remove `generateTestInteractions()` method and generator imports
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/index.ts` — Remove generator-related exports

- [ ] **Step 1: Delete generators directory**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
rm -rf src/analyzer/page-analyzer/generators/
```

- [ ] **Step 2: Remove generateTestInteractions from PageAnalyzer**

In `src/analyzer/page-analyzer/index.ts`, remove:
- The `generateTestInteractions()` method (lines ~424-680)
- All generator imports at the top of the file
- The generator orchestration logic

Keep the PageAnalyzer class and its helper methods that are still used elsewhere (e.g., `ensureTargetPageState` if still called, or remove if no longer needed).

- [ ] **Step 3: Clean up index.ts exports**

In `src/index.ts`, remove any exports related to generators:
- `PageAnalyzer` export (if it was exported)
- `AnalyzerContext` type export (if it was exported)
- Any generator-specific type exports

Keep exports that other parts of the system still use (e.g., `detectLoginPage`, `LoginManager`, extractors, expertise system, etc.).

- [ ] **Step 4: Typecheck and test**

```bash
bun run typecheck && bun test
```

Expected: PASS. If there are compilation errors, some consumer may still reference removed exports — fix those references.

- [ ] **Step 5: Build and commit**

```bash
bun run build
git add -A && git commit -m "refactor: remove generators from runner_service (now in API)"
```

---

## Task 11: Integration verification

**Files:**
- No new files

- [ ] **Step 1: Verify runner_service builds clean**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
bun run verify
```

Expected: typecheck + lint + test + build all PASS

- [ ] **Step 2: Verify testomniac_api builds clean**

```bash
cd /Users/johnhuang/projects/testomniac_api
bun run verify
```

Expected: typecheck + lint + test + build all PASS

- [ ] **Step 3: Verify testomniac_types builds clean**

```bash
cd /Users/johnhuang/projects/testomniac_types
bun run verify
```

Expected: typecheck + lint + test + build all PASS

- [ ] **Step 4: Verify testomniac_runner builds clean**

```bash
cd /Users/johnhuang/projects/testomniac_runner
bun run typecheck
```

Expected: PASS (runner uses runner_service, should work without changes)

- [ ] **Step 5: Verify testomniac_extension builds clean**

```bash
cd /Users/johnhuang/projects/testomniac_extension
bun run type-check
```

Expected: PASS (extension uses runner_service, should work without changes)
