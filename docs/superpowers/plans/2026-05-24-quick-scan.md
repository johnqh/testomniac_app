# Quick Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `quickScan` option to discovery runs that skips hover-type interaction execution on elements that already have a navigation interaction, speeding up discovery.

**Architecture:** A boolean `quickScan` field flows from UI → API request → testRun DB record → runner RunConfig. The runner's interaction selection logic checks this flag and skips hover interactions where a navigation interaction already exists for the same element.

**Tech Stack:** TypeScript, Drizzle ORM (API), React (app + extension), Playwright-based runner service

---

### Task 1: Add `quickScan` to shared types

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts:750` (CreateDiscoveryRunRequest)
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts:1508` (TestRunResponse)

- [ ] **Step 1: Add `quickScan` to `CreateDiscoveryRunRequest`**

In `/Users/johnhuang/projects/testomniac_types/src/index.ts`, add after the `continueWithLogin?: boolean;` line:

```typescript
  quickScan?: boolean;
```

- [ ] **Step 2: Add `quickScan` to `TestRunResponse`**

In the same file, in the `TestRunResponse` interface, add after `loginUrl: string | null;`:

```typescript
  quickScan: boolean;
```

- [ ] **Step 3: Build types package**

Run:
```bash
cd /Users/johnhuang/projects/testomniac_types && bun run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_types
git add src/index.ts
git commit -m "feat: add quickScan field to CreateDiscoveryRunRequest and TestRunResponse"
```

---

### Task 2: Add `quickScan` column to database schema

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/schema.ts:655`

- [ ] **Step 1: Add column to testRuns table**

In `/Users/johnhuang/projects/testomniac_api/src/db/schema.ts`, add after the `loginUrl: text("login_url"),` line:

```typescript
  quickScan: boolean("quick_scan").notNull().default(false),
```

- [ ] **Step 2: Generate migration**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run db:generate
```

Expected: A new migration file is generated in the migrations folder.

- [ ] **Step 3: Run migration**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run db:migrate
```

Expected: Migration applies successfully.

- [ ] **Step 4: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_api
git add src/db/schema.ts drizzle/
git commit -m "feat: add quick_scan column to test_runs table"
```

---

### Task 3: Pass `quickScan` through API scan endpoint

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/scan.ts:570`

- [ ] **Step 1: Add quickScan to the testRun insert**

In `/Users/johnhuang/projects/testomniac_api/src/routes/scan.ts`, in the `db.insert(testRuns).values({...})` block, add after `loginUrl: body.loginUrl ?? null,`:

```typescript
        quickScan: body.quickScan ?? false,
```

- [ ] **Step 2: Verify the API builds**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_api
git add src/routes/scan.ts
git commit -m "feat: persist quickScan flag when creating discovery run"
```

---

### Task 4: Add `quickScan` to runner service RunConfig

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/types.ts:19`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/runner.ts`

- [ ] **Step 1: Add `quickScan` to RunConfig interface**

In `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/types.ts`, add after `credentials?: Credentials;`:

```typescript
  quickScan?: boolean;
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && bun run build
```

Expected: Build succeeds (no consumers of the new field yet).

- [ ] **Step 3: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add src/orchestrator/types.ts
git commit -m "feat: add quickScan to RunConfig interface"
```

---

### Task 5: Populate `quickScan` in RunConfig from testRun

**Files:**
- Modify: The file that constructs RunConfig and calls `runTestRun()` (in testomniac_runner or testomniac_runner_service orchestrator entry point)

- [ ] **Step 1: Find where RunConfig is constructed**

Search for where `runTestRun` is called and RunConfig is assembled. This is where the testRun response fields get mapped to RunConfig properties.

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && grep -rn "runTestRun\|RunConfig" src/ --include="*.ts" | grep -v "node_modules"
```

- [ ] **Step 2: Pass `quickScan` from testRun to RunConfig**

Where the RunConfig object is constructed (likely reading from the testRun API response), add:

```typescript
quickScan: testRun.quickScan ?? false,
```

alongside the existing `scanScopePath: testRun.scanScopePath ?? undefined,` line.

- [ ] **Step 3: Verify build**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && bun run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add -A
git commit -m "feat: populate quickScan in RunConfig from testRun"
```

---

### Task 6: Implement skip logic in runner interaction selection

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/runner.ts`

- [ ] **Step 1: Add helper to check if navigation interaction exists for same element**

After the existing `isHoverInteraction()` function (line ~687), add:

```typescript
function hasNavigationInteractionForSameElement(
  hoverInteraction: TestInteractionResponse,
  allInteractions: TestInteractionResponse[]
): boolean {
  // A navigation interaction exists for the same element if:
  // 1. It has testType "navigation"
  // 2. It shares the same testSurfaceId
  // 3. It targets the same page (pageId matches)
  return allInteractions.some(
    (other) =>
      other.id !== hoverInteraction.id &&
      other.testType === "navigation" &&
      other.testSurfaceId === hoverInteraction.testSurfaceId &&
      other.pageId === hoverInteraction.pageId
  );
}
```

- [ ] **Step 2: Add skip logic in the main execution loop**

In the main while loop (around line 393-426), after an interaction run is selected but before `executeTestInteraction()` is called, add a check:

```typescript
// Quick scan: skip hover interactions where a navigation interaction exists for the same element
const selectedInteraction = testInteractionById.get(selected.testInteractionId);
if (
  config.quickScan &&
  isHoverInteraction(selectedInteraction) &&
  hasNavigationInteractionForSameElement(selectedInteraction!, testInteractions)
) {
  logRunner("quick-scan:skipping-hover", {
    testInteractionRunId: selected.id,
    testInteractionId: selected.testInteractionId,
    title: selectedInteraction?.title,
  });
  // Mark the run as skipped
  await apiClient.updateTestInteractionRun(selected.id, { status: "skipped" });
  continue;
}
```

Note: Verify how the runner marks skipped runs. If there's no "skipped" status, use the existing pattern for completing runs without execution. Check the existing status values and use the appropriate one.

- [ ] **Step 3: Verify build**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && bun run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add src/orchestrator/runner.ts
git commit -m "feat: skip hover interactions on linked elements during quick scan"
```

---

### Task 7: Add quickScan checkbox to web app StartScanPage

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_app/src/pages/StartScanPage.tsx`

- [ ] **Step 1: Add state variable**

After `const [scanScopePath, setScanScopePath] = useState('');` (line 31), add:

```typescript
const [quickScan, setQuickScan] = useState(false);
```

- [ ] **Step 2: Pass quickScan in submitScan call**

In the `handleSubmit` function, add `quickScan` to the submitScan call object. After `...(continueWithLogin ? {...} : {}),` add:

```typescript
        ...(quickScan ? { quickScan: true } : {}),
```

- [ ] **Step 3: Add checkbox UI**

In the Options section, after the "Scope Path" div (after line 145) and before the "Login Credential Option" div, add:

```tsx
            {/* Quick Scan */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quickScan}
                  onChange={e => setQuickScan(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Quick scan
                </span>
              </label>
              <p className="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
                Skip hover interactions on linked elements for faster discovery
              </p>
            </div>
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/johnhuang/projects/testomniac_app && bun run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_app
git add src/pages/StartScanPage.tsx
git commit -m "feat: add quick scan checkbox to StartScanPage"
```

---

### Task 8: Add quickScan checkbox to extension SidePanel

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_extension/src/sidepanel/SidePanel.tsx`

- [ ] **Step 1: Add state variable**

Near the other scan option state variables (around line 460, near `continueWithLogin` state), add:

```typescript
const [quickScanEnabled, setQuickScanEnabled] = useState(false);
```

- [ ] **Step 2: Add `quickScan` to scanBody**

In the scanBody construction (around line 869, after `environmentKind,`), add:

```typescript
        ...(quickScanEnabled ? { quickScan: true } : {}),
```

- [ ] **Step 3: Add checkbox UI**

After the Expertises div closes (around line 1540) and before the "Continue with login" div, add:

```tsx
              {/* Quick Scan */}
              <div>
                <label className='flex items-center gap-2 text-[11px] font-medium text-gray-700 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={quickScanEnabled}
                    onChange={e => setQuickScanEnabled(e.target.checked)}
                  />
                  Quick scan
                </label>
                <p className='ml-5 text-[10px] text-gray-500'>
                  Skip hover interactions on linked elements
                </p>
              </div>
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/johnhuang/projects/testomniac_extension && bun run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_extension
git add src/sidepanel/SidePanel.tsx
git commit -m "feat: add quick scan checkbox to extension side panel"
```

---

### Task 9: Update testomniac_runner to pass quickScan

**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner/src/orchestrator.ts` (or wherever RunOptions/RunConfig is constructed before calling runner-service)

- [ ] **Step 1: Find where the runner passes config to runner-service**

```bash
cd /Users/johnhuang/projects/testomniac_runner && grep -rn "scanScopePath\|RunConfig\|runFullScan\|runTestRun" src/ --include="*.ts"
```

- [ ] **Step 2: Pass quickScan from testRun to the run options**

In the same location where `scanScopePath` is read from the testRun and passed along, add:

```typescript
quickScan: testRun.quickScan ?? false,
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/johnhuang/projects/testomniac_runner && bun run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner
git add -A
git commit -m "feat: pass quickScan from testRun to runner-service"
```

---

### Task 10: End-to-end verification

- [ ] **Step 1: Update testomniac_types in all consumer packages**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun install
cd /Users/johnhuang/projects/testomniac_runner_service && bun install
cd /Users/johnhuang/projects/testomniac_runner && bun install
cd /Users/johnhuang/projects/testomniac_app && bun install
cd /Users/johnhuang/projects/testomniac_extension && bun install
```

- [ ] **Step 2: Build all packages**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run build
cd /Users/johnhuang/projects/testomniac_api && bun run build
cd /Users/johnhuang/projects/testomniac_runner_service && bun run build
cd /Users/johnhuang/projects/testomniac_runner && bun run build
cd /Users/johnhuang/projects/testomniac_app && bun run build
cd /Users/johnhuang/projects/testomniac_extension && bun run build
```

Expected: All builds succeed.

- [ ] **Step 3: Manual test**

1. Start API and web app locally
2. Navigate to Start Scan page, verify "Quick scan" checkbox appears
3. Check the checkbox and submit a scan
4. Verify in DB that the testRun record has `quick_scan = true`
5. Start the runner and verify it picks up the run with quickScan enabled
6. Confirm hover interactions on linked elements are skipped in runner logs
