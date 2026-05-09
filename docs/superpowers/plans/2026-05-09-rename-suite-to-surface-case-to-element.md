# Rename "Test Suite" → "Test Surface" and "Test Case" → "Test Element"

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename "Test Suite" to "Test Surface" and "Test Case" to "Test Element" throughout the entire Testomniac project — data model, database, API endpoints, client, runner, and UI.

**Architecture:** Process packages in dependency order (matching `push_all.sh`): types → api → runner_service → client → runner → lib → extension → app. For each package, apply systematic find-and-replace using longest-first ordering to prevent partial matches. Database migration renames tables/columns via ALTER TABLE statements in the API's embedded migration system.

**Tech Stack:** TypeScript, PostgreSQL (Drizzle ORM), React, Bun

---

## Critical Rules

1. **DO NOT rename "UseCase" / "use_case" / "useCaseId"** — these are persona use cases, a completely different concept.
2. **DO NOT rename switch/case statements** or utility functions like `toLowerCase()`.
3. **Replace longest strings first** to avoid partial matches (e.g., `TestSuiteBundleSuiteLinkResponse` before `TestSuite`).
4. **API paths must stay in sync** across `testomniac_api` routes, `testomniac_runner_service` ApiClient, and `testomniac_client` TestomniacClient.
5. **After all packages are modified**, run `push_all.sh` to validate and deploy.

## Rename Mappings

### Suite → Surface (apply in this order — longest first)

| # | Find | Replace |
|---|------|---------|
| 1 | `TestSuiteBundleSuiteLinkResponse` | `TestSurfaceBundleSurfaceLinkResponse` |
| 2 | `TestSuiteBundleSuiteLinkRequest` | `TestSurfaceBundleSurfaceLinkRequest` |
| 3 | `CompleteTestSuiteBundleRunRequest` | `CompleteTestSurfaceBundleRunRequest` |
| 4 | `CreateTestSuiteBundleRunRequest` | `CreateTestSurfaceBundleRunRequest` |
| 5 | `TestSuiteBundleRunResponse` | `TestSurfaceBundleRunResponse` |
| 6 | `UpdateTestSuiteBundleRequest` | `UpdateTestSurfaceBundleRequest` |
| 7 | `CreateTestSuiteBundleRequest` | `CreateTestSurfaceBundleRequest` |
| 8 | `TestSuiteBundleResponse` | `TestSurfaceBundleResponse` |
| 9 | `CompleteTestSuiteRunRequest` | `CompleteTestSurfaceRunRequest` |
| 10 | `CreateTestSuiteRunRequest` | `CreateTestSurfaceRunRequest` |
| 11 | `TestSuiteRunResponse` | `TestSurfaceRunResponse` |
| 12 | `InsertTestSuiteRequest` | `InsertTestSurfaceRequest` |
| 13 | `TestSuiteResponse` | `TestSurfaceResponse` |
| 14 | `testSuiteBundleRunId` | `testSurfaceBundleRunId` |
| 15 | `testSuiteBundleSuites` | `testSurfaceBundleSurfaces` |
| 16 | `testSuiteBundleRuns` | `testSurfaceBundleRuns` |
| 17 | `testSuiteBundleId` | `testSurfaceBundleId` |
| 18 | `TestSuiteBundle` | `TestSurfaceBundle` |
| 19 | `testSuiteRunId` | `testSurfaceRunId` |
| 20 | `testSuiteRuns` | `testSurfaceRuns` |
| 21 | `testSuiteId` | `testSurfaceId` |
| 22 | `testSuites` | `testSurfaces` |
| 23 | `TestSuite` | `TestSurface` |
| 24 | `test_suite_bundle_run_id` | `test_surface_bundle_run_id` |
| 25 | `test_suite_bundle_suites` | `test_surface_bundle_surfaces` |
| 26 | `test_suite_bundle_runs` | `test_surface_bundle_runs` |
| 27 | `test_suite_bundle_id` | `test_surface_bundle_id` |
| 28 | `test_suite_bundles` | `test_surface_bundles` |
| 29 | `test_suite_run_id` | `test_surface_run_id` |
| 30 | `test_suite_runs` | `test_surface_runs` |
| 31 | `test_suite_id` | `test_surface_id` |
| 32 | `test_suites` | `test_surfaces` |
| 33 | `test-suite-bundle-suites` | `test-surface-bundle-surfaces` |
| 34 | `test-suite-bundle-runs` | `test-surface-bundle-runs` |
| 35 | `test-suite-bundles` | `test-surface-bundles` |
| 36 | `test-suite-runs` | `test-surface-runs` |
| 37 | `test-suites` | `test-surfaces` |
| 38 | `test_suite_created` | `test_surface_created` |
| 39 | `test suite created` | `test surface created` |
| 40 | `suite_tags` | `surface_tags` |
| 41 | `suiteTags` | `surfaceTags` |
| 42 | `suiteRuns` | `surfaceRuns` |
| 43 | `suiteTitle` | `surfaceTitle` |
| 44 | `SuiteRun` | `SurfaceRun` |
| 45 | `navigationSuite` | `navigationSurface` |
| 46 | `directNavSuite` | `directNavSurface` |
| 47 | `currentSuiteRun` | `currentSurfaceRun` |
| 48 | `currentSuiteRunId` | `currentSurfaceRunId` |
| 49 | `currentTestSuiteId` | `currentTestSurfaceId` |
| 50 | `openSuiteRuns` | `openSurfaceRuns` |
| 51 | `hasOpenSuites` | `hasOpenSurfaces` |
| 52 | `suiteRunsBySuiteId` | `surfaceRunsBySurfaceId` |
| 53 | `childSuites` | `childSurfaces` |
| 54 | `allSuites` | `allSurfaces` |
| 55 | `newSuite` | `newSurface` |
| 56 | `suiteIds` | `surfaceIds` |
| 57 | `suiteRun` | `surfaceRun` |
| 58 | `suiteId` | `surfaceId` |
| 59 | `suitesCreated` | `surfacesCreated` |
| 60 | `suitesCount` | `surfacesCount` |
| 61 | `bundleRunId` | `bundleRunId` |
| 62 | `ensureBundleSuiteLink` | `ensureBundleSurfaceLink` |
| 63 | `ensureSuiteRun` | `ensureSurfaceRun` |
| 64 | `assignSuiteTags` | `assignSurfaceTags` |
| 65 | `suite-tagger` | `surface-tagger` |
| 66 | `bundle_suites_uidx` | `bundle_surfaces_uidx` |

**UI string replacements (context-sensitive, do manually):**
- `"Suites"` → `"Surfaces"` (sidebar, headings)
- `"Test Suites"` → `"Test Surfaces"` (headings, labels, nav)
- `"Test Suite Bundles"` → `"Test Surface Bundles"`
- `"Suite #"` → `"Surface #"`
- `"Test Suite #"` → `"Test Surface #"`
- `"Empty suite"` → `"Empty surface"`
- `"test suite"` → `"test surface"` (descriptions)
- `"test suites"` → `"test surfaces"` (descriptions)
- `"suite/bundle"` → `"surface/bundle"`
- `"suite or discovery"` → `"surface or discovery"`

### Case → Element (apply in this order — longest first)

**IMPORTANT: Skip any occurrence of "UseCase", "use_case", "useCaseId", "personaUseCases", "UseCaseResponse", "CreateUseCaseRequest", "use-cases", "input-values?useCaseId".**

| # | Find | Replace |
|---|------|---------|
| 1 | `TestScenarioSequenceTestCaseLinkResponse` | `TestScenarioSequenceTestElementLinkResponse` |
| 2 | `TestScenarioSequenceTestCaseLinkRequest` | `TestScenarioSequenceTestElementLinkRequest` |
| 3 | `test_scenario_sequence_test_cases` | `test_scenario_sequence_test_elements` |
| 4 | `test-scenario-sequence-test-cases` | `test-scenario-sequence-test-elements` |
| 5 | `testScenarioSequenceTestCases` | `testScenarioSequenceTestElements` |
| 6 | `TestScenarioSequenceTestCases` | `TestScenarioSequenceTestElements` |
| 7 | `FindTestCaseByActionsRequest` | `FindTestElementByActionsRequest` |
| 8 | `CreateTestCaseActionRequest` | `CreateTestElementActionRequest` |
| 9 | `LegacyInsertTestCaseRequest` | `LegacyInsertTestElementRequest` |
| 10 | `CompleteTestCaseRunRequest` | `CompleteTestElementRunRequest` |
| 11 | `TestCaseActionResponse` | `TestElementActionResponse` |
| 12 | `CreateTestCaseRunRequest` | `CreateTestElementRunRequest` |
| 13 | `InsertTestCaseRequest` | `InsertTestElementRequest` |
| 14 | `TestCaseRunResponse` | `TestElementRunResponse` |
| 15 | `LegacyGeneratedTestCase` | `LegacyGeneratedTestElement` |
| 16 | `TestCaseResponse` | `TestElementResponse` |
| 17 | `GeneratedTestCase` | `GeneratedTestElement` |
| 18 | `PasswordTestCase` | `PasswordTestElement` |
| 19 | `LegacyTestCase` | `LegacyTestElement` |
| 20 | `TestCaseRow` | `TestElementRow` |
| 21 | `dependency_test_case_id` | `dependency_test_element_id` |
| 22 | `dependencyTestCaseId` | `dependencyTestElementId` |
| 23 | `testCaseStepUniqueIdx` | `testElementStepUniqueIdx` |
| 24 | `sequenceCaseUniqueIdx` | `sequenceElementUniqueIdx` |
| 25 | `test_case_actions` | `test_element_actions` |
| 26 | `test_case_run_id` | `test_element_run_id` |
| 27 | `test_case_runs` | `test_element_runs` |
| 28 | `test_case_id` | `test_element_id` |
| 29 | `test-case-runs` | `test-element-runs` |
| 30 | `test-cases` | `test-elements` |
| 31 | `test_cases` | `test_elements` |
| 32 | `testCaseRunId` | `testElementRunId` |
| 33 | `testCaseRunsCount` | `testElementRunsCount` |
| 34 | `testCaseTitle` | `testElementTitle` |
| 35 | `testCaseById` | `testElementById` |
| 36 | `testCaseRun` | `testElementRun` |
| 37 | `testCaseIds` | `testElementIds` |
| 38 | `testCaseId` | `testElementId` |
| 39 | `testCasesRes` | `testElementsRes` |
| 40 | `testCasesCount` | `testElementsCount` |
| 41 | `testCases` | `testElements` |
| 42 | `testCase` | `testElement` |
| 43 | `TestCase` | `TestElement` |
| 44 | `test_case_passed` | `test_element_passed` |
| 45 | `test_case_failed` | `test_element_failed` |
| 46 | `caseRunById` | `elementRunById` |
| 47 | `caseRunError` | `elementRunError` |
| 48 | `caseRunsCount` | `elementRunsCount` |
| 49 | `caseRunIds` | `elementRunIds` |
| 50 | `caseRuns` | `elementRuns` |
| 51 | `caseRunId` | `elementRunId` |
| 52 | `caseRun` | `elementRun` |
| 53 | `caseById` | `elementById` |
| 54 | `caseIds` | `elementIds` |
| 55 | `caseId` | `elementId` |
| 56 | `pendingCases` | `pendingElements` |
| 57 | `passwordCases` | `passwordElements` |
| 58 | `suiteCases` | `surfaceElements` |
| 59 | `currentTestCaseId` | `currentTestElementId` |
| 60 | `test-case-executor` | `test-element-executor` |
| 61 | `tca_test_case_idx` | `tea_test_element_idx` |
| 62 | `test_actions_case_step` | `test_actions_element_step` |
| 63 | `scenario_seq_cases` | `scenario_seq_elements` |
| 64 | `dependencyRunByTestCaseId` | `dependencyRunByTestElementId` |
| 65 | `loadRunCaseContext` | `loadRunElementContext` |

**UI string replacements (context-sensitive, do manually):**
- `"Test Cases"` → `"Test Elements"` (headings, sidebar, labels)
- `"Test Case"` → `"Test Element"` (singular labels)
- `"test cases"` → `"test elements"` (descriptions)
- `"test case"` → `"test element"` (descriptions)
- `"Case Runs"` → `"Element Runs"`
- `"Case run"` → `"Element run"`
- `"case run"` → `"element run"`
- `"case"` → `"element"` (only when used as count suffix for test cases)

**Cross-rename patterns (both Suite→Surface AND Case→Element):**
- `getTestCasesByTestSuite` → `getTestElementsByTestSurface`
- `getTestSuiteTestCases` → `getTestSurfaceTestElements`
- `useTestSuiteTestCases` → `useTestSurfaceTestElements`
- `testSuiteTestCases` → `testSurfaceTestElements` (query key)
- `UseTestSuiteTestCasesConfig` → `UseTestSurfaceTestElementsConfig`
- `"This test suite has no test cases"` → `"This test surface has no test elements"`
- `"test suites, cases, or bundles"` → `"test surfaces, elements, or bundles"`

---

### Task 1: testomniac_types — Rename all type definitions

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Apply Suite → Surface replacements in index.ts**

Apply all Suite→Surface patterns from the mapping table above (rows 1-66) using find-and-replace on `src/index.ts`. Use `replace_all` for each pattern. Apply longest patterns first. Also update comments containing "suite".

- [ ] **Step 2: Apply Case → Element replacements in index.ts**

Apply all Case→Element patterns from the mapping table above (rows 1-64) using find-and-replace on `src/index.ts`. **SKIP** any `UseCase`/`use_case`/`useCaseId` patterns. Apply longest patterns first. Also update comments containing "test case".

- [ ] **Step 3: Apply replacements in index.test.ts**

Apply the same Suite→Surface and Case→Element replacements in `src/index.test.ts`.

- [ ] **Step 4: Verify**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run build
```

- [ ] **Step 5: Check for missed occurrences**

```bash
cd /Users/johnhuang/projects/testomniac_types && grep -rn -i "suite" src/ --include="*.ts" | grep -v node_modules | grep -v "UseCase\|use_case"
grep -rn "TestCase\|testCase\|test_case\|test-case" src/ --include="*.ts" | grep -v node_modules | grep -v "UseCase\|use_case\|useCaseId\|use-cases"
```

Fix any remaining occurrences.

- [ ] **Step 6: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_types
git add -A && git commit -m "refactor: rename TestSuite→TestSurface, TestCase→TestElement in types"
```

---

### Task 2: testomniac_api — Database migration

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/index.ts` (add migration at end)

- [ ] **Step 1: Add migration SQL to index.ts**

Add a new migration block at the end of the migrations in `src/db/index.ts`. The migration should rename all tables and columns:

```sql
-- Rename tables: Suite → Surface
ALTER TABLE testomniac.test_suites RENAME TO test_surfaces;
ALTER TABLE testomniac.test_suite_bundles RENAME TO test_surface_bundles;
ALTER TABLE testomniac.test_suite_runs RENAME TO test_surface_runs;
ALTER TABLE testomniac.test_suite_bundle_runs RENAME TO test_surface_bundle_runs;
ALTER TABLE testomniac.test_suite_bundle_suites RENAME TO test_surface_bundle_surfaces;

-- Rename tables: Case → Element
ALTER TABLE testomniac.test_cases RENAME TO test_elements;
ALTER TABLE testomniac.test_case_runs RENAME TO test_element_runs;
ALTER TABLE testomniac.test_scenario_sequence_test_cases RENAME TO test_scenario_sequence_test_elements;

-- Rename columns in test_surfaces (was test_suites)
ALTER TABLE testomniac.test_surfaces RENAME COLUMN suite_tags TO surface_tags;

-- Rename columns in test_elements (was test_cases)
ALTER TABLE testomniac.test_elements RENAME COLUMN test_suite_id TO test_surface_id;
ALTER TABLE testomniac.test_elements RENAME COLUMN suite_tags TO surface_tags;
ALTER TABLE testomniac.test_elements RENAME COLUMN dependency_test_case_id TO dependency_test_element_id;

-- Rename columns in test_surface_bundle_surfaces (was test_suite_bundle_suites)
ALTER TABLE testomniac.test_surface_bundle_surfaces RENAME COLUMN test_suite_bundle_id TO test_surface_bundle_id;
ALTER TABLE testomniac.test_surface_bundle_surfaces RENAME COLUMN test_suite_id TO test_surface_id;

-- Rename columns in test_surface_bundle_runs (was test_suite_bundle_runs)
ALTER TABLE testomniac.test_surface_bundle_runs RENAME COLUMN test_suite_bundle_id TO test_surface_bundle_id;

-- Rename columns in test_surface_runs (was test_suite_runs)
ALTER TABLE testomniac.test_surface_runs RENAME COLUMN test_suite_id TO test_surface_id;
ALTER TABLE testomniac.test_surface_runs RENAME COLUMN test_suite_bundle_run_id TO test_surface_bundle_run_id;

-- Rename columns in test_element_runs (was test_case_runs)
ALTER TABLE testomniac.test_element_runs RENAME COLUMN test_suite_run_id TO test_surface_run_id;
ALTER TABLE testomniac.test_element_runs RENAME COLUMN test_case_id TO test_element_id;

-- Rename columns in test_runs
ALTER TABLE testomniac.test_runs RENAME COLUMN test_suite_run_id TO test_surface_run_id;
ALTER TABLE testomniac.test_runs RENAME COLUMN test_suite_bundle_run_id TO test_surface_bundle_run_id;
ALTER TABLE testomniac.test_runs RENAME COLUMN test_case_run_id TO test_element_run_id;

-- Rename columns in test_run_findings
ALTER TABLE testomniac.test_run_findings RENAME COLUMN test_case_run_id TO test_element_run_id;

-- Rename columns in issues (if exists)
ALTER TABLE testomniac.issues RENAME COLUMN test_case_id TO test_element_id;
ALTER TABLE testomniac.issues RENAME COLUMN test_case_run_id TO test_element_run_id;

-- Rename columns in test_actions
ALTER TABLE testomniac.test_actions RENAME COLUMN test_case_id TO test_element_id;

-- Rename columns in test_schedules
ALTER TABLE testomniac.test_schedules RENAME COLUMN test_suite_id TO test_surface_id;
ALTER TABLE testomniac.test_schedules RENAME COLUMN test_suite_bundle_id TO test_surface_bundle_id;
ALTER TABLE testomniac.test_schedules RENAME COLUMN test_case_id TO test_element_id;

-- Rename columns in test_activities
ALTER TABLE testomniac.test_activities RENAME COLUMN test_suite_id TO test_surface_id;

-- Rename columns in test_scenario_sequence_test_elements (was test_scenario_sequence_test_cases)
ALTER TABLE testomniac.test_scenario_sequence_test_elements RENAME COLUMN test_case_id TO test_element_id;

-- Rename columns in page_views (if test_case_id exists)
-- (Check if this column exists before running)
```

Follow the existing migration pattern in `index.ts`. Wrap in a migration version check.

- [ ] **Step 2: Verify migration SQL syntax**

Review the migration carefully. Check that all referenced columns actually exist by cross-referencing with the schema audit.

- [ ] **Step 3: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_api
git add src/db/index.ts && git commit -m "feat: add migration to rename suite→surface, case→element tables and columns"
```

---

### Task 3: testomniac_api — Drizzle schema, routes, and code

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/schema.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/schema.test.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/index.ts` (existing migration SQL strings — leave old migration SQL as-is, only update Drizzle schema references)
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/scanner.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/scan.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/runs-read.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/detail-read.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/apps-read.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/projects.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/personas-read.ts` (only if it has test-case refs)

- [ ] **Step 1: Apply Suite → Surface replacements in schema.ts**

Apply all Suite→Surface patterns on `src/db/schema.ts`. This renames Drizzle table definitions, column names, and comments. **IMPORTANT:** The Drizzle table names map to the DB table names — make sure the pgTable string argument matches the new table name (e.g., `"test_surfaces"` instead of `"test_suites"`).

- [ ] **Step 2: Apply Case → Element replacements in schema.ts**

Apply all Case→Element patterns on `src/db/schema.ts`. **Skip UseCase/use_case patterns.**

- [ ] **Step 3: Apply replacements in schema.test.ts**

Apply same patterns on `src/db/schema.test.ts`.

- [ ] **Step 4: Apply replacements in all route files**

Apply Suite→Surface and Case→Element patterns on all route files: `scanner.ts`, `scan.ts`, `runs-read.ts`, `detail-read.ts`, `apps-read.ts`, `index.ts`, `projects.ts`. This changes:
- Route path strings (e.g., `"/test-suites"` → `"/test-surfaces"`)
- Imported type names
- Variable names
- Error message strings
- Comment text

- [ ] **Step 5: Update existing migration SQL references in index.ts**

In `src/db/index.ts`, the old migration SQL strings reference old table/column names. **Leave old migration SQL as-is** (they ran against the old schema). Only update:
- Drizzle schema imports at the top of the file (if any)
- Any non-migration code that references the schema

- [ ] **Step 6: Verify**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run type-check && bun run build
```

- [ ] **Step 7: Check for missed occurrences**

```bash
cd /Users/johnhuang/projects/testomniac_api
grep -rn "TestSuite\|testSuite\|test_suite\|test-suite\|suite_tags\|suiteTags" src/ --include="*.ts" | grep -v node_modules | grep -v "index.ts.*sql\|index.ts.*migration\|index.ts.*ALTER\|index.ts.*CREATE\|index.ts.*INSERT"
grep -rn "TestCase\|testCase\|test_case\|test-case" src/ --include="*.ts" | grep -v node_modules | grep -v "UseCase\|use_case\|useCaseId\|use-cases\|index.ts.*sql\|index.ts.*migration\|index.ts.*ALTER\|index.ts.*CREATE\|index.ts.*INSERT\|switch\|toLowerCase"
```

Fix any remaining occurrences (excluding old migration SQL).

- [ ] **Step 8: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_api
git add -A && git commit -m "refactor: rename suite→surface, case→element in schema and routes"
```

---

### Task 4: testomniac_runner_service — Core runner logic

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/api/client.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/runner.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/test-case-executor.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/analyzer/page-analyzer.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/domain/types.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/suite-tagger.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/render.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/password.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/e2e.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/form.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/form-negative.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/interaction.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/navigation.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/generator.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/expertise/tester-expertise.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/detectors/action-description.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/planners/fill-value-planner.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/index.ts`
- Modify: any test files containing "suite" or "case"
- Rename: `src/generation/suite-tagger.ts` → `src/generation/surface-tagger.ts`
- Rename: `src/orchestrator/test-case-executor.ts` → `src/orchestrator/test-element-executor.ts`

- [ ] **Step 1: Apply Suite → Surface replacements across all source files**

Apply all Suite→Surface patterns from the mapping table. Key files: `client.ts` (16 API methods + 15 path strings), `runner.ts` (execution loop), `page-analyzer.ts` (test generation), `suite-tagger.ts` (function name).

- [ ] **Step 2: Apply Case → Element replacements across all source files**

Apply all Case→Element patterns. Key files: `client.ts` (9 API methods + 7 path strings), `test-case-executor.ts` (entire file), `page-analyzer.ts` (test case generation methods). **Skip UseCase/use_case patterns.**

- [ ] **Step 3: Rename files**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git mv src/generation/suite-tagger.ts src/generation/surface-tagger.ts
git mv src/orchestrator/test-case-executor.ts src/orchestrator/test-element-executor.ts
```

- [ ] **Step 4: Update imports referencing renamed files**

Update all import paths that reference the old file names:
- `./suite-tagger` → `./surface-tagger`
- `./test-case-executor` → `./test-element-executor`

- [ ] **Step 5: Verify**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && bun run type-check && bun run build
```

- [ ] **Step 6: Check for missed occurrences and fix**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
grep -rn "suite\|Suite" src/ --include="*.ts" | grep -v node_modules | grep -v "UseCase\|use_case"
grep -rn "TestCase\|testCase\|test_case\|test-case\|caseRun\|caseId" src/ --include="*.ts" | grep -v node_modules | grep -v "UseCase\|use_case\|useCaseId\|use-cases"
```

- [ ] **Step 7: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add -A && git commit -m "refactor: rename suite→surface, case→element in runner service"
```

---

### Task 5: testomniac_client — API client and React Query hooks

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_client/src/network/TestomniacClient.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/types.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/useTestSuiteChildSuites.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/useRunnerTestSuites.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/useTestSuiteTestCases.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/useRunTestCases.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/useRunnerTestCases.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/useTestCaseActions.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/useTestCaseRun.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/useTestScenarioSequenceTestCases.ts`
- Modify: `/Users/johnhuang/projects/testomniac_client/src/hooks/index.ts` (hook re-exports)
- Modify: `/Users/johnhuang/projects/testomniac_client/src/index.ts`
- Rename hook files (see below)

- [ ] **Step 1: Apply Suite → Surface replacements**

Apply all Suite→Surface patterns across all files. Key changes in `TestomniacClient.ts`:
- Method: `getRunnerTestSuites` → `getRunnerTestSurfaces`
- Method: `getTestSuiteTestCases` → `getTestSurfaceTestElements`
- URL: `/test-suites/` → `/test-surfaces/`

Key changes in `types.ts`:
- Query keys: `runnerTestSuites`, `testSuiteChildSuites`, `testSuiteTestCases`
- Properties: `testSuiteBundleId`, `suites`, `suiteTags`, `suiteRuns`

- [ ] **Step 2: Apply Case → Element replacements**

Apply all Case→Element patterns. **Skip UseCase/use_case/useCaseId patterns.** Key changes:
- Methods: `getRunTestCases` → `getRunTestElements`, etc.
- URLs: `/test-cases/` → `/test-elements/`, `/test-case-runs/` → `/test-element-runs/`
- Query keys: `runTestCases` → `runTestElements`, etc.
- Properties: `testCasesCount`, `testCaseRunId`, `caseRuns`, etc.

- [ ] **Step 3: Rename hook files**

```bash
cd /Users/johnhuang/projects/testomniac_client
git mv src/hooks/useTestSuiteChildSuites.ts src/hooks/useTestSurfaceChildSurfaces.ts
git mv src/hooks/useRunnerTestSuites.ts src/hooks/useRunnerTestSurfaces.ts
git mv src/hooks/useTestSuiteTestCases.ts src/hooks/useTestSurfaceTestElements.ts
git mv src/hooks/useRunTestCases.ts src/hooks/useRunTestElements.ts
git mv src/hooks/useRunnerTestCases.ts src/hooks/useRunnerTestElements.ts
git mv src/hooks/useTestCaseActions.ts src/hooks/useTestElementActions.ts
git mv src/hooks/useTestCaseRun.ts src/hooks/useTestElementRun.ts
git mv src/hooks/useTestScenarioSequenceTestCases.ts src/hooks/useTestScenarioSequenceTestElements.ts
```

- [ ] **Step 4: Update imports in hooks/index.ts and src/index.ts**

Update all re-export paths to reference renamed files.

- [ ] **Step 5: Verify**

```bash
cd /Users/johnhuang/projects/testomniac_client && bun run type-check && bun run build
```

- [ ] **Step 6: Check for missed occurrences and fix**

- [ ] **Step 7: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_client
git add -A && git commit -m "refactor: rename suite→surface, case→element in client"
```

---

### Task 6: testomniac_runner — Standalone runner

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner/src/orchestrator.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner/src/runner/worker-pool.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner/src/runner/executor.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner/src/auth/password-detector.ts`

- [ ] **Step 1: Apply Suite → Surface replacements**

Key changes: `onTestSuiteCreated` → `onTestSurfaceCreated`, `suiteId` → `surfaceId`, `"test suite created"` → `"test surface created"`.

- [ ] **Step 2: Apply Case → Element replacements**

Key changes: `testCaseId` → `testElementId`, `testCaseRun` → `testElementRun`, `executeTestCase` → `executeTestElement`, `PasswordTestCase` → `PasswordTestElement`, `onTestCaseRunCompleted` → `onTestElementRunCompleted`.

- [ ] **Step 3: Verify**

```bash
cd /Users/johnhuang/projects/testomniac_runner && bun run type-check && bun run build
```

- [ ] **Step 4: Check for missed occurrences and fix**

- [ ] **Step 5: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner
git add -A && git commit -m "refactor: rename suite→surface, case→element in runner"
```

---

### Task 7: testomniac_lib — Business logic hooks

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_lib/src/business/stores/scanProgressStore.ts`
- Modify: `/Users/johnhuang/projects/testomniac_lib/src/business/hooks/useScanManager.ts`
- Modify: `/Users/johnhuang/projects/testomniac_lib/src/business/hooks/useRunManager.ts`

- [ ] **Step 1: Apply Suite → Surface replacements**

Key changes: `suitesCreated` → `surfacesCreated`, `'test_suite_created'` → `'test_surface_created'`.

- [ ] **Step 2: Apply Case → Element replacements**

Key changes in `useRunManager.ts`: `testCases` → `testElements`, `testCasesRes` → `testElementsRes`, `getRunTestCases` → `getRunTestElements`, `TestCaseResponse` → `TestElementResponse`.

- [ ] **Step 3: Verify**

```bash
cd /Users/johnhuang/projects/testomniac_lib && bun run type-check && bun run build
```

- [ ] **Step 4: Check for missed occurrences and fix**

- [ ] **Step 5: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_lib
git add -A && git commit -m "refactor: rename suite→surface, case→element in lib"
```

---

### Task 8: testomniac_extension — Chrome extension

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_extension/src/background/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_extension/src/sidepanel/SidePanel.tsx`

- [ ] **Step 1: Apply Suite → Surface replacements**

Key changes in `background/index.ts`: `onTestSuiteCreated` → `onTestSurfaceCreated`, `'test_suite_created'` → `'test_surface_created'`.

Key changes in `SidePanel.tsx`: `testSuiteBundleId` → `testSurfaceBundleId`, `suites` → `surfaces`, `suiteTags` → `surfaceTags`, `suiteRuns` → `surfaceRuns`, `suite.id` → `surface.id`, `suite.title` → `surface.title`, etc.

- [ ] **Step 2: Apply Case → Element replacements**

Key changes in `background/index.ts`: `onTestCaseRunCompleted` → `onTestElementRunCompleted`, `'test_case_passed'` → `'test_element_passed'`, `'test_case_failed'` → `'test_element_failed'`.

Key changes in `SidePanel.tsx`: `testCases` → `testElements`, `dependencyTestCaseId` → `dependencyTestElementId`, `caseRuns` → `elementRuns`, `caseRun` → `elementRun`.

- [ ] **Step 3: Update UI strings in SidePanel.tsx**

Change user-visible text: `"case"` count suffix → `"element"`, etc.

- [ ] **Step 4: Verify**

```bash
cd /Users/johnhuang/projects/testomniac_extension && bun run type-check && bun run build
```

- [ ] **Step 5: Check for missed occurrences and fix**

- [ ] **Step 6: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_extension
git add -A && git commit -m "refactor: rename suite→surface, case→element in extension"
```

---

### Task 9: testomniac_app — Web application

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_app/src/App.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/components/dashboard/DashboardSidebar.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/TestSuitesListPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/TestSuiteDetailPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/TestCasesPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/TestCaseDetailPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/TestRunDetailPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/TestRunsPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/RunDetailsPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/PageDetailPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/PagesPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/BundlesPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/SchedulesPage.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/DashboardOverview.tsx`
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/RunnerConsolePage.tsx`
- Rename: `TestSuitesListPage.tsx` → `TestSurfacesListPage.tsx`
- Rename: `TestSuiteDetailPage.tsx` → `TestSurfaceDetailPage.tsx`
- Rename: `TestCasesPage.tsx` → `TestElementsPage.tsx`
- Rename: `TestCaseDetailPage.tsx` → `TestElementDetailPage.tsx`

- [ ] **Step 1: Apply Suite → Surface replacements across all files**

Apply all Suite→Surface patterns. Key changes:
- Route paths: `test-suites` → `test-surfaces`
- Component names: `TestSuitesListPage` → `TestSurfacesListPage`, `TestSuiteDetailPage` → `TestSurfaceDetailPage`
- Hook imports: `useRunnerTestSuites` → `useRunnerTestSurfaces`, `useTestSuiteTestCases` → `useTestSurfaceTestElements`
- Variables: `suiteId`, `testSuites`, `suite.*`

- [ ] **Step 2: Apply Case → Element replacements across all files**

Apply all Case→Element patterns. Key changes:
- Route paths: `test-cases` → `test-elements`
- Component names: `TestCasesPage` → `TestElementsPage`, `TestCaseDetailPage` → `TestElementDetailPage`
- Hook imports: `useRunnerTestCases` → `useRunnerTestElements`, etc.
- Variables: `testCases`, `caseId`, `testCaseRunId`, etc.

- [ ] **Step 3: Update all UI strings**

Carefully update user-visible text:
- Sidebar: `'Suites'` → `'Surfaces'`, `'Cases'` → `'Elements'`
- Headings: `'Test Suites'` → `'Test Surfaces'`, `'Test Cases'` → `'Test Elements'`
- Descriptions, empty states, loading messages
- Breadcrumbs

- [ ] **Step 4: Rename page files**

```bash
cd /Users/johnhuang/projects/testomniac_app
git mv src/pages/TestSuitesListPage.tsx src/pages/TestSurfacesListPage.tsx
git mv src/pages/TestSuiteDetailPage.tsx src/pages/TestSurfaceDetailPage.tsx
git mv src/pages/TestCasesPage.tsx src/pages/TestElementsPage.tsx
git mv src/pages/TestCaseDetailPage.tsx src/pages/TestElementDetailPage.tsx
```

- [ ] **Step 5: Update imports in App.tsx referencing renamed files**

Update the lazy import paths:
- `./pages/TestSuitesListPage` → `./pages/TestSurfacesListPage`
- `./pages/TestSuiteDetailPage` → `./pages/TestSurfaceDetailPage`
- `./pages/TestCasesPage` → `./pages/TestElementsPage`
- `./pages/TestCaseDetailPage` → `./pages/TestElementDetailPage`

- [ ] **Step 6: Verify**

```bash
cd /Users/johnhuang/projects/testomniac_app && bun run type-check && bun run build
```

- [ ] **Step 7: Check for missed occurrences and fix**

```bash
cd /Users/johnhuang/projects/testomniac_app
grep -rn "suite\|Suite" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
grep -rn "TestCase\|testCase\|test-case\|\"Case" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "UseCase\|use_case\|useCaseId"
```

- [ ] **Step 8: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_app
git add -A && git commit -m "refactor: rename suite→surface, case→element in app UI"
```

---

### Task 10: Update CLAUDE.md files

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_extension/CLAUDE.md`
- Modify: any other CLAUDE.md files in the affected packages

- [ ] **Step 1: Update CLAUDE.md references**

Replace "test suite" → "test surface", "test case" → "test element", "suite" → "surface", "case" → "element" in documentation text.

- [ ] **Step 2: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_extension
git add CLAUDE.md && git commit -m "docs: update terminology suite→surface, case→element"
```

---

### Task 11: Deploy with push_all.sh

- [ ] **Step 1: Run push_all.sh**

```bash
cd /Users/johnhuang/projects/testomniac_app
./scripts/push_all.sh --continue-on-error
```

This will process all packages in dependency order: types (wait 60s) → api → runner_service → client (wait 60s) → runner → lib (wait 60s) → extension → app → app_rn.

For each package it will: update @sudobility deps → typecheck → lint → test → build → bump version → commit → push.

- [ ] **Step 2: Fix any failures**

If push_all.sh reports failures:
1. Read the error output to identify which package and what failed (typecheck, lint, test, or build)
2. Fix the issue in the failing package
3. Re-run push_all.sh with `--starting-project <failed-package-name>` to resume from the failure point

Common issues to expect:
- Missed rename causing type errors
- Import path not updated after file rename
- Lint errors from unused imports (old names)
- Test failures from hardcoded strings

- [ ] **Step 3: Verify all packages deployed**

Check that push_all.sh completed with "All Projects Processed Successfully!"
