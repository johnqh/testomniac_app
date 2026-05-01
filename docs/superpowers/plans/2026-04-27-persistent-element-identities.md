# Persistent Element Identities with Playwright Locators

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent, app-level element identities that survive across scans and generate Playwright-compatible locator strings for test export.

**Architecture:** Each scanned element gets matched to (or creates) an `ElementIdentity` — a persistent record keyed by semantic signals (role, computed name, label, group). The identity stores a Playwright locator string (e.g., `getByRole('button', { name: 'Submit' })`). During scanning, new elements are matched against existing identities using a multi-signal scoring algorithm. Test cases reference element identities instead of brittle CSS selectors.

**Tech Stack:** TypeScript, Drizzle ORM (PostgreSQL), Vitest, Bun

---

## File Map

### testomniac_types (`/Users/johnhuang/projects/testomniac_types`)
- **Modify:** `src/index.ts` — Add `ElementIdentity`, `ElementLocator`, `LocatorStrategy`, `PlaywrightRole`, request/response types, `resolvePlaywrightRole()`
- **Modify:** `src/index.test.ts` — Tests for new types and `resolvePlaywrightRole()`

### testomniac_api (`/Users/johnhuang/projects/testomniac_api`)
- **Modify:** `src/db/schema.ts` — Add `elementIdentities` table, add `elementIdentityId` FK to `actionableItems`
- **Modify:** `src/db/schema.test.ts` — Schema tests for new table
- **Modify:** `src/routes/scanner.ts` — CRUD endpoints for element identities
- **Modify:** `src/routes/runs-read.ts` — User-facing read endpoint
- **Modify:** `src/routes/index.ts` — (only if new router file needed; likely not)

### testomniac_runner_service (`/Users/johnhuang/projects/testomniac_runner_service`)
- **Modify:** `src/browser/dom-snapshot.ts` — Extract identity signals (groupName, headingContext, landmarkAncestor, testId, formContext)
- **Modify:** `src/extractors/types.ts` — Add new fields to `DomSnapshotEntry`
- **Create:** `src/identity/playwright-locator.ts` — Playwright locator generator
- **Create:** `src/identity/playwright-locator.test.ts` — Tests
- **Create:** `src/identity/element-matcher.ts` — Multi-signal matching algorithm
- **Create:** `src/identity/element-matcher.test.ts` — Tests
- **Create:** `src/identity/identity-cache.ts` — Preloaded cache of existing identities per app
- **Modify:** `src/api/client.ts` — API client methods for element identities
- **Modify:** `src/orchestrator/mouse-scanning.ts` — Integrate identity matching into scan loop
- **Modify:** `src/generation/render.ts` — Use Playwright locators in generated tests
- **Create:** `src/generation/playwright-export.ts` — Export test cases as Playwright scripts
- **Create:** `src/generation/playwright-export.test.ts` — Tests

---

## Task 1: Types — Core Interfaces and Playwright Role Resolver

**Repo:** `testomniac_types`
**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Write failing tests for `resolvePlaywrightRole`**

In `src/index.test.ts`, add at the end:

```typescript
describe("resolvePlaywrightRole", () => {
  it("returns explicit ARIA role when provided", () => {
    expect(resolvePlaywrightRole("DIV", undefined, "button")).toBe("button");
  });

  it("maps <button> to button", () => {
    expect(resolvePlaywrightRole("BUTTON")).toBe("button");
  });

  it("maps <a> to link", () => {
    expect(resolvePlaywrightRole("A")).toBe("link");
  });

  it("maps <input type=text> to textbox", () => {
    expect(resolvePlaywrightRole("INPUT", "text")).toBe("textbox");
  });

  it("maps <input type=email> to textbox", () => {
    expect(resolvePlaywrightRole("INPUT", "email")).toBe("textbox");
  });

  it("maps <input type=checkbox> to checkbox", () => {
    expect(resolvePlaywrightRole("INPUT", "checkbox")).toBe("checkbox");
  });

  it("maps <input type=radio> to radio", () => {
    expect(resolvePlaywrightRole("INPUT", "radio")).toBe("radio");
  });

  it("maps <input type=number> to spinbutton", () => {
    expect(resolvePlaywrightRole("INPUT", "number")).toBe("spinbutton");
  });

  it("maps <select> to combobox", () => {
    expect(resolvePlaywrightRole("SELECT")).toBe("combobox");
  });

  it("maps <textarea> to textbox", () => {
    expect(resolvePlaywrightRole("TEXTAREA")).toBe("textbox");
  });

  it("maps <h1>-<h6> to heading", () => {
    expect(resolvePlaywrightRole("H1")).toBe("heading");
    expect(resolvePlaywrightRole("H3")).toBe("heading");
  });

  it("maps <nav> to navigation", () => {
    expect(resolvePlaywrightRole("NAV")).toBe("navigation");
  });

  it("returns generic for unknown tags", () => {
    expect(resolvePlaywrightRole("DIV")).toBe("generic");
    expect(resolvePlaywrightRole("SPAN")).toBe("generic");
  });

  it("maps input with no type to textbox (default)", () => {
    expect(resolvePlaywrightRole("INPUT")).toBe("textbox");
  });
});

describe("LocatorStrategy enum", () => {
  it("has expected values", () => {
    expect(LocatorStrategy.TestId).toBe("test-id");
    expect(LocatorStrategy.RoleName).toBe("role-name");
    expect(LocatorStrategy.Label).toBe("label");
    expect(LocatorStrategy.Placeholder).toBe("placeholder");
    expect(LocatorStrategy.Text).toBe("text");
    expect(LocatorStrategy.AltText).toBe("alt-text");
    expect(LocatorStrategy.Css).toBe("css");
  });
});
```

Add `resolvePlaywrightRole` and `LocatorStrategy` to the existing imports at the top of the test file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/johnhuang/projects/testomniac_types && bun run test`
Expected: FAIL — `resolvePlaywrightRole` and `LocatorStrategy` not exported

- [ ] **Step 3: Add types and `resolvePlaywrightRole` to `src/index.ts`**

Add the following before the response helper functions section:

```typescript
// ---------------------------------------------------------------------------
// Element Identity — persistent element identification across scans
// ---------------------------------------------------------------------------

export const LocatorStrategy = {
  TestId: "test-id",
  RoleName: "role-name",
  Label: "label",
  Placeholder: "placeholder",
  Text: "text",
  AltText: "alt-text",
  Css: "css",
} as const;
export type LocatorStrategy =
  (typeof LocatorStrategy)[keyof typeof LocatorStrategy];

export interface ElementLocator {
  strategy: LocatorStrategy;
  value: string;
  priority: number;
}

export interface ElementIdentity {
  role: string;
  computedName: string;
  tagName: string;
  labelText?: string;
  groupName?: string;
  placeholder?: string;
  altText?: string;
  testId?: string;
  inputType?: string;
  nthInGroup?: number;
  formContext?: string;
  headingContext?: string;
  landmarkAncestor?: string;
  playwrightLocator: string;
  playwrightScopeChain?: string;
  isUniqueOnPage: boolean;
  cssSelector: string;
  locators: ElementLocator[];
}

const IMPLICIT_ROLES: Record<string, string> = {
  BUTTON: "button",
  A: "link",
  SELECT: "combobox",
  TEXTAREA: "textbox",
  IMG: "img",
  H1: "heading",
  H2: "heading",
  H3: "heading",
  H4: "heading",
  H5: "heading",
  H6: "heading",
  FIELDSET: "group",
  NAV: "navigation",
  MAIN: "main",
  ASIDE: "complementary",
  HEADER: "banner",
  FOOTER: "contentinfo",
  TABLE: "table",
  FORM: "form",
  UL: "list",
  OL: "list",
  LI: "listitem",
};

const INPUT_TYPE_ROLES: Record<string, string> = {
  checkbox: "checkbox",
  radio: "radio",
  number: "spinbutton",
  range: "slider",
};

export function resolvePlaywrightRole(
  tagName: string,
  inputType?: string,
  ariaRole?: string
): string {
  if (ariaRole) return ariaRole;
  const tag = tagName.toUpperCase();
  if (tag === "INPUT") {
    const type = (inputType || "text").toLowerCase();
    return INPUT_TYPE_ROLES[type] || "textbox";
  }
  return IMPLICIT_ROLES[tag] || "generic";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/johnhuang/projects/testomniac_types && bun run test`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_types
git add src/index.ts src/index.test.ts
git commit -m "feat: add ElementIdentity types and resolvePlaywrightRole"
```

---

## Task 2: Types — Request/Response Types for Element Identity API

**Repo:** `testomniac_types`
**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.ts`
- Modify: `/Users/johnhuang/projects/testomniac_types/src/index.test.ts`

- [ ] **Step 1: Write failing tests for request/response type construction**

In `src/index.test.ts`, add:

```typescript
describe("ElementIdentity API types", () => {
  it("constructs CreateElementIdentityRequest", () => {
    const req: CreateElementIdentityRequest = {
      appId: 1,
      scanId: 10,
      role: "button",
      computedName: "Submit",
      tagName: "BUTTON",
      playwrightLocator: "getByRole('button', { name: 'Submit' })",
      isUniqueOnPage: true,
      cssSelector: "button.submit-btn",
      locators: [
        { strategy: LocatorStrategy.RoleName, value: "getByRole('button', { name: 'Submit' })", priority: 0 },
      ],
    };
    expect(req.appId).toBe(1);
    expect(req.locators).toHaveLength(1);
  });

  it("constructs ElementIdentityResponse", () => {
    const res: ElementIdentityResponse = {
      id: 1,
      appId: 1,
      role: "textbox",
      computedName: "Email",
      tagName: "INPUT",
      labelText: "Email Address",
      groupName: null,
      placeholder: "you@example.com",
      altText: null,
      testId: null,
      inputType: "email",
      nthInGroup: null,
      formContext: null,
      headingContext: "Login",
      landmarkAncestor: "main",
      playwrightLocator: "getByLabel('Email Address')",
      playwrightScopeChain: null,
      isUniqueOnPage: true,
      cssSelector: "input#email",
      locators: [],
      firstSeenScanId: 10,
      lastSeenScanId: 10,
      timesSeen: 1,
      createdAt: "2026-04-27T00:00:00.000Z",
      updatedAt: "2026-04-27T00:00:00.000Z",
    };
    expect(res.id).toBe(1);
    expect(res.labelText).toBe("Email Address");
  });
});
```

Add `CreateElementIdentityRequest` and `ElementIdentityResponse` to the test file imports.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/johnhuang/projects/testomniac_types && bun run test`
Expected: FAIL — types not exported

- [ ] **Step 3: Add request/response types to `src/index.ts`**

Add after the `ElementIdentity` section:

```typescript
// ---------------------------------------------------------------------------
// Element Identity — API request/response types
// ---------------------------------------------------------------------------

export interface CreateElementIdentityRequest {
  appId: number;
  scanId: number;
  role: string;
  computedName: string;
  tagName: string;
  labelText?: string;
  groupName?: string;
  placeholder?: string;
  altText?: string;
  testId?: string;
  inputType?: string;
  nthInGroup?: number;
  formContext?: string;
  headingContext?: string;
  landmarkAncestor?: string;
  playwrightLocator: string;
  playwrightScopeChain?: string;
  isUniqueOnPage: boolean;
  cssSelector: string;
  locators: ElementLocator[];
}

export interface UpdateElementIdentityRequest {
  lastSeenScanId: number;
  playwrightLocator?: string;
  playwrightScopeChain?: string;
  isUniqueOnPage?: boolean;
  cssSelector?: string;
  locators?: ElementLocator[];
}

export interface ElementIdentityResponse {
  id: number;
  appId: number;
  role: string;
  computedName: string | null;
  tagName: string;
  labelText: string | null;
  groupName: string | null;
  placeholder: string | null;
  altText: string | null;
  testId: string | null;
  inputType: string | null;
  nthInGroup: number | null;
  formContext: string | null;
  headingContext: string | null;
  landmarkAncestor: string | null;
  playwrightLocator: string;
  playwrightScopeChain: string | null;
  isUniqueOnPage: boolean;
  cssSelector: string;
  locators: ElementLocator[];
  firstSeenScanId: number;
  lastSeenScanId: number;
  timesSeen: number;
  createdAt: string | null;
  updatedAt: string | null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/johnhuang/projects/testomniac_types && bun run test`
Expected: ALL PASS

- [ ] **Step 5: Run full verify and commit**

```bash
cd /Users/johnhuang/projects/testomniac_types && bun run verify
git add src/index.ts src/index.test.ts
git commit -m "feat: add element identity request/response types"
```

- [ ] **Step 6: Publish updated types package**

```bash
cd /Users/johnhuang/projects/testomniac_types && npm publish
```

Then update the dependency in both consuming repos:
```bash
cd /Users/johnhuang/projects/testomniac_api && bun update @sudobility/testomniac_types
cd /Users/johnhuang/projects/testomniac_runner_service && bun update @sudobility/testomniac_types
```

---

## Task 3: API — Database Schema for Element Identities

**Repo:** `testomniac_api`
**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/schema.ts`
- Modify: `/Users/johnhuang/projects/testomniac_api/src/db/schema.test.ts`

- [ ] **Step 1: Write failing schema test**

In `src/db/schema.test.ts`, add a new describe block:

```typescript
describe("elementIdentities table", () => {
  it("has expected columns", () => {
    const cols = (elementIdentities as any)[Symbol.for("drizzle:Columns")];
    expect(cols.id).toBeDefined();
    expect(cols.appId).toBeDefined();
    expect(cols.role).toBeDefined();
    expect(cols.computedName).toBeDefined();
    expect(cols.tagName).toBeDefined();
    expect(cols.labelText).toBeDefined();
    expect(cols.groupName).toBeDefined();
    expect(cols.placeholder).toBeDefined();
    expect(cols.altText).toBeDefined();
    expect(cols.testId).toBeDefined();
    expect(cols.inputType).toBeDefined();
    expect(cols.nthInGroup).toBeDefined();
    expect(cols.formContext).toBeDefined();
    expect(cols.headingContext).toBeDefined();
    expect(cols.landmarkAncestor).toBeDefined();
    expect(cols.playwrightLocator).toBeDefined();
    expect(cols.playwrightScopeChain).toBeDefined();
    expect(cols.isUniqueOnPage).toBeDefined();
    expect(cols.cssSelector).toBeDefined();
    expect(cols.locators).toBeDefined();
    expect(cols.firstSeenScanId).toBeDefined();
    expect(cols.lastSeenScanId).toBeDefined();
    expect(cols.timesSeen).toBeDefined();
  });

  it("has appId as not null", () => {
    const cols = (elementIdentities as any)[Symbol.for("drizzle:Columns")];
    expect(cols.appId.notNull).toBe(true);
  });

  it("has role as not null", () => {
    const cols = (elementIdentities as any)[Symbol.for("drizzle:Columns")];
    expect(cols.role.notNull).toBe(true);
  });
});
```

Add `elementIdentities` to the imports from `./schema`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/johnhuang/projects/testomniac_api && bun run test`
Expected: FAIL — `elementIdentities` not exported

- [ ] **Step 3: Add `elementIdentities` table to `src/db/schema.ts`**

Add after the `actionableItems` table definition (after line ~315):

```typescript
export const elementIdentities = starterSchema.table(
  "element_identities",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    appId: bigserial("app_id", { mode: "number" })
      .references(() => apps.id)
      .notNull(),
    role: text("role").notNull(),
    computedName: text("computed_name"),
    tagName: text("tag_name").notNull(),
    labelText: text("label_text"),
    groupName: text("group_name"),
    placeholder: text("placeholder"),
    altText: text("alt_text"),
    testId: text("test_id"),
    inputType: text("input_type"),
    nthInGroup: integer("nth_in_group"),
    formContext: text("form_context"),
    headingContext: text("heading_context"),
    landmarkAncestor: text("landmark_ancestor"),
    playwrightLocator: text("playwright_locator").notNull(),
    playwrightScopeChain: text("playwright_scope_chain"),
    isUniqueOnPage: boolean("is_unique_on_page").notNull().default(true),
    cssSelector: text("css_selector").notNull(),
    locators: jsonb("locators").notNull().default([]),
    firstSeenScanId: bigserial("first_seen_scan_id", { mode: "number" })
      .references(() => scans.id),
    lastSeenScanId: bigserial("last_seen_scan_id", { mode: "number" })
      .references(() => scans.id),
    timesSeen: integer("times_seen").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    appRoleNameIdx: index("testomniac_element_identities_app_role_name_idx").on(
      table.appId,
      table.role,
      table.computedName
    ),
    appTestIdIdx: index("testomniac_element_identities_app_testid_idx").on(
      table.appId,
      table.testId
    ),
  })
);
```

- [ ] **Step 4: Add `elementIdentityId` FK to `actionableItems` table**

In the `actionableItems` table definition, add a new column after `reusableHtmlElementId`:

```typescript
  elementIdentityId: bigserial("element_identity_id", { mode: "number" })
    .references(() => elementIdentities.id),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/johnhuang/projects/testomniac_api && bun run test`
Expected: ALL PASS

- [ ] **Step 6: Add table creation to `initDatabase`**

In `src/db/index.ts`, add the CREATE TABLE SQL for `element_identities` in the `initDatabase()` function, and the ALTER TABLE for the new FK column on `actionable_items`. Follow the existing pattern used for other tables.

- [ ] **Step 7: Run typecheck and commit**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run typecheck
git add src/db/schema.ts src/db/schema.test.ts src/db/index.ts
git commit -m "feat: add element_identities table and FK on actionable_items"
```

---

## Task 4: API — Scanner CRUD Endpoints for Element Identities

**Repo:** `testomniac_api`
**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/scanner.ts`

- [ ] **Step 1: Add imports**

Add `elementIdentities` to the schema import at the top of `scanner.ts`, and add `CreateElementIdentityRequest`, `UpdateElementIdentityRequest` to the types import.

- [ ] **Step 2: Add POST /element-identities (find-or-create)**

Add at the end of the scanner router, before the export:

```typescript
// ===========================================================================
// Element Identities
// ===========================================================================

scannerRouter.post("/element-identities", async c => {
  const body = await c.req.json<CreateElementIdentityRequest>();

  // Try to find by testId first (strongest match)
  if (body.testId) {
    const byTestId = await db.query.elementIdentities.findFirst({
      where: and(
        eq(elementIdentities.appId, body.appId),
        eq(elementIdentities.testId, body.testId)
      ),
    });
    if (byTestId) {
      // Update last seen
      await db
        .update(elementIdentities)
        .set({
          lastSeenScanId: body.scanId,
          timesSeen: byTestId.timesSeen + 1,
          playwrightLocator: body.playwrightLocator,
          playwrightScopeChain: body.playwrightScopeChain,
          isUniqueOnPage: body.isUniqueOnPage,
          cssSelector: body.cssSelector,
          locators: body.locators,
          updatedAt: new Date(),
        })
        .where(eq(elementIdentities.id, byTestId.id));
      return c.json(successResponse({ ...byTestId, lastSeenScanId: body.scanId, timesSeen: byTestId.timesSeen + 1 }));
    }
  }

  // Try to find by role + computedName + groupName
  const conditions = [
    eq(elementIdentities.appId, body.appId),
    eq(elementIdentities.role, body.role),
    eq(elementIdentities.tagName, body.tagName),
  ];
  if (body.computedName) {
    conditions.push(eq(elementIdentities.computedName, body.computedName));
  }
  if (body.groupName) {
    conditions.push(eq(elementIdentities.groupName, body.groupName));
  }
  if (body.labelText) {
    conditions.push(eq(elementIdentities.labelText, body.labelText));
  }

  const existing = await db.query.elementIdentities.findFirst({
    where: and(...conditions),
  });

  if (existing) {
    await db
      .update(elementIdentities)
      .set({
        lastSeenScanId: body.scanId,
        timesSeen: existing.timesSeen + 1,
        playwrightLocator: body.playwrightLocator,
        playwrightScopeChain: body.playwrightScopeChain,
        isUniqueOnPage: body.isUniqueOnPage,
        cssSelector: body.cssSelector,
        locators: body.locators,
        updatedAt: new Date(),
      })
      .where(eq(elementIdentities.id, existing.id));
    return c.json(successResponse({ ...existing, lastSeenScanId: body.scanId, timesSeen: existing.timesSeen + 1 }));
  }

  // Create new
  const [row] = await db
    .insert(elementIdentities)
    .values({
      appId: body.appId,
      role: body.role,
      computedName: body.computedName,
      tagName: body.tagName,
      labelText: body.labelText,
      groupName: body.groupName,
      placeholder: body.placeholder,
      altText: body.altText,
      testId: body.testId,
      inputType: body.inputType,
      nthInGroup: body.nthInGroup,
      formContext: body.formContext,
      headingContext: body.headingContext,
      landmarkAncestor: body.landmarkAncestor,
      playwrightLocator: body.playwrightLocator,
      playwrightScopeChain: body.playwrightScopeChain,
      isUniqueOnPage: body.isUniqueOnPage,
      cssSelector: body.cssSelector,
      locators: body.locators,
      firstSeenScanId: body.scanId,
      lastSeenScanId: body.scanId,
    })
    .returning();
  return c.json(successResponse(row), 201);
});
```

- [ ] **Step 3: Add GET /element-identities?appId=X**

```typescript
scannerRouter.get("/element-identities", async c => {
  const appId = Number(c.req.query("appId"));
  if (!appId) return c.json(errorResponse("appId query param required"), 400);
  const result = await db.query.elementIdentities.findMany({
    where: eq(elementIdentities.appId, appId),
  });
  return c.json(successResponse(result));
});
```

- [ ] **Step 4: Add PATCH /element-identities/:id**

```typescript
scannerRouter.patch("/element-identities/:id", async c => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<UpdateElementIdentityRequest>();
  const updates: Record<string, unknown> = {
    lastSeenScanId: body.lastSeenScanId,
    updatedAt: new Date(),
  };
  if (body.playwrightLocator !== undefined) updates.playwrightLocator = body.playwrightLocator;
  if (body.playwrightScopeChain !== undefined) updates.playwrightScopeChain = body.playwrightScopeChain;
  if (body.isUniqueOnPage !== undefined) updates.isUniqueOnPage = body.isUniqueOnPage;
  if (body.cssSelector !== undefined) updates.cssSelector = body.cssSelector;
  if (body.locators !== undefined) updates.locators = body.locators;
  await db.update(elementIdentities).set(updates).where(eq(elementIdentities.id, id));
  return c.json(successResponse(null));
});
```

- [ ] **Step 5: Run typecheck and commit**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run typecheck
git add src/routes/scanner.ts
git commit -m "feat: add scanner CRUD endpoints for element identities"
```

---

## Task 5: API — User-Facing Read Endpoint

**Repo:** `testomniac_api`
**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_api/src/routes/runs-read.ts`

- [ ] **Step 1: Add element identities read endpoint**

In `runs-read.ts`, add after the existing `/runs/:runId/components` endpoint:

```typescript
runsReadRouter.get("/:runId/element-identities", async c => {
  const runId = Number(c.req.param("runId"));
  const scan = await db.query.scans.findFirst({ where: eq(scans.id, runId) });
  if (!scan) return c.json(errorResponse("Run not found"), 404);
  const result = await db.query.elementIdentities.findMany({
    where: eq(elementIdentities.appId, scan.appId),
  });
  return c.json(successResponse(result));
});
```

Add `elementIdentities` to the schema imports at the top.

- [ ] **Step 2: Run typecheck and commit**

```bash
cd /Users/johnhuang/projects/testomniac_api && bun run typecheck
git add src/routes/runs-read.ts
git commit -m "feat: add user-facing element identities read endpoint"
```

---

## Task 6: Scanning Service — Enhanced DOM Snapshot Extraction

**Repo:** `testomniac_runner_service`
**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/extractors/types.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/browser/dom-snapshot.ts`

- [ ] **Step 1: Add new fields to `DomSnapshotEntry`**

In `src/extractors/types.ts`, add fields to the `DomSnapshotEntry` interface:

```typescript
export interface DomSnapshotEntry {
  selector: string;
  tagName: string;
  role?: string;
  inputType?: string;
  accessibleName?: string;
  textContent?: string;
  href?: string;
  disabled: boolean;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  attributes: Record<string, string>;
  sourceHints: string[];
  // Identity signals (for persistent element matching)
  groupName?: string;
  headingContext?: string;
  landmarkAncestor?: string;
  testId?: string;
  formContext?: string;
}
```

- [ ] **Step 2: Extract identity signals in `dom-snapshot.ts`**

In `src/browser/dom-snapshot.ts`, inside the `pushEntry` function (after the `attrs` extraction block, before `entries.push`), add the following code. Also add the new fields to the `SnapshotEntry` interface inside the `evaluate` callback:

Add to the `SnapshotEntry` interface (around line 144):
```typescript
    interface SnapshotEntry {
      // ... existing fields ...
      groupName?: string;
      headingContext?: string;
      landmarkAncestor?: string;
      testId?: string;
      formContext?: string;
    }
```

Add extraction code before `entries.push(...)` (before the line with `entries.push({`):

```typescript
      // --- Identity signals ---
      const testId =
        el.getAttribute("data-testid") ||
        el.getAttribute("data-test-id") ||
        el.getAttribute("data-cy") ||
        undefined;

      // Group name: fieldset>legend or role="radiogroup" aria-label
      let groupName: string | undefined;
      const fieldset = el.closest("fieldset");
      if (fieldset) {
        const legend = fieldset.querySelector("legend");
        if (legend) groupName = legend.textContent?.trim().slice(0, 80);
      }
      if (!groupName) {
        const radioGroup = el.closest('[role="radiogroup"], [role="group"]');
        if (radioGroup) {
          groupName =
            radioGroup.getAttribute("aria-label") ||
            radioGroup.getAttribute("aria-labelledby")
              ? document
                  .getElementById(
                    radioGroup.getAttribute("aria-labelledby") || ""
                  )
                  ?.textContent?.trim()
                  .slice(0, 80)
              : undefined;
        }
      }

      // Heading context: nearest preceding heading
      let headingContext: string | undefined;
      let prevEl: Element | null = el;
      for (let i = 0; i < 50 && prevEl; i++) {
        const prevSibling = prevEl.previousElementSibling;
        if (prevSibling) {
          if (/^H[1-6]$/.test(prevSibling.tagName)) {
            headingContext = prevSibling.textContent?.trim().slice(0, 80);
            break;
          }
          const nested = prevSibling.querySelector("h1,h2,h3,h4,h5,h6");
          if (nested) {
            headingContext = nested.textContent?.trim().slice(0, 80);
            break;
          }
          prevEl = prevSibling;
        } else {
          prevEl = prevEl.parentElement;
        }
      }

      // Landmark ancestor: nearest ARIA landmark
      const landmarkRoles = [
        "banner",
        "navigation",
        "main",
        "complementary",
        "contentinfo",
        "form",
        "region",
        "search",
      ];
      const landmarkSelectors = [
        "header",
        "nav",
        "main",
        "aside",
        "footer",
        "form[aria-label]",
        "section[aria-label]",
      ];
      let landmarkAncestor: string | undefined;
      const landmarkEl = el.closest(
        landmarkRoles.map(r => `[role="${r}"]`).join(",") +
          "," +
          landmarkSelectors.join(",")
      );
      if (landmarkEl && landmarkEl !== el) {
        landmarkAncestor =
          landmarkEl.getAttribute("role") ||
          {
            HEADER: "banner",
            NAV: "navigation",
            MAIN: "main",
            ASIDE: "complementary",
            FOOTER: "contentinfo",
          }[landmarkEl.tagName] ||
          undefined;
      }

      // Form context: enclosing form action or id
      let formContext: string | undefined;
      const formEl = el.closest("form");
      if (formEl) {
        formContext =
          formEl.getAttribute("action") ||
          formEl.getAttribute("id") ||
          formEl.getAttribute("name") ||
          undefined;
      }
```

Then update the `entries.push(...)` call to include the new fields:
```typescript
      entries.push({
        // ... existing fields ...
        groupName,
        headingContext,
        landmarkAncestor,
        testId,
        formContext,
      });
```

- [ ] **Step 3: Run typecheck to verify**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run typecheck`
Expected: PASS (no type errors)

- [ ] **Step 4: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add src/extractors/types.ts src/browser/dom-snapshot.ts
git commit -m "feat: extract identity signals (group, heading, landmark, testId, form) in DOM snapshot"
```

---

## Task 7: Scanning Service — Playwright Locator Generator

**Repo:** `testomniac_runner_service`
**Files:**
- Create: `/Users/johnhuang/projects/testomniac_runner_service/src/identity/playwright-locator.ts`
- Create: `/Users/johnhuang/projects/testomniac_runner_service/src/identity/playwright-locator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/identity/playwright-locator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { toPlaywrightLocator, buildScopeChain } from "./playwright-locator";
import type { ElementIdentity } from "@sudobility/testomniac_types";

function makeIdentity(
  overrides: Partial<ElementIdentity>
): ElementIdentity {
  return {
    role: "generic",
    computedName: "",
    tagName: "DIV",
    playwrightLocator: "",
    isUniqueOnPage: true,
    cssSelector: "div",
    locators: [],
    ...overrides,
  };
}

describe("toPlaywrightLocator", () => {
  it("prefers data-testid when available", () => {
    const id = makeIdentity({ testId: "login-btn", role: "button", computedName: "Login" });
    expect(toPlaywrightLocator(id)).toBe("getByTestId('login-btn')");
  });

  it("uses getByLabel for form controls with label", () => {
    const id = makeIdentity({ role: "textbox", labelText: "Email Address", tagName: "INPUT", inputType: "email" });
    expect(toPlaywrightLocator(id)).toBe("getByLabel('Email Address')");
  });

  it("uses getByPlaceholder for inputs with placeholder but no label", () => {
    const id = makeIdentity({ role: "textbox", placeholder: "Search...", tagName: "INPUT" });
    expect(toPlaywrightLocator(id)).toBe("getByPlaceholder('Search...')");
  });

  it("uses getByRole for buttons", () => {
    const id = makeIdentity({ role: "button", computedName: "Submit" });
    expect(toPlaywrightLocator(id)).toBe("getByRole('button', { name: 'Submit' })");
  });

  it("uses getByRole for links", () => {
    const id = makeIdentity({ role: "link", computedName: "About Us" });
    expect(toPlaywrightLocator(id)).toBe("getByRole('link', { name: 'About Us' })");
  });

  it("uses getByRole for radio buttons", () => {
    const id = makeIdentity({ role: "radio", computedName: "Express (2-3 days)" });
    expect(toPlaywrightLocator(id)).toBe("getByRole('radio', { name: 'Express (2-3 days)' })");
  });

  it("uses getByAltText for images", () => {
    const id = makeIdentity({ role: "img", altText: "Company Logo" });
    expect(toPlaywrightLocator(id)).toBe("getByAltText('Company Logo')");
  });

  it("uses getByText as fallback for generic elements with text", () => {
    const id = makeIdentity({ role: "generic", computedName: "Click here" });
    expect(toPlaywrightLocator(id)).toBe("getByText('Click here')");
  });

  it("falls back to locator(css) when nothing else works", () => {
    const id = makeIdentity({ role: "generic", cssSelector: "div.mystery" });
    expect(toPlaywrightLocator(id)).toBe("locator('div.mystery')");
  });

  it("escapes single quotes in names", () => {
    const id = makeIdentity({ role: "button", computedName: "Don't click" });
    expect(toPlaywrightLocator(id)).toBe("getByRole('button', { name: \"Don't click\" })");
  });

  it("prefers label over placeholder for form controls", () => {
    const id = makeIdentity({ role: "textbox", labelText: "Email", placeholder: "you@example.com", tagName: "INPUT" });
    expect(toPlaywrightLocator(id)).toBe("getByLabel('Email')");
  });
});

describe("buildScopeChain", () => {
  it("returns group scope for elements with groupName", () => {
    const id = makeIdentity({ groupName: "Shipping Method" });
    expect(buildScopeChain(id)).toBe("getByRole('group', { name: 'Shipping Method' })");
  });

  it("returns form scope for elements with formContext", () => {
    const id = makeIdentity({ formContext: "/login" });
    expect(buildScopeChain(id)).toBe("locator('form[action=\"/login\"]')");
  });

  it("returns landmark scope", () => {
    const id = makeIdentity({ landmarkAncestor: "navigation" });
    expect(buildScopeChain(id)).toBe("getByRole('navigation')");
  });

  it("returns undefined when no scope context", () => {
    const id = makeIdentity({});
    expect(buildScopeChain(id)).toBeUndefined();
  });

  it("prefers group over form over landmark", () => {
    const id = makeIdentity({ groupName: "Options", formContext: "/form", landmarkAncestor: "main" });
    expect(buildScopeChain(id)).toBe("getByRole('group', { name: 'Options' })");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run test src/identity/playwright-locator.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the locator generator**

Create `src/identity/playwright-locator.ts`:

```typescript
import type { ElementIdentity } from "@sudobility/testomniac_types";

const FORM_CONTROL_ROLES = new Set([
  "textbox",
  "checkbox",
  "radio",
  "combobox",
  "spinbutton",
  "slider",
  "switch",
]);

function escapeQuotes(s: string): { value: string; quote: string } {
  if (!s.includes("'")) return { value: s, quote: "'" };
  if (!s.includes('"')) return { value: s, quote: '"' };
  return { value: s.replace(/'/g, "\\'"), quote: "'" };
}

function wrap(method: string, arg: string): string {
  const { value, quote } = escapeQuotes(arg);
  return `${method}(${quote}${value}${quote})`;
}

function wrapRole(role: string, name: string): string {
  const { value, quote } = escapeQuotes(name);
  return `getByRole('${role}', { name: ${quote}${value}${quote} })`;
}

export function toPlaywrightLocator(identity: ElementIdentity): string {
  // 1. data-testid
  if (identity.testId) {
    return wrap("getByTestId", identity.testId);
  }

  // 2. Form controls with label
  if (identity.labelText && FORM_CONTROL_ROLES.has(identity.role)) {
    return wrap("getByLabel", identity.labelText);
  }

  // 3. Form controls with placeholder (no label)
  if (
    identity.placeholder &&
    FORM_CONTROL_ROLES.has(identity.role) &&
    !identity.labelText
  ) {
    return wrap("getByPlaceholder", identity.placeholder);
  }

  // 4. Role + accessible name (skip generic role)
  if (identity.computedName && identity.role !== "generic") {
    return wrapRole(identity.role, identity.computedName);
  }

  // 5. Images with alt text
  if (identity.altText) {
    return wrap("getByAltText", identity.altText);
  }

  // 6. Text content fallback (for generic elements)
  if (identity.computedName) {
    return wrap("getByText", identity.computedName);
  }

  // 7. CSS selector as last resort
  return `locator('${identity.cssSelector}')`;
}

export function buildScopeChain(
  identity: ElementIdentity
): string | undefined {
  if (identity.groupName) {
    return wrapRole("group", identity.groupName);
  }
  if (identity.formContext) {
    return `locator('form[action="${identity.formContext}"]')`;
  }
  if (identity.landmarkAncestor) {
    return `getByRole('${identity.landmarkAncestor}')`;
  }
  return undefined;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run test src/identity/playwright-locator.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add src/identity/playwright-locator.ts src/identity/playwright-locator.test.ts
git commit -m "feat: add Playwright locator generator"
```

---

## Task 8: Scanning Service — Element Identity Matcher

**Repo:** `testomniac_runner_service`
**Files:**
- Create: `/Users/johnhuang/projects/testomniac_runner_service/src/identity/element-matcher.ts`
- Create: `/Users/johnhuang/projects/testomniac_runner_service/src/identity/element-matcher.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/identity/element-matcher.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { matchElementIdentity, type ElementFingerprint } from "./element-matcher";
import type { ElementIdentityResponse } from "@sudobility/testomniac_types";

function makeResponse(
  overrides: Partial<ElementIdentityResponse>
): ElementIdentityResponse {
  return {
    id: 1,
    appId: 1,
    role: "generic",
    computedName: null,
    tagName: "DIV",
    labelText: null,
    groupName: null,
    placeholder: null,
    altText: null,
    testId: null,
    inputType: null,
    nthInGroup: null,
    formContext: null,
    headingContext: null,
    landmarkAncestor: null,
    playwrightLocator: "locator('div')",
    playwrightScopeChain: null,
    isUniqueOnPage: true,
    cssSelector: "div",
    locators: [],
    firstSeenScanId: 1,
    lastSeenScanId: 1,
    timesSeen: 1,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function makeFP(overrides: Partial<ElementFingerprint>): ElementFingerprint {
  return {
    role: "generic",
    computedName: "",
    tagName: "DIV",
    cssSelector: "div",
    ...overrides,
  };
}

describe("matchElementIdentity", () => {
  it("matches by testId with score 1.0", () => {
    const existing = [makeResponse({ id: 1, testId: "submit-btn", role: "button" })];
    const fp = makeFP({ testId: "submit-btn", role: "button" });
    const result = matchElementIdentity(fp, existing);
    expect(result).not.toBeNull();
    expect(result!.identity.id).toBe(1);
    expect(result!.score).toBe(1.0);
  });

  it("matches by role + computedName + groupName with score 0.95", () => {
    const existing = [makeResponse({ id: 2, role: "radio", computedName: "Express", groupName: "Shipping" })];
    const fp = makeFP({ role: "radio", computedName: "Express", groupName: "Shipping" });
    const result = matchElementIdentity(fp, existing);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(0.95);
  });

  it("matches by role + computedName with score 0.9", () => {
    const existing = [makeResponse({ id: 3, role: "button", computedName: "Submit" })];
    const fp = makeFP({ role: "button", computedName: "Submit" });
    const result = matchElementIdentity(fp, existing);
    expect(result!.score).toBe(0.9);
  });

  it("matches by labelText with score 0.85", () => {
    const existing = [makeResponse({ id: 4, role: "textbox", labelText: "Email" })];
    const fp = makeFP({ role: "textbox", labelText: "Email" });
    const result = matchElementIdentity(fp, existing);
    expect(result!.score).toBe(0.85);
  });

  it("matches by placeholder with score 0.75", () => {
    const existing = [makeResponse({ id: 5, role: "textbox", placeholder: "Search..." })];
    const fp = makeFP({ role: "textbox", placeholder: "Search..." });
    const result = matchElementIdentity(fp, existing);
    expect(result!.score).toBe(0.75);
  });

  it("returns null when no match above threshold", () => {
    const existing = [makeResponse({ id: 6, role: "button", computedName: "Submit" })];
    const fp = makeFP({ role: "link", computedName: "About" });
    const result = matchElementIdentity(fp, existing);
    expect(result).toBeNull();
  });

  it("returns best match when multiple candidates", () => {
    const existing = [
      makeResponse({ id: 10, role: "button", computedName: "Save" }),
      makeResponse({ id: 11, role: "button", computedName: "Save", testId: "save-btn" }),
    ];
    const fp = makeFP({ role: "button", computedName: "Save", testId: "save-btn" });
    const result = matchElementIdentity(fp, existing);
    expect(result!.identity.id).toBe(11);
    expect(result!.score).toBe(1.0);
  });

  it("returns null for empty existing list", () => {
    const fp = makeFP({ role: "button", computedName: "Submit" });
    expect(matchElementIdentity(fp, [])).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run test src/identity/element-matcher.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the matcher**

Create `src/identity/element-matcher.ts`:

```typescript
import type { ElementIdentityResponse } from "@sudobility/testomniac_types";

export interface ElementFingerprint {
  role: string;
  computedName: string;
  tagName: string;
  labelText?: string;
  groupName?: string;
  placeholder?: string;
  altText?: string;
  testId?: string;
  inputType?: string;
  nthInGroup?: number;
  formContext?: string;
  headingContext?: string;
  landmarkAncestor?: string;
  cssSelector: string;
}

export interface MatchResult {
  identity: ElementIdentityResponse;
  score: number;
}

const MATCH_THRESHOLD = 0.7;

export function matchElementIdentity(
  fp: ElementFingerprint,
  existing: ElementIdentityResponse[]
): MatchResult | null {
  let best: MatchResult | null = null;

  for (const identity of existing) {
    const score = computeMatchScore(fp, identity);
    if (score > (best?.score ?? 0)) {
      best = { identity, score };
    }
  }

  return best && best.score >= MATCH_THRESHOLD ? best : null;
}

function computeMatchScore(
  fp: ElementFingerprint,
  id: ElementIdentityResponse
): number {
  // 1. Exact testId match
  if (fp.testId && id.testId && fp.testId === id.testId) {
    return 1.0;
  }

  // 2. Role + computedName + groupName
  if (
    fp.role === id.role &&
    fp.computedName &&
    id.computedName &&
    fp.computedName === id.computedName &&
    fp.groupName &&
    id.groupName &&
    fp.groupName === id.groupName
  ) {
    return 0.95;
  }

  // 3. Role + computedName
  if (
    fp.role === id.role &&
    fp.computedName &&
    id.computedName &&
    fp.computedName === id.computedName
  ) {
    return 0.9;
  }

  // 4. Role + labelText
  if (
    fp.role === id.role &&
    fp.labelText &&
    id.labelText &&
    fp.labelText === id.labelText
  ) {
    return 0.85;
  }

  // 5. Role + computedName + landmarkAncestor
  if (
    fp.role === id.role &&
    fp.computedName &&
    id.computedName &&
    fp.computedName === id.computedName &&
    fp.landmarkAncestor &&
    id.landmarkAncestor &&
    fp.landmarkAncestor === id.landmarkAncestor
  ) {
    return 0.8;
  }

  // 6. Role + placeholder
  if (
    fp.role === id.role &&
    fp.placeholder &&
    id.placeholder &&
    fp.placeholder === id.placeholder
  ) {
    return 0.75;
  }

  return 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run test src/identity/element-matcher.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add src/identity/element-matcher.ts src/identity/element-matcher.test.ts
git commit -m "feat: add multi-signal element identity matcher"
```

---

## Task 9: Scanning Service — API Client Methods and Identity Cache

**Repo:** `testomniac_runner_service`
**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/api/client.ts`
- Create: `/Users/johnhuang/projects/testomniac_runner_service/src/identity/identity-cache.ts`

- [ ] **Step 1: Add API client methods**

In `src/api/client.ts`, add imports for the new types:

```typescript
import type {
  // ... existing imports ...
  CreateElementIdentityRequest,
  UpdateElementIdentityRequest,
  ElementIdentityResponse,
} from "@sudobility/testomniac_types";
```

Add a new section before the singleton at the end:

```typescript
  // ===========================================================================
  // Element Identities
  // ===========================================================================

  findOrCreateElementIdentity(
    params: CreateElementIdentityRequest
  ): Promise<ElementIdentityResponse> {
    return this.post("/element-identities", params);
  }

  getElementIdentitiesByApp(
    appId: number
  ): Promise<ElementIdentityResponse[]> {
    return this.get(`/element-identities?appId=${appId}`);
  }

  updateElementIdentity(
    id: number,
    params: UpdateElementIdentityRequest
  ): Promise<void> {
    return this.patch(`/element-identities/${id}`, params);
  }
```

- [ ] **Step 2: Create identity cache**

Create `src/identity/identity-cache.ts`:

```typescript
import type { ApiClient } from "../api/client";
import type { ElementIdentityResponse } from "@sudobility/testomniac_types";

export class IdentityCache {
  private appId: number;
  private api: ApiClient;
  private identities: ElementIdentityResponse[] = [];

  constructor(appId: number, api: ApiClient) {
    this.appId = appId;
    this.api = api;
  }

  async preload(): Promise<void> {
    this.identities = await this.api.getElementIdentitiesByApp(this.appId);
  }

  getAll(): ElementIdentityResponse[] {
    return this.identities;
  }

  add(identity: ElementIdentityResponse): void {
    const idx = this.identities.findIndex(i => i.id === identity.id);
    if (idx >= 0) {
      this.identities[idx] = identity;
    } else {
      this.identities.push(identity);
    }
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add src/api/client.ts src/identity/identity-cache.ts
git commit -m "feat: add element identity API client methods and preloading cache"
```

---

## Task 10: Scanning Service — Integrate Identity Matching into Mouse Scanning

**Repo:** `testomniac_runner_service`
**Files:**
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/orchestrator/mouse-scanning.ts`
- Modify: `/Users/johnhuang/projects/testomniac_runner_service/src/extractors/helpers.ts`

This task wires everything together: after extracting actionable items on each page, build fingerprints, match/create identities, generate Playwright locators, and store the `elementIdentityId` on each actionable item.

- [ ] **Step 1: Update `helpers.ts` to pass through identity signals**

In `src/extractors/helpers.ts`, update `createCandidate` to forward identity signals from `DomSnapshotEntry`:

```typescript
export function createCandidate(
  entry: DomSnapshotEntry,
  source: string
): ExtractorCandidate {
  return {
    selector: entry.selector,
    tagName: entry.tagName,
    role: entry.role,
    inputType: entry.inputType,
    accessibleName: entry.accessibleName,
    textContent: entry.textContent,
    href: entry.href,
    disabled: entry.disabled,
    visible: entry.visible,
    attributes: {
      ...entry.attributes,
      // Propagate identity signals through attributes for downstream use
      ...(entry.groupName ? { _groupName: entry.groupName } : {}),
      ...(entry.headingContext ? { _headingContext: entry.headingContext } : {}),
      ...(entry.landmarkAncestor ? { _landmarkAncestor: entry.landmarkAncestor } : {}),
      ...(entry.testId ? { _testId: entry.testId } : {}),
      ...(entry.formContext ? { _formContext: entry.formContext } : {}),
    },
    source,
  };
}
```

- [ ] **Step 2: Add identity resolution to `mouse-scanning.ts`**

Add imports at the top of `src/orchestrator/mouse-scanning.ts`:

```typescript
import { IdentityCache } from "../identity/identity-cache";
import {
  matchElementIdentity,
  type ElementFingerprint,
} from "../identity/element-matcher";
import {
  toPlaywrightLocator,
  buildScopeChain,
} from "../identity/playwright-locator";
import {
  resolvePlaywrightRole,
  LocatorStrategy,
  type ElementLocator,
  type ElementIdentity,
} from "@sudobility/testomniac_types";
```

After the `reusableCache.preload()` call (around line 52), add:

```typescript
  const identityCache = new IdentityCache(config.appId, api);
  await identityCache.preload();
```

- [ ] **Step 3: Add identity matching after `insertActionableItems`**

In `mouse-scanning.ts`, after the `insertActionableItems` call (around line 247), add a block that matches each item to an identity:

```typescript
        // Match / create element identities for visible items
        for (let i = 0; i < insertedItems.length; i++) {
          const inserted = insertedItems[i];
          const original = items.find(o => o.selector === inserted.selector);
          if (!original || !original.visible) continue;

          const attrs = original.attributes || {};
          const role = resolvePlaywrightRole(
            original.tagName,
            original.inputType,
            original.role
          );

          const fp: ElementFingerprint = {
            role,
            computedName: original.accessibleName || original.textContent || "",
            tagName: original.tagName,
            labelText: attrs.labelText || undefined,
            groupName: attrs._groupName || undefined,
            placeholder: attrs.placeholder || undefined,
            altText: original.tagName === "IMG" ? (original.accessibleName || undefined) : undefined,
            testId: attrs._testId || undefined,
            inputType: original.inputType,
            formContext: attrs._formContext || undefined,
            headingContext: attrs._headingContext || undefined,
            landmarkAncestor: attrs._landmarkAncestor || undefined,
            cssSelector: original.selector,
          };

          // Build identity object for locator generation
          const partialIdentity: ElementIdentity = {
            ...fp,
            playwrightLocator: "",
            isUniqueOnPage: true,
            locators: [],
          };
          const locator = toPlaywrightLocator(partialIdentity);
          const scopeChain = buildScopeChain(partialIdentity);

          // Build locator strategies list
          const locators: ElementLocator[] = [];
          if (fp.testId) {
            locators.push({ strategy: LocatorStrategy.TestId, value: `getByTestId('${fp.testId}')`, priority: 0 });
          }
          if (fp.labelText) {
            locators.push({ strategy: LocatorStrategy.Label, value: `getByLabel('${fp.labelText}')`, priority: 1 });
          }
          if (fp.placeholder) {
            locators.push({ strategy: LocatorStrategy.Placeholder, value: `getByPlaceholder('${fp.placeholder}')`, priority: 2 });
          }
          if (fp.computedName && role !== "generic") {
            locators.push({ strategy: LocatorStrategy.RoleName, value: `getByRole('${role}', { name: '${fp.computedName}' })`, priority: 3 });
          }
          if (fp.computedName) {
            locators.push({ strategy: LocatorStrategy.Text, value: `getByText('${fp.computedName}')`, priority: 4 });
          }
          locators.push({ strategy: LocatorStrategy.Css, value: original.selector, priority: 10 });

          // Match against existing identities
          const match = matchElementIdentity(fp, identityCache.getAll());
          if (match) {
            // Update existing identity
            await api.updateElementIdentity(match.identity.id, {
              lastSeenScanId: config.runId,
              playwrightLocator: locator,
              playwrightScopeChain: scopeChain,
              cssSelector: original.selector,
              locators,
            });
            identityCache.add({ ...match.identity, lastSeenScanId: config.runId });
          } else {
            // Create new identity
            const created = await api.findOrCreateElementIdentity({
              appId: config.appId,
              scanId: config.runId,
              role,
              computedName: fp.computedName,
              tagName: fp.tagName,
              labelText: fp.labelText,
              groupName: fp.groupName,
              placeholder: fp.placeholder,
              altText: fp.altText,
              testId: fp.testId,
              inputType: fp.inputType,
              formContext: fp.formContext,
              headingContext: fp.headingContext,
              landmarkAncestor: fp.landmarkAncestor,
              playwrightLocator: locator,
              playwrightScopeChain: scopeChain,
              isUniqueOnPage: true,
              cssSelector: original.selector,
              locators,
            });
            identityCache.add(created);
          }
        }
```

- [ ] **Step 4: Run typecheck**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service
git add src/orchestrator/mouse-scanning.ts src/extractors/helpers.ts
git commit -m "feat: integrate element identity matching into mouse scanning loop"
```

---

## Task 11: Scanning Service — Playwright Test Script Export

**Repo:** `testomniac_runner_service`
**Files:**
- Create: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/playwright-export.ts`
- Create: `/Users/johnhuang/projects/testomniac_runner_service/src/generation/playwright-export.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/generation/playwright-export.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { exportAsPlaywrightScript } from "./playwright-export";

describe("exportAsPlaywrightScript", () => {
  it("generates a valid Playwright test script for a render test", () => {
    const script = exportAsPlaywrightScript({
      testName: "Render — Home Page",
      baseUrl: "https://example.com",
      steps: [
        { action: "navigate", url: "https://example.com" },
        { action: "assertVisible", playwrightLocator: "getByRole('heading', { name: 'Welcome' })" },
        { action: "screenshot", label: "render-home" },
      ],
    });
    expect(script).toContain("import { test, expect } from '@playwright/test'");
    expect(script).toContain("test('Render — Home Page'");
    expect(script).toContain("await page.goto('https://example.com')");
    expect(script).toContain("await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()");
    expect(script).toContain("await page.screenshot(");
  });

  it("generates fill steps with Playwright locators", () => {
    const script = exportAsPlaywrightScript({
      testName: "Login flow",
      baseUrl: "https://example.com/login",
      steps: [
        { action: "navigate", url: "https://example.com/login" },
        { action: "fill", playwrightLocator: "getByLabel('Email')", value: "jane@example.com" },
        { action: "fill", playwrightLocator: "getByLabel('Password')", value: "secret123" },
        { action: "click", playwrightLocator: "getByRole('button', { name: 'Sign In' })" },
      ],
    });
    expect(script).toContain("await page.getByLabel('Email').fill('jane@example.com')");
    expect(script).toContain("await page.getByLabel('Password').fill('secret123')");
    expect(script).toContain("await page.getByRole('button', { name: 'Sign In' }).click()");
  });

  it("handles scoped locators", () => {
    const script = exportAsPlaywrightScript({
      testName: "Radio selection",
      baseUrl: "https://example.com",
      steps: [
        { action: "navigate", url: "https://example.com" },
        {
          action: "click",
          playwrightLocator: "getByRole('radio', { name: 'Express' })",
          playwrightScopeChain: "getByRole('group', { name: 'Shipping' })",
        },
      ],
    });
    expect(script).toContain(
      "await page.getByRole('group', { name: 'Shipping' }).getByRole('radio', { name: 'Express' }).click()"
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run test src/generation/playwright-export.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the export function**

Create `src/generation/playwright-export.ts`:

```typescript
export interface PlaywrightTestStep {
  action: "navigate" | "fill" | "click" | "select" | "assertVisible" | "screenshot" | "waitForLoad";
  url?: string;
  playwrightLocator?: string;
  playwrightScopeChain?: string;
  value?: string;
  label?: string;
}

export interface PlaywrightTestInput {
  testName: string;
  baseUrl: string;
  steps: PlaywrightTestStep[];
}

export function exportAsPlaywrightScript(input: PlaywrightTestInput): string {
  const lines: string[] = [
    "import { test, expect } from '@playwright/test';",
    "",
    `test('${escapeSingleQuotes(input.testName)}', async ({ page }) => {`,
  ];

  for (const step of input.steps) {
    const locatorExpr = step.playwrightScopeChain
      ? `page.${step.playwrightScopeChain}.${step.playwrightLocator}`
      : step.playwrightLocator
        ? `page.${step.playwrightLocator}`
        : null;

    switch (step.action) {
      case "navigate":
        lines.push(`  await page.goto('${escapeSingleQuotes(step.url || input.baseUrl)}');`);
        break;
      case "waitForLoad":
        lines.push("  await page.waitForLoadState('networkidle');");
        break;
      case "fill":
        if (locatorExpr && step.value !== undefined) {
          lines.push(`  await ${locatorExpr}.fill('${escapeSingleQuotes(step.value)}');`);
        }
        break;
      case "click":
        if (locatorExpr) {
          lines.push(`  await ${locatorExpr}.click();`);
        }
        break;
      case "select":
        if (locatorExpr && step.value !== undefined) {
          lines.push(`  await ${locatorExpr}.selectOption('${escapeSingleQuotes(step.value)}');`);
        }
        break;
      case "assertVisible":
        if (locatorExpr) {
          lines.push(`  await expect(${locatorExpr}).toBeVisible();`);
        }
        break;
      case "screenshot":
        lines.push(
          `  await page.screenshot({ path: '${escapeSingleQuotes(step.label || "screenshot")}.png', fullPage: true });`
        );
        break;
    }
  }

  lines.push("});");
  lines.push("");
  return lines.join("\n");
}

function escapeSingleQuotes(s: string): string {
  return s.replace(/'/g, "\\'");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/johnhuang/projects/testomniac_runner_service && bun run test src/generation/playwright-export.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Run full verify and commit**

```bash
cd /Users/johnhuang/projects/testomniac_runner_service && bun run verify
git add src/generation/playwright-export.ts src/generation/playwright-export.test.ts
git commit -m "feat: add Playwright test script export generator"
```

---

## Summary

| Task | Repo | What it does |
|------|------|-------------|
| 1 | types | `ElementIdentity`, `LocatorStrategy`, `resolvePlaywrightRole()` |
| 2 | types | `CreateElementIdentityRequest`, `ElementIdentityResponse`, publish |
| 3 | api | `element_identities` table + `elementIdentityId` FK on `actionable_items` |
| 4 | api | Scanner CRUD: POST find-or-create, GET list, PATCH update |
| 5 | api | User-facing GET `/runs/:runId/element-identities` |
| 6 | scanning | DOM snapshot extracts groupName, headingContext, landmarkAncestor, testId, formContext |
| 7 | scanning | `toPlaywrightLocator()` + `buildScopeChain()` with full test coverage |
| 8 | scanning | `matchElementIdentity()` — multi-signal scoring algorithm |
| 9 | scanning | API client methods + `IdentityCache` preloader |
| 10 | scanning | Wire it all together in mouse-scanning loop |
| 11 | scanning | `exportAsPlaywrightScript()` — generate real Playwright test files |
