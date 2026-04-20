# Web App Discovery & Test Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js system that discovers web app UI elements via action-driven scanning, generates AI-informed test cases, and executes them via Puppeteer.

**Architecture:** The scanner lives in its own project at `~/projects/testomniac_scanner`. It runs as a separate worker that polls PostgreSQL for pending runs and drives exhaustive mouseover → click traversal within configured traversal limits. AI generates personas and input values after mouse scanning. Template-based test generation produces JSON action sequences executed by a custom Puppeteer runner. The existing `testomniac_api` service remains the HTTP/SSE boundary for frontend clients.

**Tech Stack:** Node.js, TypeScript, Puppeteer-core, PostgreSQL, Drizzle ORM, OpenAI SDK, Hono, Pino, Vitest, @sudobility/entity_service, @sudobility/signic_sdk

## Planning Corrections

These changes supersede earlier parts of this implementation plan where they conflict.

1. API/runtime boundary
   - Keep `testomniac_api` as the existing `Hono` service.
   - Build the scanner in the separate `~/projects/testomniac_scanner` project as its own worker/service.
   - Do not embed Chromium orchestration in the API server.
2. State identity
   - A page state is identified by normalized URL + normalized HTML hash + actionable-item hash + visible overlay fingerprint.
   - Ignore transient values such as timestamps, CSRF/nonces, randomized IDs when detectable, and analytics/debug script noise.
3. Traversal guardrails
   - Same-origin only by default.
   - Skip logout links and obviously destructive actions.
   - Enforce caps for max actions per state, max repeated visits per state, max total actions per run, and max traversal depth.
4. Auth precedence
   - Use provided credentials first.
   - Fall back to Signic auto-registration only when sign-up is detected and permitted.
   - On failure, skip authenticated scanning and record an issue rather than blocking the run.
5. Pairwise scope
   - Apply pairwise only within one form and one starting page state.
   - Do not combine controls across unrelated forms or page states.
6. Prioritization
   - Deliver core scan/generate/execute flow before add-on plugins.
   - Phase 6 is optional and should not block MVP delivery.
7. Project creation model
   - A project may exist before login and may have `entityId = null`.
   - Anonymous home-page submissions create unclaimed projects and start scans.
   - Submitted optional email must match the registrable domain of the URL.
8. Duplicate URL handling
   - If normalized URL already exists on a claimed project, return claim/join guidance instead of creating a second project.
   - If normalized URL already exists on an unclaimed project, return claim guidance instead of creating a second project.
9. Anonymous progress UX
   - Anonymous runs must expose a read-only status/progress experience, including latest screenshot metadata.
10. Admin visibility
   - Site admins in `testomniac_api` must be able to list all unclaimed projects.
11. Shared type ownership
   - `testomniac_api`, `testomniac_scanner`, and `testomniac_client` must share domain and API contract types through `testomniac_types`.
   - Do not create duplicate source-of-truth models for persisted entities or API payloads inside those projects.

## Execution Rules

These rules apply across all tasks and phases:

1. Library publication/update rule
   - Whenever a library project is modified and is ready to be consumed by an upper-level library or app, run `/testomniac_app/scripts/push_all.sh`.
   - This deploys the lower-level package and updates dependencies in upper libraries and the app.
2. End-of-phase verification rule
   - After each phase, verify that `bun run dev` starts without errors in both:
     - `/testomniac_api`
     - `/testomniac_app`
   - A phase is not complete until both checks pass.
3. Project boundary rule
   - Scanner implementation work belongs in `~/projects/testomniac_scanner`.
   - API integration work belongs in `/testomniac_api`.
   - Frontend integration work belongs in `/testomniac_app`.
4. Shared-contract rule
   - When a type is used across scanner, API, and client boundaries, define it in `testomniac_types` first and consume it from there.
5. Deployment compatibility rule
   - `testomniac_scanner` must include a Docker container setup compatible with deployment from `~/projects/sudobility_dockerized`.
6. Phase completion tracking rule
   - After completing all tasks in a phase and passing verification, update this plan file to mark the phase as completed (e.g., change `## Phase N:` to `## Phase N: ✅ COMPLETED`) and check off all task/step checkboxes within that phase.
   - This keeps the plan file as the single source of truth for progress across sessions.

---

## File Map

This file map is for the `~/projects/testomniac_scanner` project unless noted otherwise.

```
src/
  domain/types.ts                  — Scanner-internal helper types only; shared contracts belong in testomniac_types
  config/index.ts                  — Env config loader
  config/constants.ts              — Defaults, timeouts, screen definitions, email patterns
  db/schema.ts                     — Drizzle table definitions (projects, apps, ai_usage, test_runs, etc.)
  db/connection.ts                 — DB connection pool
  db/repositories/projects.ts      — projects table queries, duplicate URL lookup, claimability checks
  db/repositories/apps.ts          — apps table queries
  db/repositories/pages.ts         — pages table queries
  db/repositories/page-states.ts   — page_states table queries
  db/repositories/actionable-items.ts — actionable_items queries
  db/repositories/actions.ts       — actions table queries (with duration tracking)
  db/repositories/runs.ts          — runs table queries (with per-phase timing)
  db/repositories/personas.ts      — personas + use_cases + input_values queries
  db/repositories/test-cases.ts    — test_cases queries
  db/repositories/test-runs.ts     — test_runs queries (replaces test-results)
  db/repositories/issues.ts        — issues queries (linked to test_runs)
  db/repositories/ai-usage.ts      — ai_usage token tracking queries
  db/repositories/report-emails.ts — report_emails queries
  browser/chromium.ts              — Launch/close browser, persistent profile
  browser/page-utils.ts            — Hash computation, screenshot, wait helpers
  scanner/extractor.ts             — page.evaluate() for elements, forms
  scanner/action-queue.ts          — Open action CRUD, next action selection
  scanner/state-manager.ts         — Track current state, navigate to target
  scanner/mouse-scanner.ts         — Phase 1a orchestrator (with per-action timing)
  scanner/issue-detector.ts        — Dead click, error, console, network detection
  scanner/email-detector.ts        — Detect email hints before/after form submission
  scanner/email-checker.ts         — Execute check_email: poll Signic, extract OTP/link
  scanner/pairwise.ts              — Pairwise combination generator
  scanner/input-scanner.ts         — Phase 1c orchestrator
  scanner/phase-timer.ts           — Per-phase duration tracking
  scanner/scroll-scanner.ts        — Scroll-to-bottom for lazy-loaded elements
  scanner/loop-guard.ts            — Action signature dedup, max limits
  scanner/component-detector.ts    — Detect reusable components across pages
  db/repositories/components.ts    — components + component_instances queries
  auth/form-identifier.ts          — Login vs sign-up heuristics
  auth/credential-manager.ts       — Store/retrieve credentials and Signic client
  auth/login-executor.ts           — Fill login form, handle 2FA
  auth/signic-registrar.ts         — Auto-register via Signic SDK
  auth/password-detector.ts        — Detect password requirements, generate test cases
  ai/analyzer.ts                   — Phase 1b orchestrator
  ai/persona-generator.ts          — OpenAI: generate personas
  ai/use-case-generator.ts         — OpenAI: generate use cases
  ai/input-generator.ts            — OpenAI: generate input values
  ai/token-tracker.ts              — Record prompt/completion tokens per AI call
  generation/generator.ts          — Test case generation orchestrator
  generation/render.ts             — Render test template
  generation/interaction.ts        — Mouseover+click test template
  generation/form.ts               — Form test template (positive)
  generation/form-negative.ts      — Form negative test template (missing required, invalid format)
  generation/password.ts           — Password requirement test template
  generation/navigation.ts         — Navigation test template
  generation/e2e.ts                — E2E path enumeration + template
  generation/suite-tagger.ts       — Priority and suite tag assignment
  runner/executor.ts               — JSON action interpreter (including check_email)
  runner/worker-pool.ts            — Concurrent execution, creates Test Runs
  runner/reporter.ts               — Aggregate results from Test Runs
  email/templates.ts               — HTML + text email
  email/sender.ts                  — Postmark client
  email/deep-link.ts               — Token sign/verify
  api/contract.ts                  — Scanner-local wrappers/re-exports around shared contract types from testomniac_types
  domain/url-ownership.ts          — URL normalization, registrable-domain matching, ownership decision helpers
  worker/index.ts                  — Scanner worker entrypoint; polls pending runs and orchestrates phases
  plugins/types.ts                 — Plugin interface, PluginContext, PluginResult
  plugins/registry.ts              — Plugin registration and lookup
  plugins/seo/index.ts             — SEO check plugin
  plugins/seo/checks.ts            — Individual SEO check functions
  plugins/security/index.ts        — Security check plugin
  plugins/security/header-checks.ts — HTTP security header checks
  plugins/security/network-checks.ts — API keys in URLs/headers/responses
  plugins/security/html-checks.ts  — Mixed content, CSRF, exposed secrets
  plugins/content/index.ts         — Content check plugin
  plugins/content/checks.ts        — Placeholder, readability, broken links
  plugins/content/ai-checks.ts     — Spelling, grammar, terminology (AI)
  plugins/ui-consistency/index.ts  — UI consistency check plugin
  plugins/ui-consistency/style-extractor.ts — Extract computed styles per page
  plugins/ui-consistency/comparator.ts — Cross-page style deviation detection
  orchestrator.ts                  — Wire all phases together (with phase timing; plugins optional)
tests/
  (mirrors src/ structure with .test.ts suffix)
drizzle/
  0001_initial.sql                 — Migration: all tables
drizzle.config.ts                  — Drizzle Kit config
package.json
tsconfig.json
.env.example
```

---

## Phase 1: Project Setup + Domain + DB -- COMPLETED

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `drizzle.config.ts`
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Initialize project**

```bash
mkdir -p ~/projects/testomniac_scanner && cd ~/projects/testomniac_scanner
bun init -y
```

- [ ] **Step 2: Install dependencies**

```bash
bun add puppeteer-core typescript drizzle-orm postgres pino hono openai jose postmark @sudobility/signic_sdk @sudobility/entity_service
bun add -D vitest @types/node drizzle-kit tsx
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create .env.example**

```
DATABASE_URL=postgres://localhost:5432/testomniac
OPENAI_API_KEY=
POSTMARK_SERVER_TOKEN=
POSTMARK_FROM_EMAIL=
DEEP_LINK_SECRET=
APP_BASE_URL=http://localhost:3000
SIGNIC_INDEXER_URL=https://api.signic.email/idx
SIGNIC_WILDDUCK_URL=https://api.signic.email/api
CHROMIUM_PATH=/usr/bin/chromium
USER_DATA_DIR=./browser-profile
ARTIFACT_DIR=./artifacts
```

- [ ] **Step 5: Create drizzle.config.ts**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 6: Add scripts to package.json**

Add to `scripts`:
```json
{
  "build": "tsc",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "dev": "tsx src/worker/index.ts"
}
```

- [ ] **Step 7: Commit**

- [ ] **Step 7a: Add Docker container support**

Create `Dockerfile` and `.dockerignore` in `testomniac_scanner`.

Requirements:
- compatible with deployment from `~/projects/sudobility_dockerized`
- supports private NPM installs through `NPM_TOKEN`
- exposes a health endpoint for container health checks
- runs the scanner service with Bun in production

- [ ] **Step 8: Commit**

```bash
git init
git add package.json tsconfig.json .env.example drizzle.config.ts Dockerfile .dockerignore
git commit -m "chore: project scaffolding"
```

---

### Task 2: Shared Domain Types

**Files:**
- Create/Modify in `testomniac_types`: shared domain models and enums
- Create local scanner wrappers only if needed
- Test: shared type exports in `testomniac_types`

- [ ] **Step 1: Write the test**

```ts
// tests/domain/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  SizeClass,
  ActionType,
  ActionStatus,
  IssueType,
  DESKTOP_SCREENS,
  MOBILE_SCREENS,
} from '../src/domain/types.js';

describe('domain types', () => {
  it('SizeClass has desktop and mobile', () => {
    expect(SizeClass.Desktop).toBe('desktop');
    expect(SizeClass.Mobile).toBe('mobile');
  });

  it('ActionType has all interaction types', () => {
    expect(ActionType.Navigate).toBe('navigate');
    expect(ActionType.Mouseover).toBe('mouseover');
    expect(ActionType.Click).toBe('click');
    expect(ActionType.Fill).toBe('fill');
    expect(ActionType.Select).toBe('select');
    expect(ActionType.Check).toBe('check');
    expect(ActionType.Toggle).toBe('toggle');
    expect(ActionType.CheckEmail).toBe('check_email');
  });

  it('ActionStatus has open and completed', () => {
    expect(ActionStatus.Open).toBe('open');
    expect(ActionStatus.Completed).toBe('completed');
  });

  it('IssueType has all error types', () => {
    expect(IssueType.DeadClick).toBe('dead_click');
    expect(IssueType.ErrorOnPage).toBe('error_on_page');
    expect(IssueType.ConsoleError).toBe('console_error');
    expect(IssueType.NetworkError).toBe('network_error');
    expect(IssueType.EmailNotReceived).toBe('email_not_received');
  });

  it('DESKTOP_SCREENS has common resolutions', () => {
    expect(DESKTOP_SCREENS.length).toBeGreaterThanOrEqual(3);
    expect(DESKTOP_SCREENS[0]).toEqual({ name: '1920x1080', width: 1920, height: 1080 });
  });

  it('MOBILE_SCREENS has common resolutions', () => {
    expect(MOBILE_SCREENS.length).toBeGreaterThanOrEqual(3);
    expect(MOBILE_SCREENS[0]).toEqual({ name: '390x844', width: 390, height: 844 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/domain/types.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement shared domain types in `testomniac_types`**

```ts
// testomniac_types/src/models + enums

// --- Enums ---

export const SizeClass = {
  Desktop: 'desktop',
  Mobile: 'mobile',
} as const;
export type SizeClass = (typeof SizeClass)[keyof typeof SizeClass];

export const ActionType = {
  Navigate: 'navigate',
  Mouseover: 'mouseover',
  Click: 'click',
  Fill: 'fill',
  Select: 'select',
  Check: 'check',
  Toggle: 'toggle',
  CheckEmail: 'check_email',
} as const;
export type ActionType = (typeof ActionType)[keyof typeof ActionType];

export const ActionStatus = {
  Open: 'open',
  Completed: 'completed',
} as const;
export type ActionStatus = (typeof ActionStatus)[keyof typeof ActionStatus];

export const IssueType = {
  DeadClick: 'dead_click',
  ErrorOnPage: 'error_on_page',
  ConsoleError: 'console_error',
  NetworkError: 'network_error',
  EmailNotReceived: 'email_not_received',
} as const;
export type IssueType = (typeof IssueType)[keyof typeof IssueType];

export const TestType = {
  Render: 'render',
  Interaction: 'interaction',
  Form: 'form',
  Navigation: 'navigation',
  E2E: 'e2e',
} as const;
export type TestType = (typeof TestType)[keyof typeof TestType];

// --- Screen Definitions ---

export interface Screen {
  name: string;
  width: number;
  height: number;
}

export const DESKTOP_SCREENS: Screen[] = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1536x864', width: 1536, height: 864 },
];

export const MOBILE_SCREENS: Screen[] = [
  { name: '390x844', width: 390, height: 844 },
  { name: '360x800', width: 360, height: 800 },
  { name: '414x896', width: 414, height: 896 },
];

// --- Data Types ---

export interface ActionableItem {
  stableKey: string;
  selector: string;
  tagName: string;
  role?: string;
  inputType?: string;
  actionKind: 'click' | 'fill' | 'toggle' | 'select' | 'navigate';
  accessibleName?: string;
  textContent?: string;
  href?: string;
  disabled: boolean;
  visible: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  attributes: Record<string, unknown>;
}

export interface FormField {
  selector: string;
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormInfo {
  selector: string;
  action: string;
  method: string;
  fields: FormField[];
  submitSelector?: string;
  fieldCount: number;
}

export interface PageHashes {
  htmlHash: string;
  normalizedHtmlHash: string;
  textHash: string;
  actionableHash: string;
}

export interface NetworkLogEntry {
  method: string;
  url: string;
  status: number;
  contentType: string;
}

export interface TestAction {
  action: string;
  url?: string;
  selector?: string;
  value?: string;
  pattern?: string;
  label?: string;
  direction?: string;
  amount?: number;
}

export interface TestCase {
  name: string;
  type: TestType;
  sizeClass: SizeClass;
  suite_tags: string[];
  page_id?: number;
  persona_id?: number;
  use_case_id?: number;
  priority: string;
  actions: TestAction[];
}

export interface Credentials {
  email?: string;
  username?: string;
  password: string;
  twoFactorCode?: string;
}
```

The scanner should import these from `testomniac_types` rather than owning the source-of-truth definitions locally.

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/domain/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/domain/types.test.ts
git commit -m "feat: shared domain types and enums in testomniac_types"
```

---

### Task 3: Config

**Files:**
- Create: `src/config/index.ts`
- Create: `src/config/constants.ts`
- Test: `tests/config/index.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/config/index.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig } from '../src/config/index.js';

describe('config', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/test';
    process.env.DEEP_LINK_SECRET = 'test-secret';
  });

  it('loads required config from env', () => {
    const config = loadConfig();
    expect(config.databaseUrl).toBe('postgres://localhost:5432/test');
    expect(config.deepLinkSecret).toBe('test-secret');
  });

  it('uses defaults for optional values', () => {
    const config = loadConfig();
    expect(config.artifactDir).toBe('./artifacts');
    expect(config.userDataDir).toBe('./browser-profile');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/config/index.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement config**

```ts
// src/config/index.ts
export interface Config {
  databaseUrl: string;
  openaiApiKey: string;
  postmarkServerToken: string;
  postmarkFromEmail: string;
  deepLinkSecret: string;
  appBaseUrl: string;
  signicIndexerUrl: string;
  signicWildduckUrl: string;
  chromiumPath: string;
  userDataDir: string;
  artifactDir: string;
}

export function loadConfig(): Config {
  return {
    databaseUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/testomniac',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    postmarkServerToken: process.env.POSTMARK_SERVER_TOKEN || '',
    postmarkFromEmail: process.env.POSTMARK_FROM_EMAIL || '',
    deepLinkSecret: process.env.DEEP_LINK_SECRET || '',
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    signicIndexerUrl: process.env.SIGNIC_INDEXER_URL || 'https://api.signic.email/idx',
    signicWildduckUrl: process.env.SIGNIC_WILDDUCK_URL || 'https://api.signic.email/api',
    chromiumPath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    userDataDir: process.env.USER_DATA_DIR || './browser-profile',
    artifactDir: process.env.ARTIFACT_DIR || './artifacts',
  };
}
```

```ts
// src/config/constants.ts
export const SCAN_TIMEOUT_MS = 300_000;
export const ACTION_TIMEOUT_MS = 10_000;
export const TEST_TIMEOUT_MS = 30_000;
export const NETWORK_IDLE_TIMEOUT_MS = 5_000;
export const DEFAULT_WORKERS = 3;
export const MAX_PAGE_LIMIT = 100;
export const MAX_E2E_PATHS = 20;
export const MAX_E2E_DEPTH = 6;
export const SCREENSHOT_QUALITY = 72;
export const HOVER_DELAY_MS = 150;

export const AUTH_URL_PATTERNS = [
  '/login', '/log-in', '/signin', '/sign-in', '/auth',
];

export const SIGNUP_URL_PATTERNS = [
  '/signup', '/sign-up', '/register', '/create-account', '/join', '/get-started',
];

export const SIGNUP_TEXT_PATTERNS = [
  'sign up', 'signup', 'register', 'create account', 'join', 'get started',
];

export const LOGIN_TEXT_PATTERNS = [
  'log in', 'login', 'sign in', 'signin',
];

export const HIGH_PRIORITY_KEYWORDS = [
  'login', 'signin', 'signup', 'register', 'checkout', 'payment',
  'cart', 'settings', 'admin', 'dashboard', 'account', 'profile', 'auth',
];

export const ERROR_TEXT_PATTERNS = [
  'error', 'failed', 'something went wrong', 'not found',
  '500', '404', 'oops', 'unexpected', 'try again',
];

export const ERROR_SELECTORS = [
  '[role="alert"]', '.error', '.alert-danger', '.alert-error',
  '[data-error]', '.error-message', '.toast-error',
];

export const CONSOLE_NOISE_PATTERNS = [
  /favicon\.ico/i,
  /deprecated/i,
  /third.party/i,
];

export const EMAIL_HINT_PATTERNS = [
  "we'll send you", 'check your email', 'verification email',
  'confirm your email', "we'll email you", "you'll receive an email",
  'enter your email to receive',
];

export const EMAIL_CONFIRMATION_PATTERNS = [
  'email sent', 'check your inbox', "we've sent",
  'verification link sent', 'please check your email',
  'confirmation email',
];

export const EMAIL_CHECK_TIMEOUT_MS = 60_000;
export const EMAIL_CHECK_INTERVAL_MS = 2_000;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/config/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/ tests/config/
git commit -m "feat: config loader and constants"
```

---

### Task 4: Database Schema

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/connection.ts`

- [ ] **Step 1: Implement Drizzle schema**

```ts
// src/db/schema.ts
import { pgTable, bigserial, text, boolean, doublePrecision, integer, jsonb, timestamp, char } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  entityId: text('entity_id'),
  name: text('name').notNull(),
  description: text('description'),
  contactEmail: text('contact_email'),
  claimedByUserId: text('claimed_by_user_id'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const apps = pgTable('apps', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  projectId: bigserial('project_id', { mode: 'number' }).references(() => projects.id).notNull(),
  name: text('name').notNull(),
  baseUrl: text('base_url'),
  normalizedBaseUrl: text('normalized_base_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const personas = pgTable('personas', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  appId: bigserial('app_id', { mode: 'number' }).references(() => apps.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const useCases = pgTable('use_cases', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  personaId: bigserial('persona_id', { mode: 'number' }).references(() => personas.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const inputValues = pgTable('input_values', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  useCaseId: bigserial('use_case_id', { mode: 'number' }).references(() => useCases.id),
  fieldSelector: text('field_selector').notNull(),
  fieldName: text('field_name'),
  value: text('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const pages = pgTable('pages', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  appId: bigserial('app_id', { mode: 'number' }).references(() => apps.id),
  url: text('url').notNull(),
  routeKey: text('route_key'),
  requiresLogin: boolean('requires_login').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const pageStates = pgTable('page_states', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  pageId: bigserial('page_id', { mode: 'number' }).references(() => pages.id),
  sizeClass: text('size_class').notNull().default('desktop'),
  htmlHash: char('html_hash', { length: 64 }),
  normalizedHtmlHash: char('normalized_html_hash', { length: 64 }),
  textHash: char('text_hash', { length: 64 }),
  actionableHash: char('actionable_hash', { length: 64 }),
  createdByActionId: bigserial('created_by_action_id', { mode: 'number' }),
  screenshotPath: text('screenshot_path'),
  rawHtmlPath: text('raw_html_path'),
  contentText: text('content_text'),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow(),
});

export const forms = pgTable('forms', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  pageStateId: bigserial('page_state_id', { mode: 'number' }).references(() => pageStates.id),
  selector: text('selector').notNull(),
  action: text('action'),
  method: text('method').default('GET'),
  submitSelector: text('submit_selector'),
  fieldCount: integer('field_count').default(0),
  formType: text('form_type'),
  fieldsJson: jsonb('fields_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const components = pgTable('components', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  appId: bigserial('app_id', { mode: 'number' }).references(() => apps.id),
  name: text('name').notNull(),
  selector: text('selector').notNull(),
  htmlHash: char('html_hash', { length: 64 }).notNull(),
  canonicalPageStateId: bigserial('canonical_page_state_id', { mode: 'number' }).references(() => pageStates.id),
  sizeClass: text('size_class').notNull().default('desktop'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const componentInstances = pgTable('component_instances', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  componentId: bigserial('component_id', { mode: 'number' }).references(() => components.id),
  pageStateId: bigserial('page_state_id', { mode: 'number' }).references(() => pageStates.id),
  isIdentical: boolean('is_identical').default(true),
  htmlHash: char('html_hash', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const actionableItems = pgTable('actionable_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  pageStateId: bigserial('page_state_id', { mode: 'number' }).references(() => pageStates.id),
  stableKey: text('stable_key'),
  selector: text('selector'),
  tagName: text('tag_name'),
  role: text('role'),
  actionKind: text('action_kind'),
  accessibleName: text('accessible_name'),
  disabled: boolean('disabled'),
  visible: boolean('visible'),
  x: doublePrecision('x'),
  y: doublePrecision('y'),
  width: doublePrecision('width'),
  height: doublePrecision('height'),
  attributesJson: jsonb('attributes_json'),
});

export const runs = pgTable('runs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  appId: bigserial('app_id', { mode: 'number' }).references(() => apps.id),
  status: text('status').notNull().default('running'),
  phase: text('phase').notNull().default('mouse_scanning'),
  sizeClass: text('size_class').notNull().default('desktop'),
  pagesFound: integer('pages_found').default(0),
  pageStatesFound: integer('page_states_found').default(0),
  actionsCompleted: integer('actions_completed').default(0),
  aiSummary: text('ai_summary'),
  totalDurationMs: integer('total_duration_ms'),
  mouseScanningDurationMs: integer('mouse_scanning_duration_ms'),
  aiAnalysisDurationMs: integer('ai_analysis_duration_ms'),
  inputScanningDurationMs: integer('input_scanning_duration_ms'),
  authScanningDurationMs: integer('auth_scanning_duration_ms'),
  testGenerationDurationMs: integer('test_generation_duration_ms'),
  testExecutionDurationMs: integer('test_execution_duration_ms'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

export const actions = pgTable('actions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  runId: bigserial('run_id', { mode: 'number' }).references(() => runs.id),
  type: text('type').notNull(),
  actionableItemId: bigserial('actionable_item_id', { mode: 'number' }).references(() => actionableItems.id),
  startingPageStateId: bigserial('starting_page_state_id', { mode: 'number' }).references(() => pageStates.id),
  targetPageId: bigserial('target_page_id', { mode: 'number' }).references(() => pages.id),
  targetPageStateId: bigserial('target_page_state_id', { mode: 'number' }).references(() => pageStates.id),
  personaId: bigserial('persona_id', { mode: 'number' }).references(() => personas.id),
  useCaseId: bigserial('use_case_id', { mode: 'number' }).references(() => useCases.id),
  inputValue: text('input_value'),
  status: text('status').notNull().default('open'),
  sizeClass: text('size_class').notNull().default('desktop'),
  durationMs: integer('duration_ms'),
  screenshotBefore: text('screenshot_before'),
  screenshotAfter: text('screenshot_after'),
  consoleLog: text('console_log'),
  networkLog: text('network_log'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  executedAt: timestamp('executed_at', { withTimezone: true }),
});

export const testCases = pgTable('test_cases', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  runId: bigserial('run_id', { mode: 'number' }).references(() => runs.id),
  name: text('name').notNull(),
  testType: text('test_type').notNull(),
  sizeClass: text('size_class').notNull().default('desktop'),
  suiteTags: text('suite_tags').array().notNull().default([]),
  pageId: bigserial('page_id', { mode: 'number' }).references(() => pages.id),
  personaId: bigserial('persona_id', { mode: 'number' }).references(() => personas.id),
  useCaseId: bigserial('use_case_id', { mode: 'number' }).references(() => useCases.id),
  priority: text('priority').notNull().default('normal'),
  actionsJson: jsonb('actions_json').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
});

export const testRuns = pgTable('test_runs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  testCaseId: bigserial('test_case_id', { mode: 'number' }).references(() => testCases.id),
  runId: bigserial('run_id', { mode: 'number' }).references(() => runs.id),
  screen: text('screen').notNull(),
  status: text('status').notNull().default('running'),
  durationMs: integer('duration_ms').default(0),
  errorMessage: text('error_message'),
  screenshotPath: text('screenshot_path'),
  consoleLog: text('console_log'),
  networkLog: text('network_log'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const issues = pgTable('issues', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  runId: bigserial('run_id', { mode: 'number' }).references(() => runs.id),
  actionId: bigserial('action_id', { mode: 'number' }).references(() => actions.id),
  testCaseId: bigserial('test_case_id', { mode: 'number' }).references(() => testCases.id),
  testRunId: bigserial('test_run_id', { mode: 'number' }).references(() => testRuns.id),
  type: text('type').notNull(),
  description: text('description').notNull(),
  reproductionSteps: jsonb('reproduction_steps').notNull(),
  consoleLog: text('console_log'),
  networkLog: text('network_log'),
  screenshotPath: text('screenshot_path'),
  pageId: bigserial('page_id', { mode: 'number' }).references(() => pages.id),
  pageStateId: bigserial('page_state_id', { mode: 'number' }).references(() => pageStates.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const aiUsage = pgTable('ai_usage', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  runId: bigserial('run_id', { mode: 'number' }).references(() => runs.id),
  phase: text('phase').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  purpose: text('purpose'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const reportEmails = pgTable('report_emails', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  runId: bigserial('run_id', { mode: 'number' }).references(() => runs.id),
  userEmail: text('user_email').notNull(),
  deepLinkToken: text('deep_link_token').unique(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
});
```

```ts
// src/db/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadConfig } from '../config/index.js';
import * as schema from './schema.js';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    const config = loadConfig();
    const client = postgres(config.databaseUrl);
    db = drizzle(client, { schema });
  }
  return db;
}
```

- [ ] **Step 2: Generate migration**

Run: `bunx drizzle-kit generate`
Expected: Migration SQL file created in `drizzle/`

- [ ] **Step 3: Commit**

```bash
git add src/db/ drizzle/
git commit -m "feat: database schema and connection"
```

---

### Task 5: Repositories — Core Tables

**Files:**
- Create: `src/db/repositories/apps.ts`
- Create: `src/db/repositories/pages.ts`
- Create: `src/db/repositories/page-states.ts`
- Create: `src/db/repositories/actionable-items.ts`
- Create: `src/db/repositories/actions.ts`
- Create: `src/db/repositories/runs.ts`
- Test: `tests/db/repositories/actions.test.ts`

- [ ] **Step 1: Write test for action queue queries**

```ts
// tests/db/repositories/actions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildNextOpenActionQuery, buildCreateActionParams } from '../src/db/repositories/actions.js';

describe('actions repository helpers', () => {
  it('buildCreateActionParams builds correct insert params', () => {
    const params = buildCreateActionParams({
      runId: 1,
      type: 'mouseover',
      actionableItemId: 5,
      startingPageStateId: 3,
      sizeClass: 'desktop',
    });
    expect(params.runId).toBe(1);
    expect(params.type).toBe('mouseover');
    expect(params.status).toBe('open');
    expect(params.sizeClass).toBe('desktop');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/db/repositories/actions.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement repositories**

```ts
// src/db/repositories/apps.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { apps } from '../schema.js';

export async function createApp(name: string, baseUrl: string) {
  const db = getDb();
  const [app] = await db.insert(apps).values({ name, baseUrl }).returning();
  return app;
}

export async function getApp(id: number) {
  const db = getDb();
  return db.query.apps.findFirst({ where: eq(apps.id, id) });
}
```

```ts
// src/db/repositories/pages.ts
import { eq, and } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { pages } from '../schema.js';

export async function findOrCreatePage(appId: number, url: string) {
  const db = getDb();
  const existing = await db.query.pages.findFirst({
    where: and(eq(pages.appId, appId), eq(pages.url, url)),
  });
  if (existing) return existing;
  const [page] = await db.insert(pages).values({ appId, url, routeKey: new URL(url).pathname }).returning();
  return page;
}

export async function markRequiresLogin(pageId: number) {
  const db = getDb();
  await db.update(pages).set({ requiresLogin: true }).where(eq(pages.id, pageId));
}

export async function getPagesByApp(appId: number) {
  const db = getDb();
  return db.query.pages.findMany({ where: eq(pages.appId, appId) });
}
```

```ts
// src/db/repositories/page-states.ts
import { eq, and } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { pageStates } from '../schema.js';
import type { PageHashes } from '../../domain/types.js';

export async function findMatchingPageState(pageId: number, hashes: PageHashes, sizeClass: string) {
  const db = getDb();
  return db.query.pageStates.findFirst({
    where: and(
      eq(pageStates.pageId, pageId),
      eq(pageStates.sizeClass, sizeClass),
      eq(pageStates.htmlHash, hashes.htmlHash),
      eq(pageStates.normalizedHtmlHash, hashes.normalizedHtmlHash),
      eq(pageStates.textHash, hashes.textHash),
      eq(pageStates.actionableHash, hashes.actionableHash),
    ),
  });
}

export async function createPageState(
  pageId: number,
  sizeClass: string,
  hashes: PageHashes,
  screenshotPath?: string,
  rawHtmlPath?: string,
  contentText?: string,
) {
  const db = getDb();
  const [state] = await db.insert(pageStates).values({
    pageId,
    sizeClass,
    htmlHash: hashes.htmlHash,
    normalizedHtmlHash: hashes.normalizedHtmlHash,
    textHash: hashes.textHash,
    actionableHash: hashes.actionableHash,
    screenshotPath,
    rawHtmlPath,
    contentText,
  }).returning();
  return state;
}
```

```ts
// src/db/repositories/actionable-items.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { actionableItems } from '../schema.js';
import type { ActionableItem } from '../../domain/types.js';

export async function insertActionableItems(pageStateId: number, items: ActionableItem[]) {
  const db = getDb();
  if (items.length === 0) return [];
  const rows = items.map((item) => ({
    pageStateId,
    stableKey: item.stableKey,
    selector: item.selector,
    tagName: item.tagName,
    role: item.role,
    actionKind: item.actionKind,
    accessibleName: item.accessibleName,
    disabled: item.disabled,
    visible: item.visible,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    attributesJson: item.attributes,
  }));
  return db.insert(actionableItems).values(rows).returning();
}

export async function getItemsByPageState(pageStateId: number) {
  const db = getDb();
  return db.query.actionableItems.findMany({ where: eq(actionableItems.pageStateId, pageStateId) });
}
```

```ts
// src/db/repositories/actions.ts
import { eq, and } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { actions } from '../schema.js';

interface CreateActionParams {
  runId: number;
  type: string;
  actionableItemId?: number;
  startingPageStateId?: number;
  targetPageId?: number;
  sizeClass: string;
  personaId?: number;
  useCaseId?: number;
  inputValue?: string;
}

export function buildCreateActionParams(params: CreateActionParams) {
  return {
    runId: params.runId,
    type: params.type,
    actionableItemId: params.actionableItemId,
    startingPageStateId: params.startingPageStateId,
    targetPageId: params.targetPageId,
    sizeClass: params.sizeClass,
    personaId: params.personaId,
    useCaseId: params.useCaseId,
    inputValue: params.inputValue,
    status: 'open' as const,
  };
}

export async function createAction(params: CreateActionParams) {
  const db = getDb();
  const values = buildCreateActionParams(params);
  const [action] = await db.insert(actions).values(values).returning();
  return action;
}

export async function getNextOpenAction(runId: number, sizeClass: string) {
  const db = getDb();
  return db.query.actions.findFirst({
    where: and(
      eq(actions.runId, runId),
      eq(actions.sizeClass, sizeClass),
      eq(actions.status, 'open'),
    ),
    orderBy: (actions, { asc }) => [asc(actions.id)],
  });
}

export async function startAction(actionId: number) {
  const db = getDb();
  await db.update(actions).set({ startedAt: new Date() }).where(eq(actions.id, actionId));
}

export async function completeAction(
  actionId: number,
  targetPageId?: number,
  targetPageStateId?: number,
  durationMs?: number,
  consoleLog?: string,
  networkLog?: string,
  screenshotBefore?: string,
  screenshotAfter?: string,
) {
  const db = getDb();
  await db.update(actions).set({
    status: 'completed',
    targetPageId,
    targetPageStateId,
    durationMs,
    consoleLog,
    networkLog,
    screenshotBefore,
    screenshotAfter,
    executedAt: new Date(),
  }).where(eq(actions.id, actionId));
}

export async function getOpenActionCount(runId: number, sizeClass: string) {
  const db = getDb();
  const result = await db.query.actions.findMany({
    where: and(
      eq(actions.runId, runId),
      eq(actions.sizeClass, sizeClass),
      eq(actions.status, 'open'),
    ),
  });
  return result.length;
}

export async function getActionChain(actionId: number): Promise<typeof actions.$inferSelect[]> {
  const db = getDb();
  const chain: typeof actions.$inferSelect[] = [];
  let current = await db.query.actions.findFirst({ where: eq(actions.id, actionId) });
  if (!current) return chain;

  // Walk back to the navigate action by following startingPageStateId
  // For now, collect all completed actions in this run in order up to this one
  const allActions = await db.query.actions.findMany({
    where: and(eq(actions.runId, current.runId), eq(actions.status, 'completed')),
    orderBy: (actions, { asc }) => [asc(actions.id)],
  });

  // Find the last navigate before this action, collect chain from there
  let startIdx = 0;
  const targetIdx = allActions.findIndex((a) => a.id === actionId);
  for (let i = targetIdx; i >= 0; i--) {
    if (allActions[i].type === 'navigate') {
      startIdx = i;
      break;
    }
  }
  return allActions.slice(startIdx, targetIdx + 1);
}
```

```ts
// src/db/repositories/runs.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { runs } from '../schema.js';

export async function createRun(appId: number, sizeClass: string) {
  const db = getDb();
  const [run] = await db.insert(runs).values({ appId, sizeClass }).returning();
  return run;
}

export async function updateRunPhase(runId: number, phase: string) {
  const db = getDb();
  await db.update(runs).set({ phase }).where(eq(runs.id, runId));
}

export async function updateRunStats(runId: number, stats: { pagesFound?: number; pageStatesFound?: number; actionsCompleted?: number }) {
  const db = getDb();
  await db.update(runs).set(stats).where(eq(runs.id, runId));
}

export async function completeRun(runId: number, aiSummary?: string) {
  const db = getDb();
  await db.update(runs).set({ status: 'completed', endedAt: new Date(), aiSummary }).where(eq(runs.id, runId));
}

export async function getRun(runId: number) {
  const db = getDb();
  return db.query.runs.findFirst({ where: eq(runs.id, runId) });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/db/repositories/actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/repositories/ tests/db/
git commit -m "feat: database repositories"
```

---

## Phase 2: Browser + Scanner Core -- COMPLETED

### Task 6: Browser Manager

**Files:**
- Create: `src/browser/chromium.ts`
- Create: `src/browser/page-utils.ts`
- Test: `tests/browser/page-utils.test.ts`

- [ ] **Step 1: Write test for hash computation**

```ts
// tests/browser/page-utils.test.ts
import { describe, it, expect } from 'vitest';
import { computeHashes, normalizeHtml } from '../src/browser/page-utils.js';

describe('page-utils', () => {
  it('computeHashes returns 4 hex strings', () => {
    const hashes = computeHashes('<html><body>Hello</body></html>', []);
    expect(hashes.htmlHash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashes.normalizedHtmlHash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashes.textHash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashes.actionableHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('normalizeHtml strips whitespace and sorts attributes', () => {
    const a = normalizeHtml('<div  class="a"  id="b" >  hello  </div>');
    const b = normalizeHtml('<div id="b" class="a">hello</div>');
    expect(a).toBe(b);
  });

  it('different content produces different hashes', () => {
    const a = computeHashes('<body>Page A</body>', []);
    const b = computeHashes('<body>Page B</body>', []);
    expect(a.textHash).not.toBe(b.textHash);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/browser/page-utils.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement browser modules**

```ts
// src/browser/page-utils.ts
import { createHash } from 'node:crypto';
import type { ActionableItem, PageHashes } from '../domain/types.js';

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function normalizeHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/\s*=\s*/g, '=')
    .replace(/<(\w+)\s+([^>]*)>/g, (_, tag, attrs) => {
      const sorted = attrs
        .trim()
        .split(/\s+/)
        .sort()
        .join(' ');
      return `<${tag} ${sorted}>`;
    })
    .trim();
}

function extractVisibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeHashes(html: string, actionableItems: ActionableItem[]): PageHashes {
  const normalized = normalizeHtml(html);
  const visibleText = extractVisibleText(html);
  const actionableKeys = actionableItems.map((i) => i.stableKey).sort().join('|');

  return {
    htmlHash: sha256(html),
    normalizedHtmlHash: sha256(normalized),
    textHash: sha256(visibleText),
    actionableHash: sha256(actionableKeys),
  };
}
```

```ts
// src/browser/chromium.ts
import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import type { Config } from '../config/index.js';
import type { Screen } from '../domain/types.js';

export class ChromiumManager {
  private browser: Browser | null = null;

  constructor(private config: Config) {}

  async launch(): Promise<Browser> {
    this.browser = await puppeteer.launch({
      executablePath: this.config.chromiumPath,
      userDataDir: this.config.userDataDir,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    return this.browser;
  }

  async newPage(screen?: Screen): Promise<Page> {
    if (!this.browser) throw new Error('Browser not launched');
    const page = await this.browser.newPage();
    if (screen) {
      await page.setViewport({ width: screen.width, height: screen.height });
    }
    return page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/browser/page-utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/browser/ tests/browser/
git commit -m "feat: browser manager and page utils"
```

---

### Task 7: Element Extractor

**Files:**
- Create: `src/scanner/extractor.ts`
- Test: `tests/scanner/extractor.test.ts`

- [ ] **Step 1: Write test for stable key generation**

```ts
// tests/scanner/extractor.test.ts
import { describe, it, expect } from 'vitest';
import { generateStableKey, ACTIONABLE_SELECTORS } from '../src/scanner/extractor.js';

describe('extractor', () => {
  it('generateStableKey produces consistent keys', () => {
    const key1 = generateStableKey('button', 'button', 'Submit', '#submit-btn');
    const key2 = generateStableKey('button', 'button', 'Submit', '#submit-btn');
    expect(key1).toBe(key2);
  });

  it('generateStableKey produces different keys for different elements', () => {
    const key1 = generateStableKey('button', 'button', 'Submit', '#submit');
    const key2 = generateStableKey('button', 'button', 'Cancel', '#cancel');
    expect(key1).not.toBe(key2);
  });

  it('ACTIONABLE_SELECTORS is a non-empty string', () => {
    expect(ACTIONABLE_SELECTORS).toContain('button');
    expect(ACTIONABLE_SELECTORS).toContain('[role="button"]');
    expect(ACTIONABLE_SELECTORS).toContain('a[href]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/scanner/extractor.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement extractor**

```ts
// src/scanner/extractor.ts
import { createHash } from 'node:crypto';
import type { Page } from 'puppeteer-core';
import type { ActionableItem, FormInfo } from '../domain/types.js';

export const ACTIONABLE_SELECTORS = [
  'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea', 'summary',
  '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
  '[role="switch"]', '[role="tab"]', '[role="menuitem"]', '[role="textbox"]',
  '[role="combobox"]', '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]',
].join(', ');

export function generateStableKey(tagName: string, role: string, accessibleName: string, selector: string): string {
  const input = `${tagName}|${role}|${accessibleName}|${selector}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function classifyActionKind(tagName: string, inputType?: string, href?: string): ActionableItem['actionKind'] {
  if (tagName === 'A' && href) return 'navigate';
  if (tagName === 'INPUT' && ['checkbox', 'radio'].includes(inputType || '')) return 'toggle';
  if (tagName === 'SELECT') return 'select';
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') return 'fill';
  return 'click';
}

export async function extractActionableItems(page: Page): Promise<ActionableItem[]> {
  return page.evaluate((selectors: string) => {
    function bestSelector(el: Element): string {
      if (el.id) return '#' + el.id;
      const testid = el.getAttribute('data-testid');
      if (testid) return `[data-testid="${testid}"]`;
      const name = el.getAttribute('name');
      if (name) return `[name="${name}"]`;
      return el.tagName.toLowerCase();
    }

    function isVisible(el: Element): boolean {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }

    const elements: any[] = [];
    document.querySelectorAll(selectors).forEach((el) => {
      const tag = el.tagName;
      const role = el.getAttribute('role') || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const text = el.textContent?.trim().slice(0, 80) || '';
      const name = ariaLabel || text;
      const rect = el.getBoundingClientRect();
      const href = el.getAttribute('href') || undefined;
      const inputType = (el as HTMLInputElement).type || undefined;
      const selector = bestSelector(el);

      elements.push({
        stableKey: '', // computed server-side
        selector,
        tagName: tag,
        role: role || undefined,
        inputType,
        actionKind: '', // computed server-side
        accessibleName: name || undefined,
        textContent: text || undefined,
        href,
        disabled: (el as HTMLButtonElement).disabled || false,
        visible: isVisible(el),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        attributes: {},
      });
    });
    return elements;
  }, ACTIONABLE_SELECTORS).then((items) =>
    items.map((item) => ({
      ...item,
      stableKey: generateStableKey(item.tagName, item.role || '', item.accessibleName || '', item.selector),
      actionKind: classifyActionKind(item.tagName, item.inputType, item.href),
    }))
  );
}

export async function extractForms(page: Page): Promise<FormInfo[]> {
  return page.evaluate(() => {
    function bestSelector(el: Element): string {
      if (el.id) return '#' + el.id;
      const name = el.getAttribute('name');
      if (name) return `[name="${name}"]`;
      return el.tagName.toLowerCase();
    }

    const forms: any[] = [];
    document.querySelectorAll('form').forEach((form, idx) => {
      const fields: any[] = [];
      form.querySelectorAll('input, textarea, select').forEach((el) => {
        const labelEl = (el as HTMLInputElement).id
          ? document.querySelector(`label[for="${(el as HTMLInputElement).id}"]`)
          : null;
        fields.push({
          selector: bestSelector(el),
          name: el.getAttribute('name') || '',
          type: (el as HTMLInputElement).type || el.tagName.toLowerCase(),
          label: el.getAttribute('aria-label') || el.getAttribute('placeholder') || labelEl?.textContent?.trim() || '',
          required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
          placeholder: el.getAttribute('placeholder') || undefined,
          options: el.tagName === 'SELECT'
            ? Array.from((el as HTMLSelectElement).options).map((o) => o.value)
            : undefined,
        });
      });
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
      forms.push({
        selector: form.id ? '#' + form.id : `form:nth-of-type(${idx + 1})`,
        action: form.getAttribute('action') || '',
        method: (form.getAttribute('method') || 'GET').toUpperCase(),
        fields,
        submitSelector: submitBtn ? bestSelector(submitBtn) : undefined,
        fieldCount: fields.length,
      });
    });
    return forms;
  });
}

export async function extractPageHtml(page: Page): Promise<string> {
  return page.content();
}

export async function extractVisibleText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText || '');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/scanner/extractor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scanner/extractor.ts tests/scanner/extractor.test.ts
git commit -m "feat: element and form extractor"
```

---

### Task 8: Issue Detector

**Files:**
- Create: `src/scanner/issue-detector.ts`
- Test: `tests/scanner/issue-detector.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/scanner/issue-detector.test.ts
import { describe, it, expect } from 'vitest';
import {
  detectDeadClick,
  detectErrorOnPage,
  detectConsoleErrors,
  detectNetworkErrors,
} from '../src/scanner/issue-detector.js';

describe('issue-detector', () => {
  it('detectDeadClick returns true when states match', () => {
    expect(detectDeadClick(5, 5)).toBe(true);
    expect(detectDeadClick(5, 6)).toBe(false);
  });

  it('detectDeadClick returns false when starting state is undefined', () => {
    expect(detectDeadClick(undefined, 5)).toBe(false);
  });

  it('detectErrorOnPage finds error text patterns', () => {
    const result = detectErrorOnPage('<div>Something went wrong</div>', '<div class="error">Oops</div>');
    expect(result).not.toBeNull();
    expect(result!.description).toContain('something went wrong');
  });

  it('detectErrorOnPage finds error HTML selectors', () => {
    const result = detectErrorOnPage('All good', '<div role="alert">Server error</div>');
    expect(result).not.toBeNull();
  });

  it('detectErrorOnPage returns null for clean pages', () => {
    const result = detectErrorOnPage('Welcome home', '<div>Hello world</div>');
    expect(result).toBeNull();
  });

  it('detectConsoleErrors filters noise', () => {
    const logs = [
      'Failed to load resource: favicon.ico',
      'TypeError: Cannot read property x of undefined',
      'Some deprecated API warning',
    ];
    const errors = detectConsoleErrors(logs, 'example.com');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('TypeError');
  });

  it('detectNetworkErrors catches same-domain 4xx', () => {
    const entries = [
      { method: 'GET', url: 'https://example.com/api/data', status: 404, contentType: 'application/json' },
      { method: 'GET', url: 'https://cdn.analytics.com/track', status: 404, contentType: 'text/html' },
    ];
    const errors = detectNetworkErrors(entries, 'example.com');
    expect(errors).toHaveLength(1);
    expect(errors[0].url).toContain('example.com');
  });

  it('detectNetworkErrors catches any-domain 5xx', () => {
    const entries = [
      { method: 'POST', url: 'https://other.com/webhook', status: 500, contentType: 'text/html' },
    ];
    const errors = detectNetworkErrors(entries, 'example.com');
    expect(errors).toHaveLength(1);
  });

  it('detectNetworkErrors ignores third-party 4xx', () => {
    const entries = [
      { method: 'GET', url: 'https://ads.tracker.com/pixel', status: 403, contentType: 'text/html' },
    ];
    const errors = detectNetworkErrors(entries, 'example.com');
    expect(errors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/scanner/issue-detector.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement issue detector**

```ts
// src/scanner/issue-detector.ts
import { ERROR_TEXT_PATTERNS, ERROR_SELECTORS, CONSOLE_NOISE_PATTERNS } from '../config/constants.js';
import type { NetworkLogEntry } from '../domain/types.js';

export function detectDeadClick(
  startingPageStateId: number | undefined,
  targetPageStateId: number | undefined,
): boolean {
  if (startingPageStateId === undefined || targetPageStateId === undefined) return false;
  return startingPageStateId === targetPageStateId;
}

export function detectErrorOnPage(
  visibleText: string,
  html: string,
): { description: string } | null {
  const lowerText = visibleText.toLowerCase();
  for (const pattern of ERROR_TEXT_PATTERNS) {
    if (lowerText.includes(pattern)) {
      return { description: `Page contains error text: "${pattern}" found in visible text` };
    }
  }

  for (const selector of ERROR_SELECTORS) {
    // Check if HTML contains elements matching error selectors
    const attrMatch = selector.match(/\[([^\]]+)\]/);
    const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);

    if (selector.startsWith('[role=')) {
      if (html.includes('role="alert"')) {
        return { description: 'Page contains element with role="alert"' };
      }
    } else if (classMatch) {
      const className = classMatch[1];
      if (html.includes(`class="${className}"`) || html.includes(`class="`) && html.includes(className)) {
        return { description: `Page contains element with class "${className}"` };
      }
    } else if (attrMatch) {
      if (html.includes(attrMatch[1])) {
        return { description: `Page contains element matching ${selector}` };
      }
    }
  }

  return null;
}

export function detectConsoleErrors(logs: string[], domain: string): string[] {
  return logs.filter((log) => {
    const lower = log.toLowerCase();
    // Must be an error-like message
    if (!lower.includes('error') && !lower.includes('typeerror') && !lower.includes('referenceerror') && !lower.includes('syntaxerror')) {
      return false;
    }
    // Filter known noise
    for (const pattern of CONSOLE_NOISE_PATTERNS) {
      if (pattern.test(log)) return false;
    }
    return true;
  });
}

export function detectNetworkErrors(
  entries: NetworkLogEntry[],
  domain: string,
): NetworkLogEntry[] {
  return entries.filter((entry) => {
    if (entry.status < 400) return false;
    const url = new URL(entry.url);
    const isSameDomain = url.hostname === domain || url.hostname.endsWith('.' + domain);
    // Same-domain: any status >= 400
    if (isSameDomain) return true;
    // Other domain: only 5xx
    if (entry.status >= 500) return true;
    return false;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/scanner/issue-detector.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scanner/issue-detector.ts tests/scanner/issue-detector.test.ts
git commit -m "feat: issue detector for dead clicks, page errors, console and network errors"
```

---

### Task 9: Action Queue + State Manager

**Files:**
- Create: `src/scanner/action-queue.ts`
- Create: `src/scanner/state-manager.ts`
- Test: `tests/scanner/action-queue.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/scanner/action-queue.test.ts
import { describe, it, expect } from 'vitest';
import { ActionQueue } from '../src/scanner/action-queue.js';

describe('ActionQueue', () => {
  it('starts empty', () => {
    const q = new ActionQueue();
    expect(q.hasOpen()).toBe(false);
    expect(q.next()).toBeUndefined();
  });

  it('adds and retrieves actions in order', () => {
    const q = new ActionQueue();
    q.add({ id: 1, type: 'navigate', status: 'open' });
    q.add({ id: 2, type: 'mouseover', status: 'open' });
    expect(q.hasOpen()).toBe(true);
    expect(q.next()!.id).toBe(1);
  });

  it('complete removes from open set', () => {
    const q = new ActionQueue();
    q.add({ id: 1, type: 'navigate', status: 'open' });
    q.complete(1);
    expect(q.hasOpen()).toBe(false);
  });

  it('skips completed actions when getting next', () => {
    const q = new ActionQueue();
    q.add({ id: 1, type: 'navigate', status: 'open' });
    q.add({ id: 2, type: 'mouseover', status: 'open' });
    q.complete(1);
    expect(q.next()!.id).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/scanner/action-queue.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement action queue and state manager**

```ts
// src/scanner/action-queue.ts

export interface QueuedAction {
  id: number;
  type: string;
  status: string;
  startingPageStateId?: number;
  actionableItemId?: number;
  [key: string]: unknown;
}

export class ActionQueue {
  private actions: QueuedAction[] = [];
  private completedIds = new Set<number>();

  add(action: QueuedAction): void {
    this.actions.push(action);
  }

  next(): QueuedAction | undefined {
    return this.actions.find((a) => !this.completedIds.has(a.id));
  }

  complete(id: number): void {
    this.completedIds.add(id);
  }

  hasOpen(): boolean {
    return this.actions.some((a) => !this.completedIds.has(a.id));
  }

  openCount(): number {
    return this.actions.filter((a) => !this.completedIds.has(a.id)).length;
  }
}
```

```ts
// src/scanner/state-manager.ts
import type { Page } from 'puppeteer-core';
import pino from 'pino';

const logger = pino({ name: 'state-manager' });

export class StateManager {
  private currentPageStateId: number | undefined;
  private currentUrl: string = '';

  getCurrentPageStateId(): number | undefined {
    return this.currentPageStateId;
  }

  getCurrentUrl(): string {
    return this.currentUrl;
  }

  update(pageStateId: number, url: string): void {
    this.currentPageStateId = pageStateId;
    this.currentUrl = url;
    logger.debug({ pageStateId, url }, 'state updated');
  }

  matches(targetPageStateId: number | undefined): boolean {
    if (targetPageStateId === undefined) return true;
    return this.currentPageStateId === targetPageStateId;
  }

  async navigateTo(page: Page, url: string): Promise<void> {
    logger.info({ url }, 'navigating to restore state');
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
    this.currentUrl = page.url();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/scanner/action-queue.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scanner/action-queue.ts src/scanner/state-manager.ts tests/scanner/action-queue.test.ts
git commit -m "feat: action queue and state manager"
```

---

### Task 10: Mouse Scanner (Phase 1a Orchestrator)

**Files:**
- Create: `src/scanner/mouse-scanner.ts`

- [ ] **Step 1: Implement mouse scanner**

```ts
// src/scanner/mouse-scanner.ts
import type { Page } from 'puppeteer-core';
import pino from 'pino';
import { extractActionableItems, extractForms, extractPageHtml, extractVisibleText } from './extractor.js';
import { computeHashes } from '../browser/page-utils.js';
import { StateManager } from './state-manager.js';
import { detectDeadClick, detectErrorOnPage, detectConsoleErrors, detectNetworkErrors } from './issue-detector.js';
import { HOVER_DELAY_MS } from '../config/constants.js';
import * as pagesRepo from '../db/repositories/pages.js';
import * as pageStatesRepo from '../db/repositories/page-states.js';
import * as itemsRepo from '../db/repositories/actionable-items.js';
import * as actionsRepo from '../db/repositories/actions.js';
import * as runsRepo from '../db/repositories/runs.js';
import type { NetworkLogEntry } from '../domain/types.js';
import type { SizeClass } from '../domain/types.js';

const logger = pino({ name: 'mouse-scanner' });

export interface MouseScannerOptions {
  appId: number;
  runId: number;
  baseUrl: string;
  sizeClass: SizeClass;
  onPageDiscovered?: (url: string, name: string) => void;
  onActionCompleted?: (type: string, selector: string, pageChanged: boolean) => void;
  onIssueDetected?: (type: string, description: string) => void;
}

export async function runMouseScanner(page: Page, options: MouseScannerOptions): Promise<void> {
  const { appId, runId, baseUrl, sizeClass } = options;
  const stateManager = new StateManager();
  const domain = new URL(baseUrl).hostname;

  // Capture console and network logs per action
  let consoleBuffer: string[] = [];
  let networkBuffer: NetworkLogEntry[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleBuffer.push(msg.text());
  });

  page.on('response', (response) => {
    const url = response.url();
    if (url.startsWith('data:')) return;
    networkBuffer.push({
      method: response.request().method(),
      url,
      status: response.status(),
      contentType: response.headers()['content-type'] || '',
    });
  });

  function resetBuffers() {
    consoleBuffer = [];
    networkBuffer = [];
  }

  async function capturePageState(pageUrl: string): Promise<{ pageId: number; pageStateId: number; isNew: boolean }> {
    const pageRecord = await pagesRepo.findOrCreatePage(appId, pageUrl);
    const html = await extractPageHtml(page);
    const items = await extractActionableItems(page);
    const hashes = computeHashes(html, items);

    const existing = await pageStatesRepo.findMatchingPageState(pageRecord.id, hashes, sizeClass);
    if (existing) {
      return { pageId: pageRecord.id, pageStateId: existing.id, isNew: false };
    }

    const visibleText = await extractVisibleText(page);
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 72 });
    // TODO: save screenshot to filesystem and get path
    const screenshotPath = '';

    const state = await pageStatesRepo.createPageState(
      pageRecord.id, sizeClass, hashes, screenshotPath, undefined, visibleText,
    );
    await itemsRepo.insertActionableItems(state.id, items);

    options.onPageDiscovered?.(pageUrl, pageUrl);

    return { pageId: pageRecord.id, pageStateId: state.id, isNew: true };
  }

  async function createMouseoverActions(pageStateId: number): Promise<void> {
    const items = await itemsRepo.getItemsByPageState(pageStateId);
    for (const item of items) {
      if (!item.visible || item.disabled) continue;
      // Skip text inputs — deferred to Phase 1c
      if (item.actionKind === 'fill') continue;
      // Skip form submit buttons — deferred to Phase 1c
      if (item.tagName === 'BUTTON' && item.selector?.includes('[type="submit"]')) continue;
      if (item.tagName === 'INPUT' && item.selector?.includes('[type="submit"]')) continue;

      await actionsRepo.createAction({
        runId,
        type: 'mouseover',
        actionableItemId: item.id,
        startingPageStateId: pageStateId,
        sizeClass,
      });
    }
  }

  async function checkForIssues(actionId: number, actionType: string, startingPageStateId?: number, targetPageStateId?: number): Promise<void> {
    const pageUrl = page.url();
    const pageRecord = await pagesRepo.findOrCreatePage(appId, pageUrl);

    // Dead click check
    if (actionType === 'click' && detectDeadClick(startingPageStateId, targetPageStateId)) {
      const chain = await actionsRepo.getActionChain(actionId);
      // TODO: persist issue to DB via issues repository
      const description = 'Click did not navigate or change page state';
      options.onIssueDetected?.('dead_click', description);
      logger.warn({ actionId, pageUrl }, description);
    }

    // Error on page
    const visibleText = await extractVisibleText(page);
    const html = await extractPageHtml(page);
    const errorResult = detectErrorOnPage(visibleText, html);
    if (errorResult) {
      options.onIssueDetected?.('error_on_page', errorResult.description);
      logger.warn({ actionId, pageUrl }, errorResult.description);
    }

    // Console errors
    const consoleErrors = detectConsoleErrors(consoleBuffer, domain);
    for (const error of consoleErrors) {
      options.onIssueDetected?.('console_error', error);
      logger.warn({ actionId, pageUrl }, `Console error: ${error}`);
    }

    // Network errors
    const networkErrors = detectNetworkErrors(networkBuffer, domain);
    for (const entry of networkErrors) {
      const description = `${entry.method} ${entry.url} returned ${entry.status}`;
      options.onIssueDetected?.('network_error', description);
      logger.warn({ actionId, pageUrl }, description);
    }
  }

  // Step 1: Seed with navigate action
  const seedAction = await actionsRepo.createAction({
    runId,
    type: 'navigate',
    targetPageId: undefined,
    sizeClass,
  });

  // Step 2: Process loop
  let actionsCompleted = 0;

  while (true) {
    const nextAction = await actionsRepo.getNextOpenAction(runId, sizeClass);
    if (!nextAction) break;

    // Navigate to correct state if needed
    if (!stateManager.matches(nextAction.startingPageStateId)) {
      // For simplicity, navigate to the page URL associated with the starting state
      // A full implementation would replay the mouseover chain
      if (nextAction.type === 'navigate') {
        // Navigate actions go to baseUrl or target page
        await stateManager.navigateTo(page, baseUrl);
      }
    }

    resetBuffers();

    let targetPageId: number | undefined;
    let targetPageStateId: number | undefined;

    if (nextAction.type === 'navigate') {
      const url = baseUrl; // Initial navigate goes to base URL
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
      const result = await capturePageState(page.url());
      targetPageId = result.pageId;
      targetPageStateId = result.pageStateId;
      stateManager.update(result.pageStateId, page.url());

      if (result.isNew) {
        await createMouseoverActions(result.pageStateId);
      }
    } else if (nextAction.type === 'mouseover') {
      // Find the element and hover
      const items = nextAction.actionableItemId
        ? await itemsRepo.getItemsByPageState(nextAction.startingPageStateId!)
        : [];
      const item = items.find((i) => i.id === nextAction.actionableItemId);

      if (item?.selector) {
        try {
          const el = await page.waitForSelector(item.selector, { timeout: 5000, visible: true });
          if (el) {
            await el.hover();
            await new Promise((r) => setTimeout(r, HOVER_DELAY_MS));
          }
        } catch {
          logger.debug({ selector: item.selector }, 'mouseover target not found');
        }
      }

      // Check if HTML changed
      const html = await extractPageHtml(page);
      const currentItems = await extractActionableItems(page);
      const hashes = computeHashes(html, currentItems);
      const currentPage = await pagesRepo.findOrCreatePage(appId, page.url());
      const existingState = await pageStatesRepo.findMatchingPageState(currentPage.id, hashes, sizeClass);

      if (existingState && existingState.id === nextAction.startingPageStateId) {
        // No change
        targetPageStateId = nextAction.startingPageStateId!;
      } else if (existingState) {
        targetPageStateId = existingState.id;
      } else {
        // New page state from mouseover
        const visibleText = await extractVisibleText(page);
        const newState = await pageStatesRepo.createPageState(
          currentPage.id, sizeClass, hashes, '', undefined, visibleText,
        );
        await itemsRepo.insertActionableItems(newState.id, currentItems);
        targetPageStateId = newState.id;
        await createMouseoverActions(newState.id);
      }

      targetPageId = currentPage.id;

      // Create a click action for this element
      await actionsRepo.createAction({
        runId,
        type: 'click',
        actionableItemId: nextAction.actionableItemId,
        startingPageStateId: targetPageStateId,
        sizeClass,
      });
    } else if (nextAction.type === 'click') {
      const items = nextAction.startingPageStateId
        ? await itemsRepo.getItemsByPageState(nextAction.startingPageStateId)
        : [];
      const item = items.find((i) => i.id === nextAction.actionableItemId);

      const beforeUrl = page.url();

      if (item?.selector) {
        try {
          const el = await page.waitForSelector(item.selector, { timeout: 5000, visible: true });
          if (el) {
            await el.click();
            // Wait for potential navigation
            try {
              await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
            } catch {
              // No navigation occurred — that's ok
            }
          }
        } catch {
          logger.debug({ selector: item.selector }, 'click target not found');
        }
      }

      const afterUrl = page.url();
      const result = await capturePageState(afterUrl);
      targetPageId = result.pageId;
      targetPageStateId = result.pageStateId;
      stateManager.update(result.pageStateId, afterUrl);

      if (result.isNew) {
        await createMouseoverActions(result.pageStateId);
      }
    }

    // Complete the action
    await actionsRepo.completeAction(
      nextAction.id,
      targetPageId,
      targetPageStateId,
      consoleBuffer.join('\n'),
      JSON.stringify(networkBuffer),
    );

    await checkForIssues(nextAction.id, nextAction.type, nextAction.startingPageStateId, targetPageStateId);

    actionsCompleted++;
    options.onActionCompleted?.(nextAction.type, '', targetPageStateId !== nextAction.startingPageStateId);

    if (actionsCompleted % 10 === 0) {
      await runsRepo.updateRunStats(runId, { actionsCompleted });
      logger.info({ actionsCompleted, remaining: await actionsRepo.getOpenActionCount(runId, sizeClass) }, 'scan progress');
    }
  }

  await runsRepo.updateRunStats(runId, { actionsCompleted });
  logger.info({ actionsCompleted }, 'mouse scanning complete');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scanner/mouse-scanner.ts
git commit -m "feat: mouse scanner (Phase 1a orchestrator)"
```

---

## Phase 3: Auth + AI + Input Scanning -- COMPLETED

### Task 11: Form Identifier

**Files:**
- Create: `src/auth/form-identifier.ts`
- Test: `tests/auth/form-identifier.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/auth/form-identifier.test.ts
import { describe, it, expect } from 'vitest';
import { identifyFormType } from '../src/auth/form-identifier.js';
import type { FormInfo } from '../src/domain/types.js';

describe('form-identifier', () => {
  it('identifies login form by field pattern', () => {
    const form: FormInfo = {
      selector: 'form', action: '/login', method: 'POST', fieldCount: 2,
      fields: [
        { selector: '#email', name: 'email', type: 'email', label: 'Email', required: true },
        { selector: '#pass', name: 'password', type: 'password', label: 'Password', required: true },
      ],
      submitSelector: 'button[type="submit"]',
    };
    expect(identifyFormType(form, 'https://example.com/login')).toBe('login');
  });

  it('identifies signup form by field pattern', () => {
    const form: FormInfo = {
      selector: 'form', action: '/register', method: 'POST', fieldCount: 4,
      fields: [
        { selector: '#name', name: 'name', type: 'text', label: 'Name', required: true },
        { selector: '#email', name: 'email', type: 'email', label: 'Email', required: true },
        { selector: '#pass', name: 'password', type: 'password', label: 'Password', required: true },
        { selector: '#confirm', name: 'confirm', type: 'password', label: 'Confirm Password', required: true },
      ],
      submitSelector: 'button[type="submit"]',
    };
    expect(identifyFormType(form, 'https://example.com/register')).toBe('signup');
  });

  it('identifies login form by URL', () => {
    const form: FormInfo = {
      selector: 'form', action: '', method: 'POST', fieldCount: 2,
      fields: [
        { selector: '#user', name: 'user', type: 'text', label: 'User', required: true },
        { selector: '#pass', name: 'pass', type: 'password', label: 'Pass', required: true },
      ],
      submitSelector: 'button',
    };
    expect(identifyFormType(form, 'https://example.com/signin')).toBe('login');
  });

  it('identifies other forms', () => {
    const form: FormInfo = {
      selector: 'form', action: '/contact', method: 'POST', fieldCount: 3,
      fields: [
        { selector: '#name', name: 'name', type: 'text', label: 'Name', required: true },
        { selector: '#email', name: 'email', type: 'email', label: 'Email', required: true },
        { selector: '#msg', name: 'message', type: 'textarea', label: 'Message', required: true },
      ],
      submitSelector: 'button',
    };
    expect(identifyFormType(form, 'https://example.com/contact')).toBe('other');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/auth/form-identifier.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement form identifier**

```ts
// src/auth/form-identifier.ts
import { AUTH_URL_PATTERNS, SIGNUP_URL_PATTERNS, LOGIN_TEXT_PATTERNS, SIGNUP_TEXT_PATTERNS } from '../config/constants.js';
import type { FormInfo } from '../domain/types.js';

export type FormType = 'login' | 'signup' | 'other';

export function identifyFormType(form: FormInfo, pageUrl: string): FormType {
  const url = pageUrl.toLowerCase();
  const fields = form.fields;

  // URL-based detection
  const isLoginUrl = AUTH_URL_PATTERNS.some((p) => url.includes(p));
  const isSignupUrl = SIGNUP_URL_PATTERNS.some((p) => url.includes(p));

  // Field-based detection
  const hasPassword = fields.some((f) => f.type === 'password');
  const hasEmail = fields.some((f) => f.type === 'email' || f.name === 'email' || f.label.toLowerCase().includes('email'));
  const hasUsername = fields.some((f) => f.name === 'username' || f.label.toLowerCase().includes('username'));
  const hasName = fields.some((f) => {
    const n = (f.name + ' ' + f.label).toLowerCase();
    return n.includes('name') && !n.includes('username') && !n.includes('email');
  });
  const hasMessage = fields.some((f) => {
    const n = (f.name + ' ' + f.label).toLowerCase();
    return n.includes('message') || n.includes('subject');
  });
  const hasConfirmPassword = fields.filter((f) => f.type === 'password').length >= 2;

  // Not an auth form if it has message/subject fields
  if (hasMessage) return 'other';

  // Not an auth form without a password field
  if (!hasPassword) return 'other';

  // Signup: has name field + email + password, or confirm password, or signup URL
  if (hasPassword && (hasEmail || hasUsername)) {
    if (hasConfirmPassword || hasName || isSignupUrl) return 'signup';
    if (isLoginUrl) return 'login';
    // 2 fields with password = login pattern
    if (fields.length <= 2) return 'login';
    // More fields with name = signup
    if (hasName) return 'signup';
    return 'login';
  }

  if (isSignupUrl) return 'signup';
  if (isLoginUrl) return 'login';

  return 'other';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/auth/form-identifier.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/auth/form-identifier.ts tests/auth/form-identifier.test.ts
git commit -m "feat: form identifier (login vs signup vs other)"
```

---

### Task 12: Credential Manager + Login Executor + Signic Registrar

**Files:**
- Create: `src/auth/credential-manager.ts`
- Create: `src/auth/login-executor.ts`
- Create: `src/auth/signic-registrar.ts`

- [ ] **Step 1: Implement credential manager**

```ts
// src/auth/credential-manager.ts
import type { Credentials } from '../domain/types.js';

export class CredentialManager {
  private credentials: Credentials | null = null;

  setCredentials(creds: Credentials): void {
    this.credentials = creds;
  }

  getCredentials(): Credentials | null {
    return this.credentials;
  }

  hasCredentials(): boolean {
    return this.credentials !== null;
  }
}
```

- [ ] **Step 2: Implement login executor**

```ts
// src/auth/login-executor.ts
import type { Page } from 'puppeteer-core';
import pino from 'pino';
import type { Credentials, FormInfo } from '../domain/types.js';

const logger = pino({ name: 'login-executor' });

export async function executeLogin(page: Page, form: FormInfo, credentials: Credentials): Promise<boolean> {
  logger.info({ url: page.url() }, 'executing login');

  // Fill email/username
  const emailField = form.fields.find((f) =>
    f.type === 'email' || f.name === 'email' || f.label.toLowerCase().includes('email') ||
    f.name === 'username' || f.label.toLowerCase().includes('username')
  );
  if (emailField) {
    const value = credentials.email || credentials.username || '';
    const el = await page.waitForSelector(emailField.selector, { timeout: 5000 });
    if (el) {
      await el.click({ clickCount: 3 }); // select all
      await el.type(value);
    }
  }

  // Fill password
  const passwordField = form.fields.find((f) => f.type === 'password');
  if (passwordField) {
    const el = await page.waitForSelector(passwordField.selector, { timeout: 5000 });
    if (el) {
      await el.click({ clickCount: 3 });
      await el.type(credentials.password);
    }
  }

  // Submit
  if (form.submitSelector) {
    const btn = await page.waitForSelector(form.submitSelector, { timeout: 5000 });
    if (btn) await btn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  // Wait for navigation
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10_000 });
  } catch {
    // May not navigate — could be SPA
  }

  // Check for 2FA prompt
  if (credentials.twoFactorCode) {
    const tfaSelectors = [
      'input[name*="code"]', 'input[name*="otp"]', 'input[name*="2fa"]',
      'input[name*="verification"]', 'input[name*="authenticator"]',
      'input[placeholder*="code"]', 'input[placeholder*="verification"]',
    ];
    for (const sel of tfaSelectors) {
      try {
        const el = await page.waitForSelector(sel, { timeout: 3000, visible: true });
        if (el) {
          await el.type(credentials.twoFactorCode);
          await page.keyboard.press('Enter');
          try {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10_000 });
          } catch {}
          break;
        }
      } catch {
        continue;
      }
    }
  }

  // Verify: check we're not still on a login page
  const currentUrl = page.url().toLowerCase();
  const stillOnLogin = ['/login', '/signin', '/sign-in', '/auth'].some((p) => currentUrl.includes(p));
  if (stillOnLogin) {
    logger.warn({ url: currentUrl }, 'login may have failed — still on auth page');
    return false;
  }

  logger.info({ url: page.url() }, 'login succeeded');
  return true;
}
```

- [ ] **Step 3: Implement Signic registrar**

```ts
// src/auth/signic-registrar.ts
import { SignicClient } from '@sudobility/signic_sdk';
import { randomBytes } from 'node:crypto';
import type { Page } from 'puppeteer-core';
import pino from 'pino';
import type { FormInfo, Credentials } from '../domain/types.js';
import { loadConfig } from '../config/index.js';

const logger = pino({ name: 'signic-registrar' });

function generatePrivateKey(): `0x${string}` {
  return `0x${randomBytes(32).toString('hex')}` as `0x${string}`;
}

function generatePassword(): string {
  return `TestPass!${randomBytes(4).toString('hex')}`;
}

export async function autoRegister(
  page: Page,
  signupForm: FormInfo,
): Promise<Credentials | null> {
  const config = loadConfig();
  const privateKey = generatePrivateKey();
  const client = new SignicClient({
    privateKey,
    indexerUrl: config.signicIndexerUrl,
    wildduckUrl: config.signicWildduckUrl,
  });

  const email = client.getEmailAddress();
  const password = generatePassword();

  logger.info({ email }, 'auto-registering with Signic email');

  // Connect Signic client (creates account on first auth)
  await client.connect();

  // Fill signup form
  for (const field of signupForm.fields) {
    const label = (field.name + ' ' + field.label).toLowerCase();
    let value = '';

    if (field.type === 'email' || label.includes('email')) {
      value = email;
    } else if (field.type === 'password') {
      value = password;
    } else if (label.includes('name') && !label.includes('username')) {
      value = 'Test User';
    } else if (label.includes('username')) {
      value = `testuser_${randomBytes(3).toString('hex')}`;
    } else {
      continue; // Skip unknown fields
    }

    try {
      const el = await page.waitForSelector(field.selector, { timeout: 5000 });
      if (el) {
        await el.click({ clickCount: 3 });
        await el.type(value);
      }
    } catch {
      logger.warn({ selector: field.selector }, 'could not fill signup field');
    }
  }

  // Submit
  if (signupForm.submitSelector) {
    const btn = await page.waitForSelector(signupForm.submitSelector, { timeout: 5000 });
    if (btn) await btn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10_000 });
  } catch {}

  // Poll for verification email
  logger.info('polling Signic inbox for verification email');
  let verified = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { emails } = await client.getUnreadEmails(5);
    if (emails.length === 0) continue;

    const latestEmail = await client.getEmail(emails[0].id);
    const body = latestEmail.text || latestEmail.html?.join('') || '';

    // Try to extract OTP (4-8 digit code)
    const otpMatch = body.match(/\b(\d{4,8})\b/);
    if (otpMatch) {
      const otp = otpMatch[1];
      logger.info({ otp }, 'found OTP in verification email');
      // Find OTP input on page
      const otpSelectors = [
        'input[name*="code"]', 'input[name*="otp"]', 'input[name*="verification"]',
        'input[placeholder*="code"]', 'input[type="number"]',
      ];
      for (const sel of otpSelectors) {
        try {
          const el = await page.waitForSelector(sel, { timeout: 3000, visible: true });
          if (el) {
            await el.type(otp);
            await page.keyboard.press('Enter');
            try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10_000 }); } catch {}
            verified = true;
            break;
          }
        } catch { continue; }
      }
      if (verified) break;
    }

    // Try to extract verification link
    const linkMatch = body.match(/https?:\/\/[^\s"'<>]+verify[^\s"'<>]*/i) ||
                      body.match(/https?:\/\/[^\s"'<>]+confirm[^\s"'<>]*/i);
    if (linkMatch) {
      logger.info({ link: linkMatch[0] }, 'found verification link');
      await page.goto(linkMatch[0], { waitUntil: 'networkidle0', timeout: 15_000 });
      verified = true;
      break;
    }
  }

  if (!verified) {
    logger.warn('could not verify account — no OTP or link found');
    return null;
  }

  logger.info({ email }, 'auto-registration complete');
  return { email, password };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/auth/
git commit -m "feat: credential manager, login executor, Signic auto-registrar"
```

---

### Task 13: Pairwise Combination Generator

**Files:**
- Create: `src/scanner/pairwise.ts`
- Test: `tests/scanner/pairwise.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/scanner/pairwise.test.ts
import { describe, it, expect } from 'vitest';
import { generatePairwiseCombinations } from '../src/scanner/pairwise.js';

describe('pairwise', () => {
  it('generates pairwise for 2 binary factors', () => {
    const factors = [
      { name: 'A', values: ['on', 'off'] },
      { name: 'B', values: ['on', 'off'] },
    ];
    const combos = generatePairwiseCombinations(factors);
    // 2 binary factors: all 4 combos needed for full pairwise (same as exhaustive)
    expect(combos.length).toBe(4);
  });

  it('generates fewer than exhaustive for larger inputs', () => {
    const factors = [
      { name: 'A', values: ['on', 'off'] },
      { name: 'B', values: ['on', 'off'] },
      { name: 'C', values: ['on', 'off'] },
      { name: 'D', values: ['on', 'off'] },
      { name: 'E', values: ['1', '2', '3', '4'] },
    ];
    const combos = generatePairwiseCombinations(factors);
    const exhaustive = 2 * 2 * 2 * 2 * 4; // 64
    expect(combos.length).toBeLessThan(exhaustive);
    expect(combos.length).toBeGreaterThan(0);
  });

  it('covers all pairs', () => {
    const factors = [
      { name: 'A', values: ['0', '1'] },
      { name: 'B', values: ['x', 'y'] },
      { name: 'C', values: ['p', 'q'] },
    ];
    const combos = generatePairwiseCombinations(factors);
    // Check all pairs between factor 0 and factor 1 are covered
    const pairs01 = new Set<string>();
    for (const combo of combos) {
      pairs01.add(`${combo.A}|${combo.B}`);
    }
    expect(pairs01.has('0|x')).toBe(true);
    expect(pairs01.has('0|y')).toBe(true);
    expect(pairs01.has('1|x')).toBe(true);
    expect(pairs01.has('1|y')).toBe(true);
  });

  it('returns single combo for single factor', () => {
    const factors = [{ name: 'A', values: ['on', 'off'] }];
    const combos = generatePairwiseCombinations(factors);
    expect(combos.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/scanner/pairwise.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement pairwise generator**

Uses a greedy algorithm: for each uncovered pair, find or create a test case that covers it.

```ts
// src/scanner/pairwise.ts

export interface Factor {
  name: string;
  values: string[];
}

export type Combination = Record<string, string>;

export function generatePairwiseCombinations(factors: Factor[]): Combination[] {
  if (factors.length === 0) return [];
  if (factors.length === 1) {
    return factors[0].values.map((v) => ({ [factors[0].name]: v }));
  }

  // Collect all pairs that need covering
  const uncoveredPairs = new Set<string>();
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      for (const vi of factors[i].values) {
        for (const vj of factors[j].values) {
          uncoveredPairs.add(`${i}:${vi}|${j}:${vj}`);
        }
      }
    }
  }

  const results: Combination[] = [];

  while (uncoveredPairs.size > 0) {
    // Greedy: try each possible row, pick the one covering the most uncovered pairs
    let bestCombo: Combination = {};
    let bestCovered = 0;

    // Generate candidate rows
    const candidates: Combination[] = [];
    // Start from each uncovered pair
    const firstPair = uncoveredPairs.values().next().value!;
    const [partA, partB] = firstPair.split('|');
    const [idxAStr, valA] = partA.split(':');
    const [idxBStr, valB] = partB.split(':');
    const idxA = parseInt(idxAStr);
    const idxB = parseInt(idxBStr);

    // Build a candidate with these two fixed, try all values for remaining factors
    const candidate: Combination = {};
    candidate[factors[idxA].name] = valA;
    candidate[factors[idxB].name] = valB;

    // Fill remaining factors greedily
    for (let f = 0; f < factors.length; f++) {
      if (f === idxA || f === idxB) continue;
      let bestVal = factors[f].values[0];
      let bestScore = 0;
      for (const val of factors[f].values) {
        candidate[factors[f].name] = val;
        let score = 0;
        for (let other = 0; other < factors.length; other++) {
          if (other === f || !candidate[factors[other].name]) continue;
          const [lo, hi] = f < other ? [f, other] : [other, f];
          const [loVal, hiVal] = f < other ? [val, candidate[factors[other].name]] : [candidate[factors[other].name], val];
          const key = `${lo}:${loVal}|${hi}:${hiVal}`;
          if (uncoveredPairs.has(key)) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          bestVal = val;
        }
      }
      candidate[factors[f].name] = bestVal;
    }

    // Count covered pairs
    for (let i = 0; i < factors.length; i++) {
      for (let j = i + 1; j < factors.length; j++) {
        const key = `${i}:${candidate[factors[i].name]}|${j}:${candidate[factors[j].name]}`;
        if (uncoveredPairs.has(key)) {
          uncoveredPairs.delete(key);
        }
      }
    }

    results.push({ ...candidate });
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/scanner/pairwise.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scanner/pairwise.ts tests/scanner/pairwise.test.ts
git commit -m "feat: pairwise combination generator"
```

---

### Task 14: AI Analyzer (Phase 1b)

**Files:**
- Create: `src/ai/analyzer.ts`
- Create: `src/ai/persona-generator.ts`
- Create: `src/ai/use-case-generator.ts`
- Create: `src/ai/input-generator.ts`
- Create: `src/db/repositories/personas.ts`

- [ ] **Step 1: Implement personas repository**

```ts
// src/db/repositories/personas.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { personas, useCases, inputValues } from '../schema.js';

export async function createPersona(appId: number, name: string, description: string) {
  const db = getDb();
  const [persona] = await db.insert(personas).values({ appId, name, description }).returning();
  return persona;
}

export async function createUseCase(personaId: number, name: string, description: string) {
  const db = getDb();
  const [uc] = await db.insert(useCases).values({ personaId, name, description }).returning();
  return uc;
}

export async function createInputValue(useCaseId: number, fieldSelector: string, fieldName: string, value: string) {
  const db = getDb();
  const [iv] = await db.insert(inputValues).values({ useCaseId, fieldSelector, fieldName, value }).returning();
  return iv;
}

export async function getPersonasByApp(appId: number) {
  const db = getDb();
  return db.query.personas.findMany({ where: eq(personas.appId, appId) });
}

export async function getUseCasesByPersona(personaId: number) {
  const db = getDb();
  return db.query.useCases.findMany({ where: eq(useCases.personaId, personaId) });
}

export async function getInputValuesByUseCase(useCaseId: number) {
  const db = getDb();
  return db.query.inputValues.findMany({ where: eq(inputValues.useCaseId, useCaseId) });
}
```

- [ ] **Step 2: Implement AI modules**

```ts
// src/ai/persona-generator.ts
import OpenAI from 'openai';
import pino from 'pino';

const logger = pino({ name: 'persona-generator' });

interface PersonaResult {
  name: string;
  description: string;
}

export async function generatePersonas(
  client: OpenAI,
  siteSummary: string,
  pageContents: string[],
): Promise<PersonaResult[]> {
  const prompt = `You are analyzing a website. Based on the following site content, identify the distinct types of users (personas) who would use this site. For each persona, provide a name and a brief description.

Site summary: ${siteSummary}

Page contents (sampled):
${pageContents.slice(0, 10).map((c, i) => `Page ${i + 1}: ${c.slice(0, 500)}`).join('\n\n')}

Respond with a JSON array of objects with "name" and "description" fields. Minimum 1 persona, maximum 5.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || '{"personas":[]}';
  const parsed = JSON.parse(content);
  const personas: PersonaResult[] = parsed.personas || [];
  logger.info({ count: personas.length }, 'personas generated');
  return personas;
}
```

```ts
// src/ai/use-case-generator.ts
import OpenAI from 'openai';
import pino from 'pino';

const logger = pino({ name: 'use-case-generator' });

interface UseCaseResult {
  name: string;
  description: string;
}

export async function generateUseCases(
  client: OpenAI,
  personaName: string,
  personaDescription: string,
  siteSummary: string,
  pageContents: string[],
): Promise<UseCaseResult[]> {
  const prompt = `For the persona "${personaName}" (${personaDescription}) on this website, identify specific use cases — goals this user would try to accomplish.

Site summary: ${siteSummary}

Pages available:
${pageContents.slice(0, 10).map((c, i) => `Page ${i + 1}: ${c.slice(0, 300)}`).join('\n\n')}

Respond with a JSON array of objects with "name" and "description" fields. 2-8 use cases.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || '{"useCases":[]}';
  const parsed = JSON.parse(content);
  const useCases: UseCaseResult[] = parsed.useCases || parsed.use_cases || [];
  logger.info({ persona: personaName, count: useCases.length }, 'use cases generated');
  return useCases;
}
```

```ts
// src/ai/input-generator.ts
import OpenAI from 'openai';
import pino from 'pino';
import type { FormField } from '../../domain/types.js';

const logger = pino({ name: 'input-generator' });

interface InputValueResult {
  fieldSelector: string;
  fieldName: string;
  value: string;
}

export async function generateInputValues(
  client: OpenAI,
  personaName: string,
  useCaseName: string,
  fields: FormField[],
): Promise<InputValueResult[]> {
  const fieldDescriptions = fields.map((f) =>
    `selector: "${f.selector}", name: "${f.name}", type: "${f.type}", label: "${f.label}", required: ${f.required}${f.options ? `, options: [${f.options.join(', ')}]` : ''}`
  ).join('\n');

  const prompt = `For the persona "${personaName}" performing the use case "${useCaseName}", generate realistic form input values for these fields:

${fieldDescriptions}

Respond with a JSON array of objects with "fieldSelector", "fieldName", and "value" fields. Use realistic data appropriate for this persona and use case.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || '{"values":[]}';
  const parsed = JSON.parse(content);
  const values: InputValueResult[] = parsed.values || parsed.inputValues || [];
  logger.info({ persona: personaName, useCase: useCaseName, count: values.length }, 'input values generated');
  return values;
}
```

```ts
// src/ai/analyzer.ts
import OpenAI from 'openai';
import pino from 'pino';
import { generatePersonas } from './persona-generator.js';
import { generateUseCases } from './use-case-generator.js';
import { generateInputValues } from './input-generator.js';
import * as personasRepo from '../db/repositories/personas.js';
import * as pageStatesRepo from '../db/repositories/page-states.js';
import type { FormField } from '../domain/types.js';

const logger = pino({ name: 'ai-analyzer' });

export interface AnalyzerOptions {
  appId: number;
  runId: number;
  forms: Array<{ pageUrl: string; fields: FormField[] }>;
  onComplete?: (personas: string[], useCases: string[]) => void;
}

export async function runAiAnalysis(options: AnalyzerOptions): Promise<void> {
  const { appId, runId, forms } = options;
  const client = new OpenAI();

  // Collect all page content
  // TODO: query page_states content_text for this app
  const pageContents: string[] = [];

  // Generate site summary
  logger.info('generating site summary');
  const summaryResponse = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Summarize this website in 2-3 sentences based on these page contents:\n\n${pageContents.slice(0, 5).map((c) => c.slice(0, 500)).join('\n\n')}`,
    }],
    temperature: 0.3,
  });
  const siteSummary = summaryResponse.choices[0].message.content || 'Unknown website';

  // Generate personas
  const personaResults = await generatePersonas(client, siteSummary, pageContents);
  const personaNames: string[] = [];
  const useCaseNames: string[] = [];

  for (const pr of personaResults) {
    const persona = await personasRepo.createPersona(appId, pr.name, pr.description);
    personaNames.push(pr.name);

    // Generate use cases for this persona
    const ucResults = await generateUseCases(client, pr.name, pr.description, siteSummary, pageContents);

    for (const ucr of ucResults) {
      const useCase = await personasRepo.createUseCase(persona.id, ucr.name, ucr.description);
      useCaseNames.push(ucr.name);

      // Generate input values for each form
      for (const form of forms) {
        const textFields = form.fields.filter((f) => ['text', 'email', 'tel', 'url', 'search', 'textarea'].includes(f.type));
        if (textFields.length === 0) continue;

        const ivResults = await generateInputValues(client, pr.name, ucr.name, textFields);
        for (const iv of ivResults) {
          await personasRepo.createInputValue(useCase.id, iv.fieldSelector, iv.fieldName, iv.value);
        }
      }
    }
  }

  options.onComplete?.(personaNames, useCaseNames);
  logger.info({ personas: personaNames.length, useCases: useCaseNames.length }, 'AI analysis complete');
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ai/ src/db/repositories/personas.ts
git commit -m "feat: AI analyzer — persona, use case, and input value generation"
```

---

### Task 15: Input Scanner (Phase 1c)

**Files:**
- Create: `src/scanner/input-scanner.ts`

- [ ] **Step 1: Implement input scanner**

```ts
// src/scanner/input-scanner.ts
import type { Page } from 'puppeteer-core';
import pino from 'pino';
import { generatePairwiseCombinations, type Factor } from './pairwise.js';
import * as actionsRepo from '../db/repositories/actions.js';
import * as personasRepo from '../db/repositories/personas.js';
import * as pagesRepo from '../db/repositories/pages.js';
import * as pageStatesRepo from '../db/repositories/page-states.js';
import * as itemsRepo from '../db/repositories/actionable-items.js';
import { extractActionableItems, extractPageHtml, extractVisibleText } from './extractor.js';
import { computeHashes } from '../browser/page-utils.js';
import { StateManager } from './state-manager.js';
import type { FormInfo, SizeClass } from '../domain/types.js';

const logger = pino({ name: 'input-scanner' });

export interface InputScannerOptions {
  appId: number;
  runId: number;
  sizeClass: SizeClass;
  forms: Array<{ pageUrl: string; pageId: number; pageStateId: number; form: FormInfo }>;
}

export async function runInputScanner(page: Page, options: InputScannerOptions): Promise<void> {
  const { appId, runId, sizeClass, forms } = options;
  const stateManager = new StateManager();

  const allPersonas = await personasRepo.getPersonasByApp(appId);

  for (const { pageUrl, pageId, pageStateId, form } of forms) {
    // Identify discrete controls for pairwise testing
    const discreteFields = form.fields.filter((f) =>
      ['checkbox', 'radio', 'select-one', 'select'].includes(f.type)
    );

    const textFields = form.fields.filter((f) =>
      ['text', 'email', 'tel', 'url', 'search', 'textarea', 'password'].includes(f.type)
    );

    // Generate pairwise combinations for discrete controls
    let pairwiseCombos: Record<string, string>[] = [{}];
    if (discreteFields.length > 0) {
      const factors: Factor[] = discreteFields.map((f) => ({
        name: f.selector,
        values: f.type === 'checkbox' ? ['true', 'false'] : (f.options || ['true', 'false']),
      }));
      pairwiseCombos = generatePairwiseCombinations(factors);
      logger.info({ form: form.selector, combos: pairwiseCombos.length }, 'pairwise combinations generated');
    }

    // For each persona
    for (const persona of allPersonas) {
      const useCases = await personasRepo.getUseCasesByPersona(persona.id);

      for (const useCase of useCases) {
        const inputValues = await personasRepo.getInputValuesByUseCase(useCase.id);

        // For each pairwise combination
        for (const combo of pairwiseCombos) {
          // Navigate to the page
          await stateManager.navigateTo(page, pageUrl);

          // Fill text fields using persona's input values
          for (const field of textFields) {
            const iv = inputValues.find((v) => v.fieldSelector === field.selector || v.fieldName === field.name);
            if (iv) {
              try {
                const el = await page.waitForSelector(field.selector, { timeout: 5000 });
                if (el) {
                  await el.click({ clickCount: 3 });
                  await el.type(iv.value);
                }
              } catch {
                logger.debug({ selector: field.selector }, 'could not fill text field');
              }
            }
          }

          // Set discrete controls per pairwise combination
          for (const [selector, value] of Object.entries(combo)) {
            try {
              const field = discreteFields.find((f) => f.selector === selector);
              if (!field) continue;

              if (field.type === 'checkbox') {
                const el = await page.waitForSelector(selector, { timeout: 5000 });
                if (el) {
                  const isChecked = await el.evaluate((e) => (e as HTMLInputElement).checked);
                  if ((value === 'true') !== isChecked) await el.click();
                }
              } else if (field.type === 'select-one' || field.type === 'select') {
                await page.select(selector, value);
              } else if (field.type === 'radio') {
                const el = await page.waitForSelector(`${selector}[value="${value}"]`, { timeout: 5000 });
                if (el) await el.click();
              }
            } catch {
              logger.debug({ selector, value }, 'could not set discrete control');
            }
          }

          // Submit the form
          if (form.submitSelector) {
            try {
              const btn = await page.waitForSelector(form.submitSelector, { timeout: 5000 });
              if (btn) await btn.click();
              try {
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10_000 });
              } catch {}
            } catch {
              logger.debug({ selector: form.submitSelector }, 'could not click submit');
            }
          }

          // Capture resulting state
          const resultUrl = page.url();
          const resultPage = await pagesRepo.findOrCreatePage(appId, resultUrl);
          const html = await extractPageHtml(page);
          const items = await extractActionableItems(page);
          const hashes = computeHashes(html, items);

          const existingState = await pageStatesRepo.findMatchingPageState(resultPage.id, hashes, sizeClass);
          if (!existingState) {
            const visibleText = await extractVisibleText(page);
            const newState = await pageStatesRepo.createPageState(
              resultPage.id, sizeClass, hashes, '', undefined, visibleText,
            );
            await itemsRepo.insertActionableItems(newState.id, items);
          }

          // Record as completed action
          await actionsRepo.createAction({
            runId,
            type: 'fill',
            startingPageStateId: pageStateId,
            targetPageId: resultPage.id,
            sizeClass,
            personaId: persona.id,
            useCaseId: useCase.id,
          });
        }
      }
    }
  }

  logger.info('input scanning complete');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scanner/input-scanner.ts
git commit -m "feat: input scanner (Phase 1c — form filling + pairwise)"
```

---

## Phase 4: Test Generation -- COMPLETED

### Task 16: Suite Tagger + Test Templates

**Files:**
- Create: `src/generation/suite-tagger.ts`
- Create: `src/generation/render.ts`
- Create: `src/generation/interaction.ts`
- Create: `src/generation/form.ts`
- Create: `src/generation/navigation.ts`
- Create: `src/generation/e2e.ts`
- Create: `src/generation/generator.ts`
- Test: `tests/generation/suite-tagger.test.ts`
- Test: `tests/generation/render.test.ts`

- [ ] **Step 1: Write the tests**

```ts
// tests/generation/suite-tagger.test.ts
import { describe, it, expect } from 'vitest';
import { assignPriority, assignSuiteTags } from '../src/generation/suite-tagger.js';

describe('suite-tagger', () => {
  it('assigns high priority to login pages', () => {
    expect(assignPriority('/login', 'Login')).toBe('high');
  });

  it('assigns normal priority to regular pages', () => {
    expect(assignPriority('/about', 'About Us')).toBe('normal');
  });

  it('assigns sanity+smoke to high-priority render', () => {
    const tags = assignSuiteTags('render', 'high');
    expect(tags).toContain('regression');
    expect(tags).toContain('sanity');
    expect(tags).toContain('smoke');
  });

  it('assigns regression only to normal-priority render', () => {
    const tags = assignSuiteTags('render', 'normal');
    expect(tags).toEqual(['regression']);
  });

  it('assigns sanity+smoke to e2e', () => {
    const tags = assignSuiteTags('e2e', 'normal');
    expect(tags).toContain('sanity');
    expect(tags).toContain('smoke');
  });
});
```

```ts
// tests/generation/render.test.ts
import { describe, it, expect } from 'vitest';
import { generateRenderTest } from '../src/generation/render.js';

describe('render template', () => {
  it('generates navigate + assertVisible actions', () => {
    const tc = generateRenderTest({
      pageId: 1,
      pageName: 'Homepage',
      url: 'https://example.com',
      sizeClass: 'desktop',
      priority: 'normal',
      elements: [
        { selector: 'a[href="/pricing"]', accessibleName: 'Pricing', visible: true },
        { selector: 'button#signup', accessibleName: 'Sign Up', visible: true },
      ],
    });

    expect(tc.name).toBe('Render — Homepage');
    expect(tc.type).toBe('render');
    expect(tc.actions[0]).toEqual({ action: 'navigate', url: 'https://example.com' });
    expect(tc.actions[1]).toEqual({ action: 'waitForLoad' });
    expect(tc.actions[2]).toEqual({ action: 'assertVisible', selector: 'a[href="/pricing"]' });
    expect(tc.actions[3]).toEqual({ action: 'assertVisible', selector: 'button#signup' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run tests/generation/`
Expected: FAIL

- [ ] **Step 3: Implement suite tagger and templates**

```ts
// src/generation/suite-tagger.ts
import { HIGH_PRIORITY_KEYWORDS } from '../config/constants.js';

export function assignPriority(route: string, title: string): string {
  const text = (route + ' ' + title).toLowerCase();
  return HIGH_PRIORITY_KEYWORDS.some((kw) => text.includes(kw)) ? 'high' : 'normal';
}

export function assignSuiteTags(testType: string, priority: string): string[] {
  const tags = ['regression'];
  if (testType === 'render' && priority === 'high') tags.push('sanity', 'smoke');
  if (testType === 'form' && priority === 'high') tags.push('sanity');
  if (testType === 'navigation') tags.push('sanity');
  if (testType === 'e2e') tags.push('sanity', 'smoke');
  return [...new Set(tags)];
}
```

```ts
// src/generation/render.ts
import type { TestAction, TestCase, SizeClass } from '../domain/types.js';
import { assignSuiteTags } from './suite-tagger.js';

interface RenderInput {
  pageId: number;
  pageName: string;
  url: string;
  sizeClass: SizeClass;
  priority: string;
  elements: Array<{ selector: string; accessibleName?: string; visible: boolean }>;
}

export function generateRenderTest(input: RenderInput): TestCase {
  const actions: TestAction[] = [
    { action: 'navigate', url: input.url },
    { action: 'waitForLoad' },
  ];

  for (const el of input.elements.filter((e) => e.visible).slice(0, 10)) {
    actions.push({ action: 'assertVisible', selector: el.selector });
  }

  actions.push({ action: 'screenshot', label: `render-${input.pageName.toLowerCase().replace(/\s+/g, '-')}` });

  return {
    name: `Render — ${input.pageName}`,
    type: 'render',
    sizeClass: input.sizeClass,
    suite_tags: assignSuiteTags('render', input.priority),
    page_id: input.pageId,
    priority: input.priority,
    actions,
  };
}
```

```ts
// src/generation/interaction.ts
import type { TestAction, TestCase, SizeClass } from '../domain/types.js';
import { assignSuiteTags } from './suite-tagger.js';

interface InteractionInput {
  pageName: string;
  url: string;
  sizeClass: SizeClass;
  priority: string;
  mouseoverSelectors: string[];
  clickSelector: string;
  expectedUrl?: string;
}

export function generateInteractionTest(input: InteractionInput): TestCase {
  const actions: TestAction[] = [
    { action: 'navigate', url: input.url },
    { action: 'waitForLoad' },
  ];

  for (const sel of input.mouseoverSelectors) {
    actions.push({ action: 'mouseover', selector: sel });
  }

  actions.push({ action: 'click', selector: input.clickSelector });

  if (input.expectedUrl) {
    actions.push({ action: 'waitForNavigation' });
    actions.push({ action: 'assertUrl', pattern: input.expectedUrl });
  }

  return {
    name: `Interaction — ${input.pageName}`,
    type: 'interaction',
    sizeClass: input.sizeClass,
    suite_tags: assignSuiteTags('interaction', input.priority),
    priority: input.priority,
    actions,
  };
}
```

```ts
// src/generation/form.ts
import type { TestAction, TestCase, SizeClass } from '../domain/types.js';
import { assignSuiteTags } from './suite-tagger.js';

interface FormInput {
  pageName: string;
  url: string;
  sizeClass: SizeClass;
  priority: string;
  personaId: number;
  useCaseId: number;
  fills: Array<{ selector: string; value: string }>;
  discreteControls: Array<{ selector: string; type: string; value: string }>;
  submitSelector?: string;
}

export function generateFormTest(input: FormInput): TestCase {
  const actions: TestAction[] = [
    { action: 'navigate', url: input.url },
    { action: 'waitForLoad' },
  ];

  for (const fill of input.fills) {
    actions.push({ action: 'fill', selector: fill.selector, value: fill.value });
  }

  for (const ctrl of input.discreteControls) {
    if (ctrl.type === 'checkbox' || ctrl.type === 'toggle') {
      actions.push({ action: 'check', selector: ctrl.selector, value: ctrl.value });
    } else if (ctrl.type === 'select' || ctrl.type === 'select-one') {
      actions.push({ action: 'select', selector: ctrl.selector, value: ctrl.value });
    }
  }

  if (input.submitSelector) {
    actions.push({ action: 'click', selector: input.submitSelector });
  }
  actions.push({ action: 'waitForNavigation' });
  actions.push({ action: 'assertUrlChanged' });

  return {
    name: `Form — ${input.pageName}`,
    type: 'form',
    sizeClass: input.sizeClass,
    suite_tags: assignSuiteTags('form', input.priority),
    persona_id: input.personaId,
    use_case_id: input.useCaseId,
    priority: input.priority,
    actions,
  };
}
```

```ts
// src/generation/navigation.ts
import type { TestAction, TestCase, SizeClass } from '../domain/types.js';
import { assignSuiteTags } from './suite-tagger.js';

interface NavigationInput {
  fromPageName: string;
  toPageName: string;
  fromUrl: string;
  toUrl: string;
  sizeClass: SizeClass;
  priority: string;
  triggerSelector: string;
}

export function generateNavigationTest(input: NavigationInput): TestCase {
  const pattern = new URL(input.toUrl).pathname;

  return {
    name: `Navigation — ${input.fromPageName} → ${input.toPageName}`,
    type: 'navigation',
    sizeClass: input.sizeClass,
    suite_tags: assignSuiteTags('navigation', input.priority),
    priority: input.priority,
    actions: [
      { action: 'navigate', url: input.fromUrl },
      { action: 'waitForLoad' },
      { action: 'click', selector: input.triggerSelector },
      { action: 'waitForNavigation' },
      { action: 'assertUrl', pattern },
    ],
  };
}
```

```ts
// src/generation/e2e.ts
import type { TestAction, TestCase, SizeClass } from '../domain/types.js';
import { assignSuiteTags } from './suite-tagger.js';

interface E2EStep {
  pageName: string;
  url: string;
  triggerSelector?: string;
}

interface E2EInput {
  sizeClass: SizeClass;
  steps: E2EStep[];
}

export function generateE2ETest(input: E2EInput): TestCase {
  const actions: TestAction[] = [
    { action: 'navigate', url: input.steps[0].url },
    { action: 'waitForLoad' },
  ];

  for (let i = 0; i < input.steps.length - 1; i++) {
    const from = input.steps[i];
    const to = input.steps[i + 1];
    actions.push({ action: 'step', label: `Step ${i + 1}: ${from.pageName} → ${to.pageName}` });
    if (from.triggerSelector) {
      actions.push({ action: 'click', selector: from.triggerSelector });
    } else {
      actions.push({ action: 'navigate', url: to.url });
    }
    actions.push({ action: 'assertUrl', pattern: new URL(to.url).pathname });
  }

  const scenarioName = input.steps.map((s) => s.pageName).join(' → ');

  return {
    name: `E2E — ${scenarioName}`,
    type: 'e2e',
    sizeClass: input.sizeClass,
    suite_tags: assignSuiteTags('e2e', 'high'),
    priority: 'high',
    actions,
  };
}

export function enumerateE2EPaths(
  adjacency: Map<number, number[]>,
  maxDepth: number = 6,
  maxPaths: number = 20,
): number[][] {
  const allPaths: number[][] = [];
  const nodes = [...adjacency.keys()];

  function dfs(current: number, path: number[]): void {
    if (allPaths.length >= maxPaths) return;
    if (path.length >= 3) {
      allPaths.push([...path]);
      if (path.length >= maxDepth) return;
    }
    for (const neighbor of adjacency.get(current) || []) {
      if (!path.includes(neighbor)) {
        path.push(neighbor);
        dfs(neighbor, path);
        path.pop();
      }
    }
  }

  for (const node of nodes) {
    if (allPaths.length >= maxPaths) break;
    dfs(node, [node]);
  }

  return allPaths;
}
```

```ts
// src/generation/generator.ts
import pino from 'pino';
import { generateRenderTest } from './render.js';
import { generateNavigationTest } from './navigation.js';
import { generateE2ETest, enumerateE2EPaths } from './e2e.js';
import { assignPriority } from './suite-tagger.js';
import type { TestCase, SizeClass } from '../domain/types.js';
import * as pagesRepo from '../db/repositories/pages.js';
import * as pageStatesRepo from '../db/repositories/page-states.js';
import * as itemsRepo from '../db/repositories/actionable-items.js';

const logger = pino({ name: 'generator' });

export interface GeneratorOptions {
  appId: number;
  runId: number;
  sizeClass: SizeClass;
}

export async function generateTestCases(options: GeneratorOptions): Promise<TestCase[]> {
  const { appId, sizeClass } = options;
  const testCases: TestCase[] = [];

  const allPages = await pagesRepo.getPagesByApp(appId);

  // Render tests — one per page
  for (const page of allPages) {
    const priority = assignPriority(page.routeKey || '', page.url);
    // TODO: query page states and elements for this page
    testCases.push(generateRenderTest({
      pageId: page.id,
      pageName: page.routeKey || page.url,
      url: page.url,
      sizeClass,
      priority,
      elements: [],
    }));
  }

  // Navigation tests — from click actions that changed URL
  // TODO: query completed click actions where targetPageId != startingPage

  // E2E tests — enumerate paths through page graph
  // TODO: build adjacency from navigation actions, call enumerateE2EPaths

  logger.info({ count: testCases.length }, 'test cases generated');
  return testCases;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run tests/generation/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/generation/ tests/generation/
git commit -m "feat: test generation templates and orchestrator"
```

---

## Phase 5: Test Runner + API -- COMPLETED

### Task 17: Test Executor + Worker Pool

**Files:**
- Create: `src/runner/executor.ts`
- Create: `src/runner/worker-pool.ts`
- Create: `src/runner/reporter.ts`
- Create: `src/db/repositories/test-cases.ts`
- Create: `src/db/repositories/test-runs.ts`
- Test: `tests/runner/executor.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/runner/executor.test.ts
import { describe, it, expect } from 'vitest';
import { mapActionToPuppeteer } from '../src/runner/executor.js';

describe('executor', () => {
  it('maps navigate action', () => {
    const mapped = mapActionToPuppeteer({ action: 'navigate', url: 'https://example.com' });
    expect(mapped.method).toBe('goto');
    expect(mapped.args).toEqual(['https://example.com', { waitUntil: 'networkidle0' }]);
  });

  it('maps click action', () => {
    const mapped = mapActionToPuppeteer({ action: 'click', selector: '#btn' });
    expect(mapped.method).toBe('click');
    expect(mapped.selector).toBe('#btn');
  });

  it('maps assertVisible action', () => {
    const mapped = mapActionToPuppeteer({ action: 'assertVisible', selector: '.header' });
    expect(mapped.method).toBe('waitForSelector');
    expect(mapped.selector).toBe('.header');
    expect(mapped.args).toEqual(['.header', { visible: true, timeout: 5000 }]);
  });

  it('maps step as noop', () => {
    const mapped = mapActionToPuppeteer({ action: 'step', label: 'Step 1' });
    expect(mapped.method).toBe('noop');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/runner/executor.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement executor, worker pool, reporter**

```ts
// src/runner/executor.ts
import type { Page } from 'puppeteer-core';
import type { TestAction } from '../domain/types.js';
import { ACTION_TIMEOUT_MS } from '../config/constants.js';

interface MappedAction {
  method: string;
  selector?: string;
  args?: unknown[];
}

export function mapActionToPuppeteer(action: TestAction): MappedAction {
  switch (action.action) {
    case 'navigate':
      return { method: 'goto', args: [action.url, { waitUntil: 'networkidle0' }] };
    case 'waitForLoad':
    case 'waitForNavigation':
      return { method: 'waitForNavigation', args: [{ waitUntil: 'networkidle0', timeout: ACTION_TIMEOUT_MS }] };
    case 'mouseover':
      return { method: 'hover', selector: action.selector };
    case 'click':
      return { method: 'click', selector: action.selector };
    case 'fill':
      return { method: 'type', selector: action.selector, args: [action.value] };
    case 'select':
      return { method: 'select', selector: action.selector, args: [action.value] };
    case 'check':
    case 'toggle':
      return { method: 'click', selector: action.selector };
    case 'scroll':
      return { method: 'evaluate', args: [`window.scrollBy(0, ${action.direction === 'up' ? -(action.amount || 500) : (action.amount || 500)})`] };
    case 'screenshot':
      return { method: 'screenshot', args: [{ path: `${action.label}.jpg` }] };
    case 'assertVisible':
      return { method: 'waitForSelector', selector: action.selector, args: [action.selector, { visible: true, timeout: 5000 }] };
    case 'assertNotVisible':
      return { method: 'waitForSelector', selector: action.selector, args: [action.selector, { hidden: true, timeout: 5000 }] };
    case 'assertUrl':
      return { method: 'assertUrl', args: [action.pattern] };
    case 'assertUrlChanged':
      return { method: 'assertUrlChanged' };
    case 'assertText':
      return { method: 'assertText', selector: action.selector, args: [action.text] };
    case 'check_email':
      return { method: 'checkEmail', args: [action.timeout || 60000] };
    case 'step':
      return { method: 'noop' };
    default:
      return { method: 'noop' };
  }
}

export async function executeTestCase(
  page: Page,
  actions: TestAction[],
): Promise<{ passed: boolean; error?: string; durationMs: number }> {
  const start = Date.now();
  const startUrl = page.url();

  try {
    for (const action of actions) {
      const mapped = mapActionToPuppeteer(action);

      switch (mapped.method) {
        case 'goto':
          await page.goto(mapped.args![0] as string, mapped.args![1] as any);
          break;
        case 'waitForNavigation':
          try { await page.waitForNavigation(mapped.args![0] as any); } catch {}
          break;
        case 'hover': {
          const el = await page.waitForSelector(mapped.selector!, { timeout: ACTION_TIMEOUT_MS });
          if (el) await el.hover();
          break;
        }
        case 'click': {
          const el = await page.waitForSelector(mapped.selector!, { timeout: ACTION_TIMEOUT_MS });
          if (el) await el.click();
          break;
        }
        case 'type': {
          const el = await page.waitForSelector(mapped.selector!, { timeout: ACTION_TIMEOUT_MS });
          if (el) await el.type(mapped.args![0] as string);
          break;
        }
        case 'select':
          await page.select(mapped.selector!, mapped.args![0] as string);
          break;
        case 'screenshot':
          await page.screenshot(mapped.args![0] as any);
          break;
        case 'waitForSelector':
          await page.waitForSelector(mapped.args![0] as string, mapped.args![1] as any);
          break;
        case 'assertUrl': {
          const pattern = mapped.args![0] as string;
          if (!page.url().includes(pattern)) {
            throw new Error(`URL assertion failed: expected "${pattern}" in "${page.url()}"`);
          }
          break;
        }
        case 'assertUrlChanged':
          if (page.url() === startUrl) {
            throw new Error(`URL did not change from ${startUrl}`);
          }
          break;
        case 'assertText': {
          const el = await page.waitForSelector(mapped.selector!, { timeout: ACTION_TIMEOUT_MS });
          const text = await el?.evaluate((e) => e.textContent || '');
          const expected = mapped.args![0] as string;
          if (!text?.includes(expected)) {
            throw new Error(`Text assertion failed: "${expected}" not found in "${text}"`);
          }
          break;
        }
        case 'evaluate':
          await page.evaluate(mapped.args![0] as string);
          break;
        case 'noop':
          break;
      }
    }

    return { passed: true, durationMs: Date.now() - start };
  } catch (err: any) {
    return { passed: false, error: err.message, durationMs: Date.now() - start };
  }
}
```

```ts
// src/runner/worker-pool.ts
import type { Browser } from 'puppeteer-core';
import type { TestAction, Screen } from '../domain/types.js';
import { executeTestCase } from './executor.js';
import * as testRunsRepo from '../db/repositories/test-runs.js';
import * as issuesRepo from '../db/repositories/issues.js';
import pino from 'pino';

const logger = pino({ name: 'worker-pool' });

interface TestJob {
  testCaseId: number;
  runId: number;
  actions: TestAction[];
  screen: Screen;
}

interface TestJobResult {
  testRunId: number;
  testCaseId: number;
  screen: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export async function runTestJobs(
  browser: Browser,
  jobs: TestJob[],
  concurrency: number = 3,
): Promise<TestJobResult[]> {
  const results: TestJobResult[] = [];
  let jobIndex = 0;

  async function worker(): Promise<void> {
    while (jobIndex < jobs.length) {
      const job = jobs[jobIndex++];
      if (!job) break;

      // Create Test Run record
      const testRun = await testRunsRepo.createTestRun({
        testCaseId: job.testCaseId,
        runId: job.runId,
        screen: job.screen.name,
      });

      const page = await browser.newPage();
      await page.setViewport({ width: job.screen.width, height: job.screen.height });

      let result = await executeTestCase(page, job.actions);

      // 1 retry on failure
      if (!result.passed) {
        logger.info({ testRunId: testRun.id, screen: job.screen.name }, 'retrying failed test');
        result = await executeTestCase(page, job.actions);
      }

      // Create issue if test failed
      if (!result.passed && result.error) {
        await issuesRepo.createIssue({
          runId: job.runId,
          actionId: 0, // no specific scanning action
          testCaseId: job.testCaseId,
          testRunId: testRun.id,
          type: 'error_on_page',
          description: result.error,
          reproductionSteps: job.actions,
        });
      }

      // Complete Test Run record
      await testRunsRepo.completeTestRun(testRun.id, {
        status: result.passed ? 'passed' : 'failed',
        durationMs: result.durationMs,
        errorMessage: result.error,
      });

      results.push({
        testRunId: testRun.id,
        testCaseId: job.testCaseId,
        screen: job.screen.name,
        passed: result.passed,
        error: result.error,
        durationMs: result.durationMs,
      });

      await page.close();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
```

```ts
// src/runner/reporter.ts
export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

export function computeSummary(results: Array<{ passed: boolean; durationMs: number }>): RunSummary {
  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    skipped: 0,
    durationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/runner/executor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/runner/ src/db/repositories/test-cases.ts src/db/repositories/test-runs.ts tests/runner/
git commit -m "feat: test executor, worker pool, and reporter"
```

---

### Task 18: Email + Deep Link

**Files:**
- Create: `src/email/deep-link.ts`
- Create: `src/email/templates.ts`
- Create: `src/email/sender.ts`
- Create: `src/db/repositories/report-emails.ts`
- Test: `tests/email/deep-link.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/email/deep-link.test.ts
import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../src/email/deep-link.js';

describe('deep-link', () => {
  const secret = 'test-secret-key-32-chars-long!!!';

  it('generates and verifies a token', async () => {
    const token = await generateToken(42, secret);
    expect(typeof token).toBe('string');
    const runId = await verifyToken(token, secret);
    expect(runId).toBe(42);
  });

  it('rejects invalid token', async () => {
    await expect(verifyToken('garbage', secret)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/email/deep-link.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement email modules**

```ts
// src/email/deep-link.ts
import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

export async function generateToken(runId: number, secret: string): Promise<string> {
  const key = encoder.encode(secret);
  return new SignJWT({ runId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(key);
}

export async function verifyToken(token: string, secret: string): Promise<number> {
  const key = encoder.encode(secret);
  const { payload } = await jwtVerify(token, key);
  return payload.runId as number;
}
```

```ts
// src/email/templates.ts
import type { RunSummary } from '../runner/reporter.js';

export function buildHtmlEmail(appName: string, targetUrl: string, summary: RunSummary, deepLinkUrl: string): string {
  return `
<html><body>
<h2>Test Report: ${appName}</h2>
<p>Target: <a href="${targetUrl}">${targetUrl}</a></p>
<table>
<tr><td>Total</td><td>${summary.total}</td></tr>
<tr><td>Passed</td><td>${summary.passed}</td></tr>
<tr><td>Failed</td><td>${summary.failed}</td></tr>
<tr><td>Duration</td><td>${(summary.durationMs / 1000).toFixed(1)}s</td></tr>
</table>
<p><a href="${deepLinkUrl}">View Full Results</a></p>
</body></html>`.trim();
}

export function buildTextEmail(appName: string, targetUrl: string, summary: RunSummary, deepLinkUrl: string): string {
  return `Test Report: ${appName}
Target: ${targetUrl}
Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed}
Duration: ${(summary.durationMs / 1000).toFixed(1)}s
View results: ${deepLinkUrl}`;
}
```

```ts
// src/email/sender.ts
import { ServerClient } from 'postmark';
import pino from 'pino';
import { loadConfig } from '../config/index.js';
import type { RunSummary } from '../runner/reporter.js';
import { buildHtmlEmail, buildTextEmail } from './templates.js';
import { generateToken } from './deep-link.js';

const logger = pino({ name: 'email-sender' });

export async function sendReportEmail(
  userEmail: string,
  appName: string,
  targetUrl: string,
  runId: number,
  summary: RunSummary,
): Promise<string> {
  const config = loadConfig();
  const token = await generateToken(runId, config.deepLinkSecret);
  const deepLinkUrl = `${config.appBaseUrl}/results/${token}`;

  const client = new ServerClient(config.postmarkServerToken);
  const html = buildHtmlEmail(appName, targetUrl, summary, deepLinkUrl);
  const text = buildTextEmail(appName, targetUrl, summary, deepLinkUrl);

  await client.sendEmail({
    From: config.postmarkFromEmail,
    To: userEmail,
    Subject: `Test Report: ${appName} — ${summary.passed}/${summary.total} passed`,
    HtmlBody: html,
    TextBody: text,
  });

  logger.info({ userEmail, runId }, 'report email sent');
  return token;
}
```

```ts
// src/db/repositories/report-emails.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { reportEmails } from '../schema.js';

export async function createReportEmail(runId: number, userEmail: string, deepLinkToken: string) {
  const db = getDb();
  const [record] = await db.insert(reportEmails).values({ runId, userEmail, deepLinkToken }).returning();
  return record;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/email/deep-link.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/email/ src/db/repositories/report-emails.ts tests/email/
git commit -m "feat: email reporting with deep link tokens"
```

---

### Task 19: API Contract + Worker Integration

This task replaces the earlier standalone API-server idea. The API remains in the existing `testomniac_api` Hono project. The scanner worker implementation lives in `~/projects/testomniac_scanner`; shared contract types live in `testomniac_types`; this project integrates against those contracts.

**Files:**
- Create: `src/worker/index.ts`
- Create: `src/db/repositories/issues.ts`
- Create: `src/db/repositories/test-cases.ts`
- Create: `src/db/repositories/test-runs.ts`

- [ ] **Step 1: Implement repositories**

```ts
// src/db/repositories/issues.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { issues } from '../schema.js';

export async function createIssue(params: {
  runId: number;
  actionId?: number;
  testCaseId?: number;
  testRunId?: number;
  type: string;
  description: string;
  reproductionSteps: unknown[];
  consoleLog?: string;
  networkLog?: string;
  screenshotPath?: string;
  pageId?: number;
  pageStateId?: number;
}) {
  const db = getDb();
  const [issue] = await db.insert(issues).values({
    ...params,
    reproductionSteps: params.reproductionSteps,
  }).returning();
  return issue;
}

export async function getIssuesByRun(runId: number) {
  const db = getDb();
  return db.query.issues.findMany({ where: eq(issues.runId, runId) });
}
```

```ts
// src/db/repositories/test-cases.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { testCases } from '../schema.js';
import type { TestCase } from '../../domain/types.js';

export async function insertTestCase(runId: number, tc: TestCase) {
  const db = getDb();
  const [row] = await db.insert(testCases).values({
    runId,
    name: tc.name,
    testType: tc.type,
    sizeClass: tc.sizeClass,
    suiteTags: tc.suite_tags,
    pageId: tc.page_id,
    personaId: tc.persona_id,
    useCaseId: tc.use_case_id,
    priority: tc.priority,
    actionsJson: tc.actions,
  }).returning();
  return row;
}

export async function getTestCasesByRun(runId: number) {
  const db = getDb();
  return db.query.testCases.findMany({ where: eq(testCases.runId, runId) });
}
```

```ts
// src/db/repositories/test-runs.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { testRuns } from '../schema.js';

export async function createTestRun(params: {
  testCaseId: number;
  runId: number;
  screen: string;
}) {
  const db = getDb();
  const [row] = await db.insert(testRuns).values({
    ...params,
    status: 'running',
  }).returning();
  return row;
}

export async function completeTestRun(testRunId: number, result: {
  status: string;
  durationMs: number;
  errorMessage?: string;
  screenshotPath?: string;
  consoleLog?: string;
  networkLog?: string;
}) {
  const db = getDb();
  await db.update(testRuns).set({
    ...result,
    completedAt: new Date(),
  }).where(eq(testRuns.id, testRunId));
}

export async function getTestRunsByRun(runId: number) {
  const db = getDb();
  return db.query.testRuns.findMany({ where: eq(testRuns.runId, runId) });
}
```

- [ ] **Step 2: Define API contract**

```ts
// testomniac_types/src/models/api.ts
export interface CreateScanRequest {
  url: string;
  email?: string;
  sizeClass?: 'desktop' | 'mobile';
  credentials?: {
    username?: string;
    email?: string;
    password: string;
    twoFactorCode?: string;
  };
  reportEmail?: string;
  plugins?: string[];
}

export interface CreateScanResponse {
  status: 'pending' | 'duplicate_owned' | 'duplicate_unclaimed' | 'validation_error';
  runId?: number;
  projectId?: number;
  message?: string;
  streamPath?: string;
  suggestedNextStep?: 'watch_progress' | 'contact_owner' | 'claim_project';
}

export interface RunStreamEvent {
  runId: number;
  type:
    | 'run_started'
    | 'phase_changed'
    | 'page_discovered'
    | 'page_state_created'
    | 'action_completed'
    | 'issue_detected'
    | 'run_completed'
    | 'run_failed';
  payload: Record<string, unknown>;
  createdAt: string;
}
```

The scanner and API may re-export these locally for convenience, but `testomniac_types` is the source of truth.

- [ ] **Step 3: Implement worker entrypoint**

`src/worker/index.ts` should:
- poll the `runs` table for `pending` work
- atomically claim a run and mark it `running`
- invoke the orchestrator
- write progress events with PostgreSQL `NOTIFY`
- mark the run `completed` or `failed`

The worker must be restart-safe and independent from API process lifetime.

- [ ] **Step 4: Commit**

```bash
git add src/worker/index.ts src/db/repositories/issues.ts src/db/repositories/test-cases.ts src/db/repositories/test-runs.ts
git commit -m "feat: worker integration against shared API contracts"
```

---

### Task 20: Orchestrator

**Files:**
- Create: `src/orchestrator.ts`

- [ ] **Step 1: Implement orchestrator**

```ts
// src/orchestrator.ts
import pino from 'pino';
import { ChromiumManager } from './browser/chromium.js';
import { loadConfig } from './config/index.js';
import { runMouseScanner } from './scanner/mouse-scanner.js';
import { runAiAnalysis } from './ai/analyzer.js';
import { runInputScanner } from './scanner/input-scanner.js';
import { generateTestCases } from './generation/generator.js';
import { runTestJobs } from './runner/worker-pool.js';
import { computeSummary } from './runner/reporter.js';
import { sendReportEmail } from './email/sender.js';
import * as projectsRepo from './db/repositories/projects.js';
import * as appsRepo from './db/repositories/apps.js';
import * as runsRepo from './db/repositories/runs.js';
import * as testCasesRepo from './db/repositories/test-cases.js';
import * as reportEmailsRepo from './db/repositories/report-emails.js';
import { SizeClass, DESKTOP_SCREENS, MOBILE_SCREENS } from './domain/types.js';
import type { Credentials, Screen } from './domain/types.js';

const logger = pino({ name: 'orchestrator' });

function elapsed(start: number): number {
  return Date.now() - start;
}

export interface RunOptions {
  entityId?: string;
  projectName?: string;
  url: string;
  appName?: string;
  credentials?: Credentials;
  userEmail?: string;
  sizeClasses?: SizeClass[];
}

export async function runFullScan(options: RunOptions): Promise<number> {
  const config = loadConfig();
  const { entityId, url, credentials, userEmail } = options;
  const appName = options.appName || new URL(url).hostname;
  const projectName = options.projectName || appName;
  const sizeClasses = options.sizeClasses || [SizeClass.Desktop];

  const runStart = Date.now();

  // Create or reuse project and app based on normalized URL ownership rules
  const normalizedUrl = normalizeBaseUrl(url);
  const existing = await projectsRepo.findProjectByNormalizedUrl(normalizedUrl);
  if (existing?.entityId) {
    throw new Error('duplicate_owned_project');
  }
  if (existing && !existing.entityId) {
    throw new Error('duplicate_unclaimed_project');
  }

  const project = await projectsRepo.createProject({
    entityId: entityId ?? null,
    name: projectName,
    contactEmail: userEmail,
  });
  const app = await appsRepo.createApp(project.id, appName, url, normalizedUrl);
  const chromium = new ChromiumManager(config);
  const browser = await chromium.launch();

  try {
    for (const sizeClass of sizeClasses) {
      const run = await runsRepo.createRun(app.id, sizeClass);
      const defaultScreen: Screen = sizeClass === SizeClass.Desktop
        ? DESKTOP_SCREENS[0]
        : MOBILE_SCREENS[0];
      const page = await chromium.newPage(defaultScreen);

      // Phase 1a: Mouse-only scanning
      logger.info({ phase: '1a', sizeClass }, 'starting mouse scanning');
      await runsRepo.updateRunPhase(run.id, 'mouse_scanning');
      let phaseStart = Date.now();
      await runMouseScanner(page, {
        appId: app.id,
        runId: run.id,
        baseUrl: url,
        sizeClass,
      });
      await runsRepo.updatePhaseDuration(run.id, 'mouseScanningDurationMs', elapsed(phaseStart));

      // Phase 1b: AI analysis
      logger.info({ phase: '1b' }, 'starting AI analysis');
      await runsRepo.updateRunPhase(run.id, 'ai_analysis');
      phaseStart = Date.now();
      await runAiAnalysis({
        appId: app.id,
        runId: run.id,
        forms: [], // TODO: collect forms from scanning
      });
      await runsRepo.updatePhaseDuration(run.id, 'aiAnalysisDurationMs', elapsed(phaseStart));

      // Phase 1c: Input scanning
      logger.info({ phase: '1c' }, 'starting input scanning');
      await runsRepo.updateRunPhase(run.id, 'input_scanning');
      phaseStart = Date.now();
      await runInputScanner(page, {
        appId: app.id,
        runId: run.id,
        sizeClass,
        forms: [], // TODO: collect forms from scanning
      });
      await runsRepo.updatePhaseDuration(run.id, 'inputScanningDurationMs', elapsed(phaseStart));

      // Phase 2: Auth scanning
      // TODO: implement auth flow with credentials or Signic
      // await runsRepo.updatePhaseDuration(run.id, 'authScanningDurationMs', elapsed(phaseStart));

      // Phase 3: Test generation
      logger.info({ phase: '3' }, 'generating test cases');
      await runsRepo.updateRunPhase(run.id, 'test_generation');
      phaseStart = Date.now();
      const testCases = await generateTestCases({
        appId: app.id,
        runId: run.id,
        sizeClass,
      });
      const savedCases = [];
      for (const tc of testCases) {
        const saved = await testCasesRepo.insertTestCase(run.id, tc);
        savedCases.push(saved);
      }
      await runsRepo.updatePhaseDuration(run.id, 'testGenerationDurationMs', elapsed(phaseStart));

      // Phase 4: Test execution (creates Test Runs per test case x screen)
      logger.info({ phase: '4', testCount: savedCases.length }, 'executing tests');
      await runsRepo.updateRunPhase(run.id, 'test_execution');
      phaseStart = Date.now();

      const screens = sizeClass === SizeClass.Desktop ? DESKTOP_SCREENS : MOBILE_SCREENS;
      const jobs = savedCases.flatMap((tc) =>
        screens.map((screen) => ({
          testCaseId: tc.id,
          runId: run.id,
          actions: tc.actionsJson as any[],
          screen,
        }))
      );

      const results = await runTestJobs(browser, jobs);
      await runsRepo.updatePhaseDuration(run.id, 'testExecutionDurationMs', elapsed(phaseStart));

      // Send email report
      if (userEmail) {
        const summary = computeSummary(results);
        const token = await sendReportEmail(userEmail, appName, url, run.id, summary);
        await reportEmailsRepo.createReportEmail(run.id, userEmail, token);
      }

      await runsRepo.completeRun(run.id, undefined, elapsed(runStart));
      await page.close();

      logger.info({ runId: run.id, sizeClass, totalDurationMs: elapsed(runStart) }, 'run complete');
    }
  } finally {
    await chromium.close();
  }

  return project.id;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/orchestrator.ts
git commit -m "feat: orchestrator wiring all phases together"
```

---

### Task 21: Projects Repository + AI Token Tracker

**Files:**
- Create: `src/db/repositories/projects.ts`
- Create: `src/db/repositories/ai-usage.ts`
- Create: `src/ai/token-tracker.ts`
- Create: `src/domain/url-ownership.ts`

- [ ] **Step 1: Implement projects repository**

```ts
// src/db/repositories/projects.ts
import { eq, isNull } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { projects } from '../schema.js';

export async function createProject(input: {
  entityId?: string | null;
  name: string;
  description?: string;
  contactEmail?: string;
}) {
  const db = getDb();
  const [project] = await db.insert(projects).values({
    entityId: input.entityId ?? null,
    name: input.name,
    description: input.description,
    contactEmail: input.contactEmail,
  }).returning();
  return project;
}

export async function getProjectsByEntity(entityId: string) {
  const db = getDb();
  return db.query.projects.findMany({ where: eq(projects.entityId, entityId) });
}

export async function getProject(id: number) {
  const db = getDb();
  return db.query.projects.findFirst({ where: eq(projects.id, id) });
}

export async function getUnclaimedProjects() {
  const db = getDb();
  return db.query.projects.findMany({ where: isNull(projects.entityId) });
}
```

- [ ] **Step 2: Implement URL ownership helpers**

`src/domain/url-ownership.ts` should provide:
- `normalizeBaseUrl(url)` for duplicate detection
- `getRegistrableDomain(url)` for domain matching
- `emailMatchesUrlDomain(email, url)` validation
- `classifyProjectOwnership(existingProject)` returning:
  - `new_project`
  - `duplicate_owned`
  - `duplicate_unclaimed`

- [ ] **Step 3: Implement AI usage repository**

```ts
// src/db/repositories/ai-usage.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { aiUsage } from '../schema.js';

export async function recordAiUsage(params: {
  runId: number;
  phase: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  purpose?: string;
}) {
  const db = getDb();
  const [row] = await db.insert(aiUsage).values(params).returning();
  return row;
}

export async function getAiUsageByRun(runId: number) {
  const db = getDb();
  return db.query.aiUsage.findMany({ where: eq(aiUsage.runId, runId) });
}

export async function getTotalTokensByRun(runId: number): Promise<{ promptTokens: number; completionTokens: number; totalTokens: number }> {
  const usage = await getAiUsageByRun(runId);
  return {
    promptTokens: usage.reduce((sum, u) => sum + u.promptTokens, 0),
    completionTokens: usage.reduce((sum, u) => sum + u.completionTokens, 0),
    totalTokens: usage.reduce((sum, u) => sum + u.totalTokens, 0),
  };
}
```

- [ ] **Step 4: Implement token tracker wrapper**

```ts
// src/ai/token-tracker.ts
import type OpenAI from 'openai';
import * as aiUsageRepo from '../db/repositories/ai-usage.js';

export async function trackOpenAiCall(
  runId: number,
  phase: string,
  purpose: string,
  callFn: () => Promise<OpenAI.Chat.Completions.ChatCompletion>,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const response = await callFn();
  const usage = response.usage;
  if (usage) {
    await aiUsageRepo.recordAiUsage({
      runId,
      phase,
      model: response.model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      purpose,
    });
  }
  return response;
}
```

- [ ] **Step 5: Update apps repository to accept projectId + normalizedBaseUrl**

```ts
// src/db/repositories/apps.ts — update createApp
export async function createApp(projectId: number, name: string, baseUrl: string, normalizedBaseUrl: string) {
  const db = getDb();
  const [app] = await db.insert(apps).values({ projectId, name, baseUrl, normalizedBaseUrl }).returning();
  return app;
}
```

- [ ] **Step 6: Update runs repository to support phase duration updates**

Add to `src/db/repositories/runs.ts`:

```ts
export async function updatePhaseDuration(runId: number, field: string, durationMs: number) {
  const db = getDb();
  await db.update(runs).set({ [field]: durationMs }).where(eq(runs.id, runId));
}

export async function completeRun(runId: number, aiSummary?: string, totalDurationMs?: number) {
  const db = getDb();
  await db.update(runs).set({
    status: 'completed',
    endedAt: new Date(),
    aiSummary,
    totalDurationMs,
  }).where(eq(runs.id, runId));
}
```

- [ ] **Step 7: Commit**

```bash
git add src/db/repositories/projects.ts src/db/repositories/ai-usage.ts src/ai/token-tracker.ts src/domain/url-ownership.ts
git commit -m "feat: project ownership rules, URL normalization, and AI token tracking"
```

---

### Task 22: Email Detector + Email Checker

**Files:**
- Create: `src/scanner/email-detector.ts`
- Create: `src/scanner/email-checker.ts`
- Test: `tests/scanner/email-detector.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/scanner/email-detector.test.ts
import { describe, it, expect } from 'vitest';
import { detectEmailHint, detectEmailConfirmation } from '../src/scanner/email-detector.js';

describe('email-detector', () => {
  it('detects email hint when form has email field and hint text', () => {
    const result = detectEmailHint(
      true,
      "Enter your email and we'll send you a verification link",
    );
    expect(result).toBe(true);
  });

  it('does not detect hint without email field', () => {
    const result = detectEmailHint(
      false,
      "We'll send you an email",
    );
    expect(result).toBe(false);
  });

  it('does not detect hint without matching text', () => {
    const result = detectEmailHint(true, 'Enter your email address');
    expect(result).toBe(false);
  });

  it('detects email confirmation text after submission', () => {
    expect(detectEmailConfirmation('Please check your inbox')).toBe(true);
    expect(detectEmailConfirmation("We've sent a confirmation email")).toBe(true);
    expect(detectEmailConfirmation('Welcome to our site')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/scanner/email-detector.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement email detector**

```ts
// src/scanner/email-detector.ts
import { EMAIL_HINT_PATTERNS, EMAIL_CONFIRMATION_PATTERNS } from '../config/constants.js';

export function detectEmailHint(hasEmailField: boolean, visibleText: string): boolean {
  if (!hasEmailField) return false;
  const lower = visibleText.toLowerCase();
  return EMAIL_HINT_PATTERNS.some((p) => lower.includes(p));
}

export function detectEmailConfirmation(visibleText: string): boolean {
  const lower = visibleText.toLowerCase();
  return EMAIL_CONFIRMATION_PATTERNS.some((p) => lower.includes(p));
}
```

- [ ] **Step 4: Implement email checker**

```ts
// src/scanner/email-checker.ts
import { SignicClient } from '@sudobility/signic_sdk';
import type { Page } from 'puppeteer-core';
import pino from 'pino';
import { EMAIL_CHECK_TIMEOUT_MS, EMAIL_CHECK_INTERVAL_MS } from '../config/constants.js';

const logger = pino({ name: 'email-checker' });

export interface EmailCheckResult {
  received: boolean;
  otp?: string;
  link?: string;
  rawText?: string;
}

export async function checkEmail(client: SignicClient): Promise<EmailCheckResult> {
  const deadline = Date.now() + EMAIL_CHECK_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { emails } = await client.getUnreadEmails(5);
    if (emails.length > 0) {
      const full = await client.getEmail(emails[0].id);
      await client.markAsRead(emails[0].id);
      const body = full.text || full.html?.join('') || '';

      // Extract OTP (4-8 digit code)
      const otpMatch = body.match(/\b(\d{4,8})\b/);
      // Extract verification/action link
      const linkMatch = body.match(/https?:\/\/[^\s"'<>]+(verify|confirm|activate|reset)[^\s"'<>]*/i);

      logger.info({
        hasOtp: !!otpMatch,
        hasLink: !!linkMatch,
        subject: full.subject,
      }, 'email received');

      return {
        received: true,
        otp: otpMatch?.[1],
        link: linkMatch?.[0],
        rawText: body.slice(0, 500),
      };
    }
    await new Promise((r) => setTimeout(r, EMAIL_CHECK_INTERVAL_MS));
  }

  logger.warn('email check timed out');
  return { received: false };
}

export async function actOnEmail(
  page: Page,
  result: EmailCheckResult,
): Promise<boolean> {
  if (!result.received) return false;

  if (result.otp) {
    // Find OTP input and fill
    const otpSelectors = [
      'input[name*="code"]', 'input[name*="otp"]', 'input[name*="verification"]',
      'input[placeholder*="code"]', 'input[type="number"]',
    ];
    for (const sel of otpSelectors) {
      try {
        const el = await page.waitForSelector(sel, { timeout: 3000, visible: true });
        if (el) {
          await el.type(result.otp);
          await page.keyboard.press('Enter');
          try { await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10_000 }); } catch {}
          return true;
        }
      } catch { continue; }
    }
  }

  if (result.link) {
    await page.goto(result.link, { waitUntil: 'networkidle0', timeout: 15_000 });
    return true;
  }

  return false;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bunx vitest run tests/scanner/email-detector.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/scanner/email-detector.ts src/scanner/email-checker.ts tests/scanner/email-detector.test.ts
git commit -m "feat: email detection and checking via Signic"
```

---

### Task 23: Phase Timer Utility

**Files:**
- Create: `src/scanner/phase-timer.ts`
- Test: `tests/scanner/phase-timer.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/scanner/phase-timer.test.ts
import { describe, it, expect } from 'vitest';
import { PhaseTimer } from '../src/scanner/phase-timer.js';

describe('PhaseTimer', () => {
  it('tracks phase duration', async () => {
    const timer = new PhaseTimer();
    timer.startPhase('mouse_scanning');
    await new Promise((r) => setTimeout(r, 50));
    const duration = timer.endPhase('mouse_scanning');
    expect(duration).toBeGreaterThanOrEqual(40);
    expect(duration).toBeLessThan(200);
  });

  it('tracks total duration', async () => {
    const timer = new PhaseTimer();
    await new Promise((r) => setTimeout(r, 50));
    const total = timer.totalElapsed();
    expect(total).toBeGreaterThanOrEqual(40);
  });

  it('returns all phase durations', () => {
    const timer = new PhaseTimer();
    timer.startPhase('a');
    timer.endPhase('a');
    timer.startPhase('b');
    timer.endPhase('b');
    const durations = timer.getAllDurations();
    expect(durations).toHaveProperty('a');
    expect(durations).toHaveProperty('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/scanner/phase-timer.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement phase timer**

```ts
// src/scanner/phase-timer.ts

export class PhaseTimer {
  private startTime = Date.now();
  private phases = new Map<string, { start: number; end?: number }>();

  startPhase(name: string): void {
    this.phases.set(name, { start: Date.now() });
  }

  endPhase(name: string): number {
    const phase = this.phases.get(name);
    if (!phase) throw new Error(`Phase "${name}" not started`);
    phase.end = Date.now();
    return phase.end - phase.start;
  }

  totalElapsed(): number {
    return Date.now() - this.startTime;
  }

  getAllDurations(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, phase] of this.phases) {
      if (phase.end) {
        result[name] = phase.end - phase.start;
      }
    }
    return result;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/scanner/phase-timer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scanner/phase-timer.ts tests/scanner/phase-timer.test.ts
git commit -m "feat: phase timer utility"
```

---

### Task 24: Password Requirement Detector + Test Generator

**Files:**
- Create: `src/auth/password-detector.ts`
- Test: `tests/auth/password-detector.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/auth/password-detector.test.ts
import { describe, it, expect } from 'vitest';
import {
  detectPasswordRequirements,
  generatePasswordTestCases,
} from '../src/auth/password-detector.js';

describe('password-detector', () => {
  it('detects minimum length', () => {
    const reqs = detectPasswordRequirements('Password must be at least 8 characters');
    expect(reqs.minLength).toBe(8);
  });

  it('detects uppercase requirement', () => {
    const reqs = detectPasswordRequirements('Must contain an uppercase letter');
    expect(reqs.requiresUppercase).toBe(true);
  });

  it('detects multiple requirements', () => {
    const text = 'Password must be at least 10 characters, contain uppercase, lowercase, a number, and a special character. No spaces allowed.';
    const reqs = detectPasswordRequirements(text);
    expect(reqs.minLength).toBe(10);
    expect(reqs.requiresUppercase).toBe(true);
    expect(reqs.requiresLowercase).toBe(true);
    expect(reqs.requiresNumber).toBe(true);
    expect(reqs.requiresSpecial).toBe(true);
    expect(reqs.noSpaces).toBe(true);
  });

  it('returns defaults when no requirements detected', () => {
    const reqs = detectPasswordRequirements('Create your account');
    expect(reqs.minLength).toBeUndefined();
    expect(reqs.requiresUppercase).toBe(false);
  });

  it('generates fail cases before pass case', () => {
    const reqs = detectPasswordRequirements('At least 8 characters, must include uppercase and a number');
    const cases = generatePasswordTestCases(reqs);
    const failCases = cases.filter((c) => c.shouldFail);
    const passCases = cases.filter((c) => !c.shouldFail);
    expect(failCases.length).toBeGreaterThanOrEqual(2); // too short, no uppercase, no number
    expect(passCases.length).toBe(1);
    // Fail cases come first
    const firstPassIndex = cases.findIndex((c) => !c.shouldFail);
    const lastFailIndex = cases.length - 1 - [...cases].reverse().findIndex((c) => c.shouldFail);
    expect(firstPassIndex).toBeGreaterThan(lastFailIndex);
  });

  it('generates too-short password', () => {
    const reqs = detectPasswordRequirements('At least 8 characters');
    const cases = generatePasswordTestCases(reqs);
    const tooShort = cases.find((c) => c.description.includes('too short'));
    expect(tooShort).toBeDefined();
    expect(tooShort!.password.length).toBeLessThan(8);
    expect(tooShort!.shouldFail).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/auth/password-detector.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement password detector**

```ts
// src/auth/password-detector.ts

export interface PasswordRequirements {
  minLength?: number;
  requiresUppercase: boolean;
  requiresLowercase: boolean;
  requiresNumber: boolean;
  requiresSpecial: boolean;
  noSpaces: boolean;
}

export interface PasswordTestCase {
  password: string;
  description: string;
  shouldFail: boolean;
}

export function detectPasswordRequirements(visibleText: string): PasswordRequirements {
  const lower = visibleText.toLowerCase();
  const reqs: PasswordRequirements = {
    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,
    noSpaces: false,
  };

  // Min length: "at least N characters", "minimum N characters", "N+ characters"
  const lengthMatch = lower.match(/(?:at least|minimum|min\.?)\s*(\d+)\s*character/i)
    || lower.match(/(\d+)\+?\s*character/i);
  if (lengthMatch) {
    reqs.minLength = parseInt(lengthMatch[1]);
  }

  if (/uppercase|capital letter/i.test(lower)) reqs.requiresUppercase = true;
  if (/lowercase/i.test(lower)) reqs.requiresLowercase = true;
  if (/number|digit|\d/i.test(lower) && /must|require|contain|include/i.test(lower)) reqs.requiresNumber = true;
  if (/special character|symbol|[!@#$%^&*]/i.test(lower) && /must|require|contain|include/i.test(lower)) reqs.requiresSpecial = true;
  if (/no\s*spaces/i.test(lower)) reqs.noSpaces = true;

  return reqs;
}

export function generatePasswordTestCases(reqs: PasswordRequirements): PasswordTestCase[] {
  const cases: PasswordTestCase[] = [];
  const goodLength = Math.max(reqs.minLength || 8, 8);

  // Build a valid password that satisfies all requirements
  let validPassword = 'Aa1!';
  while (validPassword.length < goodLength) {
    validPassword += 'xY2@'.charAt(validPassword.length % 4);
  }

  // Fail cases — one per requirement violation
  if (reqs.minLength) {
    const tooShort = validPassword.slice(0, reqs.minLength - 1);
    cases.push({
      password: tooShort,
      description: `too short (${tooShort.length} chars, need ${reqs.minLength})`,
      shouldFail: true,
    });
  }

  if (reqs.requiresUppercase) {
    cases.push({
      password: validPassword.toLowerCase(),
      description: 'no uppercase letter',
      shouldFail: true,
    });
  }

  if (reqs.requiresLowercase) {
    cases.push({
      password: validPassword.toUpperCase(),
      description: 'no lowercase letter',
      shouldFail: true,
    });
  }

  if (reqs.requiresNumber) {
    cases.push({
      password: validPassword.replace(/\d/g, 'a'),
      description: 'no number',
      shouldFail: true,
    });
  }

  if (reqs.requiresSpecial) {
    cases.push({
      password: validPassword.replace(/[^a-zA-Z0-9]/g, 'a'),
      description: 'no special character',
      shouldFail: true,
    });
  }

  if (reqs.noSpaces) {
    cases.push({
      password: validPassword.slice(0, 4) + ' ' + validPassword.slice(4),
      description: 'contains space',
      shouldFail: true,
    });
  }

  // Pass case — last
  cases.push({
    password: validPassword,
    description: 'valid password satisfying all requirements',
    shouldFail: false,
  });

  return cases;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/auth/password-detector.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/auth/password-detector.ts tests/auth/password-detector.test.ts
git commit -m "feat: password requirement detection and test case generation"
```

---

### Task 25: Loop Guard + Scroll Scanner + Dialog Handler

**Files:**
- Create: `src/scanner/loop-guard.ts`
- Create: `src/scanner/scroll-scanner.ts`
- Test: `tests/scanner/loop-guard.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/scanner/loop-guard.test.ts
import { describe, it, expect } from 'vitest';
import { LoopGuard } from '../src/scanner/loop-guard.js';

describe('LoopGuard', () => {
  it('allows new action signatures', () => {
    const guard = new LoopGuard();
    expect(guard.shouldCreate('mouseover', 1, 5)).toBe(true);
  });

  it('blocks duplicate signatures', () => {
    const guard = new LoopGuard();
    guard.record('mouseover', 1, 5);
    expect(guard.shouldCreate('mouseover', 1, 5)).toBe(false);
  });

  it('allows same type with different items', () => {
    const guard = new LoopGuard();
    guard.record('mouseover', 1, 5);
    expect(guard.shouldCreate('mouseover', 2, 5)).toBe(true);
  });

  it('enforces max actions per page state', () => {
    const guard = new LoopGuard({ maxActionsPerPageState: 3 });
    guard.record('mouseover', 1, 10);
    guard.record('mouseover', 2, 10);
    guard.record('mouseover', 3, 10);
    expect(guard.shouldCreate('mouseover', 4, 10)).toBe(false);
  });

  it('enforces max total actions', () => {
    const guard = new LoopGuard({ maxTotalActions: 2 });
    guard.record('mouseover', 1, 5);
    guard.record('click', 1, 5);
    expect(guard.shouldCreate('mouseover', 2, 6)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/scanner/loop-guard.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement loop guard**

```ts
// src/scanner/loop-guard.ts

export interface LoopGuardOptions {
  maxActionsPerPageState?: number;
  maxTotalActions?: number;
  maxPages?: number;
}

export class LoopGuard {
  private signatures = new Set<string>();
  private pageStateCounts = new Map<number, number>();
  private totalActions = 0;
  private maxPerState: number;
  private maxTotal: number;

  constructor(options: LoopGuardOptions = {}) {
    this.maxPerState = options.maxActionsPerPageState ?? 200;
    this.maxTotal = options.maxTotalActions ?? 5000;
  }

  private sig(type: string, itemId: number, pageStateId: number): string {
    return `${type}:${itemId}:${pageStateId}`;
  }

  shouldCreate(type: string, itemId: number, pageStateId: number): boolean {
    if (this.totalActions >= this.maxTotal) return false;
    const count = this.pageStateCounts.get(pageStateId) || 0;
    if (count >= this.maxPerState) return false;
    if (this.signatures.has(this.sig(type, itemId, pageStateId))) return false;
    return true;
  }

  record(type: string, itemId: number, pageStateId: number): void {
    this.signatures.add(this.sig(type, itemId, pageStateId));
    this.pageStateCounts.set(pageStateId, (this.pageStateCounts.get(pageStateId) || 0) + 1);
    this.totalActions++;
  }

  getTotalActions(): number {
    return this.totalActions;
  }
}
```

- [ ] **Step 4: Implement scroll scanner**

```ts
// src/scanner/scroll-scanner.ts
import type { Page } from 'puppeteer-core';
import pino from 'pino';

const logger = pino({ name: 'scroll-scanner' });

export async function scrollAndDiscoverElements(page: Page): Promise<number> {
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrolled = 0;
  let newElementsFound = 0;
  const knownCount = await page.evaluate((sel: string) =>
    document.querySelectorAll(sel).length,
    'a[href], button, input, select, textarea, [role="button"], [role="link"]',
  );

  while (scrolled < totalHeight) {
    await page.evaluate((delta: number) => window.scrollBy(0, delta), viewportHeight);
    scrolled += viewportHeight;
    await new Promise((r) => setTimeout(r, 500));

    const currentCount = await page.evaluate((sel: string) =>
      document.querySelectorAll(sel).length,
      'a[href], button, input, select, textarea, [role="button"], [role="link"]',
    );
    if (currentCount > knownCount + newElementsFound) {
      newElementsFound = currentCount - knownCount;
      logger.debug({ newElements: newElementsFound, scrolled }, 'found new elements after scroll');
    }
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  return newElementsFound;
}
```

- [ ] **Step 5: Add dialog handler to chromium.ts**

Add to `ChromiumManager.newPage()` in `src/browser/chromium.ts`:

```ts
// After creating the page, register dialog handler
page.on('dialog', async (dialog) => {
  logger.debug({ type: dialog.type(), message: dialog.message() }, 'auto-handling dialog');
  await dialog.accept();
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `bunx vitest run tests/scanner/loop-guard.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/scanner/loop-guard.ts src/scanner/scroll-scanner.ts tests/scanner/loop-guard.test.ts
git commit -m "feat: loop guard, scroll scanner, dialog handler"
```

---

### Task 26: Form Negative Test Template

**Files:**
- Create: `src/generation/form-negative.ts`
- Test: `tests/generation/form-negative.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/generation/form-negative.test.ts
import { describe, it, expect } from 'vitest';
import { generateFormNegativeTests } from '../src/generation/form-negative.js';

describe('form-negative template', () => {
  it('generates one test per required field', () => {
    const tests = generateFormNegativeTests({
      pageName: 'Contact',
      url: 'https://example.com/contact',
      sizeClass: 'desktop',
      priority: 'normal',
      fields: [
        { selector: '[name="name"]', name: 'name', type: 'text', label: 'Name', required: true },
        { selector: '[name="email"]', name: 'email', type: 'email', label: 'Email', required: true },
        { selector: '[name="msg"]', name: 'msg', type: 'textarea', label: 'Message', required: false },
      ],
      submitSelector: 'button[type="submit"]',
      validValues: { name: 'Jane', email: 'jane@example.com', msg: 'Hello' },
    });

    // One test for missing 'name', one for missing 'email'
    expect(tests).toHaveLength(2);
    expect(tests[0].name).toContain('missing name');
    expect(tests[1].name).toContain('missing email');
    // Each should fill all fields EXCEPT the one being tested
    const nameTest = tests[0];
    const fillActions = nameTest.actions.filter((a: any) => a.action === 'fill');
    const filledSelectors = fillActions.map((a: any) => a.selector);
    expect(filledSelectors).not.toContain('[name="name"]');
    expect(filledSelectors).toContain('[name="email"]');
  });

  it('returns empty for forms with no required fields', () => {
    const tests = generateFormNegativeTests({
      pageName: 'Search',
      url: 'https://example.com/search',
      sizeClass: 'desktop',
      priority: 'normal',
      fields: [
        { selector: '[name="q"]', name: 'q', type: 'text', label: 'Search', required: false },
      ],
      submitSelector: 'button',
      validValues: { q: 'test' },
    });
    expect(tests).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/generation/form-negative.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement form negative template**

```ts
// src/generation/form-negative.ts
import type { TestAction, TestCase, SizeClass } from '../domain/types.js';
import { assignSuiteTags } from './suite-tagger.js';
import type { FormField } from '../domain/types.js';

interface FormNegativeInput {
  pageName: string;
  url: string;
  sizeClass: SizeClass;
  priority: string;
  fields: FormField[];
  submitSelector?: string;
  validValues: Record<string, string>;
}

export function generateFormNegativeTests(input: FormNegativeInput): TestCase[] {
  const requiredFields = input.fields.filter((f) => f.required);
  if (requiredFields.length === 0) return [];

  return requiredFields.map((skippedField) => {
    const actions: TestAction[] = [
      { action: 'navigate', url: input.url },
      { action: 'waitForLoad' },
    ];

    // Fill all fields except the one we're testing
    for (const field of input.fields) {
      if (field.selector === skippedField.selector) continue;
      const value = input.validValues[field.name] || 'test';
      actions.push({ action: 'fill', selector: field.selector, value });
    }

    if (input.submitSelector) {
      actions.push({ action: 'click', selector: input.submitSelector });
    }

    // Assert form didn't proceed (URL should not change)
    actions.push({ action: 'assertUrl', pattern: new URL(input.url).pathname });

    return {
      name: `Form Negative — ${input.pageName} (missing ${skippedField.name})`,
      type: 'form_negative' as any,
      sizeClass: input.sizeClass,
      suite_tags: assignSuiteTags('form', input.priority),
      priority: input.priority,
      actions,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/generation/form-negative.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/generation/form-negative.ts tests/generation/form-negative.test.ts
git commit -m "feat: form negative test template"
```

---

### Task 27: Password Test Template

**Files:**
- Create: `src/generation/password.ts`
- Test: `tests/generation/password.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/generation/password.test.ts
import { describe, it, expect } from 'vitest';
import { generatePasswordTests } from '../src/generation/password.js';

describe('password template', () => {
  it('generates fail cases before pass case', () => {
    const tests = generatePasswordTests({
      pageName: 'Sign Up',
      url: 'https://example.com/signup',
      sizeClass: 'desktop',
      emailSelector: '[name="email"]',
      passwordSelector: '[name="password"]',
      submitSelector: 'button[type="submit"]',
      emailValue: 'test@example.com',
      passwordCases: [
        { password: 'short', description: 'too short', shouldFail: true },
        { password: 'nouppercase1!', description: 'no uppercase', shouldFail: true },
        { password: 'ValidPass1!', description: 'valid password', shouldFail: false },
      ],
    });

    expect(tests).toHaveLength(3);
    // Fail cases first
    expect(tests[0].name).toContain('too short');
    expect(tests[0].type).toBe('password');
    expect(tests[1].name).toContain('no uppercase');
    // Pass case last
    expect(tests[2].name).toContain('valid password');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/generation/password.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement password test template**

```ts
// src/generation/password.ts
import type { TestAction, TestCase, SizeClass } from '../domain/types.js';
import type { PasswordTestCase } from '../auth/password-detector.js';

interface PasswordTestInput {
  pageName: string;
  url: string;
  sizeClass: SizeClass;
  emailSelector: string;
  passwordSelector: string;
  submitSelector?: string;
  emailValue: string;
  passwordCases: PasswordTestCase[];
}

export function generatePasswordTests(input: PasswordTestInput): TestCase[] {
  // Sort: fail cases first, pass cases last
  const sorted = [...input.passwordCases].sort((a, b) => {
    if (a.shouldFail && !b.shouldFail) return -1;
    if (!a.shouldFail && b.shouldFail) return 1;
    return 0;
  });

  return sorted.map((pc) => {
    const actions: TestAction[] = [
      { action: 'navigate', url: input.url },
      { action: 'waitForLoad' },
      { action: 'fill', selector: input.emailSelector, value: input.emailValue },
      { action: 'fill', selector: input.passwordSelector, value: pc.password },
    ];

    if (input.submitSelector) {
      actions.push({ action: 'click', selector: input.submitSelector });
    }

    if (pc.shouldFail) {
      // Should stay on signup page
      actions.push({ action: 'assertUrl', pattern: new URL(input.url).pathname });
    } else {
      // Should navigate away on success
      actions.push({ action: 'waitForNavigation' });
      actions.push({ action: 'assertUrlChanged' });
    }

    return {
      name: `Password ${pc.shouldFail ? 'Fail' : 'Pass'} — ${input.pageName} (${pc.description})`,
      type: 'password' as any,
      sizeClass: input.sizeClass,
      suite_tags: ['regression'],
      priority: 'high',
      actions,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/generation/password.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/generation/password.ts tests/generation/password.test.ts
git commit -m "feat: password test template"
```

---

### Task 28: API Integration Notes For Existing Hono Service

This task documents the repository and contract surface the existing `testomniac_api` service should consume. Route handlers live in that API project, not here.

**Files:**
- Create: `src/db/repositories/forms.ts`
- Modify shared read-model contracts in `testomniac_types`

- [ ] **Step 1: Implement forms repository**

```ts
// src/db/repositories/forms.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { forms } from '../schema.js';
import type { FormInfo } from '../../domain/types.js';

export async function insertForm(pageStateId: number, form: FormInfo, formType?: string) {
  const db = getDb();
  const [row] = await db.insert(forms).values({
    pageStateId,
    selector: form.selector,
    action: form.action,
    method: form.method,
    submitSelector: form.submitSelector,
    fieldCount: form.fieldCount,
    formType,
    fieldsJson: form.fields,
  }).returning();
  return row;
}

export async function getFormsByPageState(pageStateId: number) {
  const db = getDb();
  return db.query.forms.findMany({ where: eq(forms.pageStateId, pageStateId) });
}
```

- [ ] **Step 2: Extend contract types for read APIs**

```ts
// testomniac_types/src/models/api.ts
export interface ProjectSummaryResponse {
  id: number;
  name: string;
  entityId: string;
}

export interface RunDetailResponse {
  id: number;
  status: string;
  phase: string | null;
  startedAt: string | null;
  completedAt: string | null;
}
```

- [ ] **Step 3: Document API ownership**

- The existing `testomniac_api` Hono project is responsible for:
  - `POST /api/public/scan`
  - `GET /api/public/runs/:runId`
  - `GET /api/public/runs/:runId/stream`
  - `POST /api/scan`
  - `GET /api/runs/:runId`
  - `GET /api/runs/:runId/test-cases`
  - `GET /api/runs/:runId/test-runs`
  - `GET /api/runs/:runId/issues`
  - `GET /api/runs/:runId/ai-usage`
  - `GET /api/runs/:runId/stream`
- The API must also expose an admin-only listing for projects where `entity_id` is null.
- This package is responsible for repositories, orchestration, and event payload definitions.

- [ ] **Step 4: Commit**

```bash
git add src/db/repositories/forms.ts
git commit -m "feat: document API integration surface for existing Hono service"
```

---

### Task 29: Add Rate Limiting Constants + Update Shared Types

**Files:**
- Modify: `src/config/constants.ts`
- Modify shared types in `testomniac_types`

- [ ] **Step 1: Add rate limiting and loop guard constants**

Add to `src/config/constants.ts`:
```ts
export const AI_REQUEST_DELAY_MS = 500;
export const MAX_ACTIONS_PER_PAGE_STATE = 200;
export const MAX_TOTAL_ACTIONS = 5000;
export const MAX_PAGES_PER_RUN = 100;
```

- [ ] **Step 2: Add missing types to shared types in `testomniac_types`**

Add to `testomniac_types`:
```ts
export const TestType = {
  Render: 'render',
  Interaction: 'interaction',
  Form: 'form',
  FormNegative: 'form_negative',
  Password: 'password',
  Navigation: 'navigation',
  E2E: 'e2e',
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/config/constants.ts
git commit -m "feat: rate limiting constants and shared test type updates"
```

---

## Summary

Phase gate for every phase:
- run `/testomniac_app/scripts/push_all.sh` whenever a lower-level library change is ready for consumption upstream
- verify `bun run dev` succeeds in both `/testomniac_api` and `/testomniac_app` before marking the phase complete

---

## Phase 6: Optional Plugins + Add-Ons

### Task 30: Plugin Architecture (Types, Registry, Orchestrator Integration)

**Files:**
- Create: `src/plugins/types.ts`
- Create: `src/plugins/registry.ts`
- Test: `tests/plugins/registry.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/plugins/registry.test.ts
import { describe, it, expect } from 'vitest';
import { registerPlugin, getPlugin, getEnabledPlugins } from '../src/plugins/registry.js';
import type { Plugin } from '../src/plugins/types.js';

describe('plugin registry', () => {
  it('registers and retrieves a plugin', () => {
    const plugin: Plugin = {
      name: 'test-plugin',
      description: 'A test plugin',
      analyze: async () => ({ issues: [] }),
    };
    registerPlugin(plugin);
    expect(getPlugin('test-plugin')).toBe(plugin);
  });

  it('returns undefined for unknown plugin', () => {
    expect(getPlugin('nonexistent')).toBeUndefined();
  });

  it('filters enabled plugins', () => {
    const p1: Plugin = { name: 'a', description: '', analyze: async () => ({ issues: [] }) };
    const p2: Plugin = { name: 'b', description: '', analyze: async () => ({ issues: [] }) };
    registerPlugin(p1);
    registerPlugin(p2);
    const enabled = getEnabledPlugins(['a', 'c']);
    expect(enabled).toHaveLength(1);
    expect(enabled[0].name).toBe('a');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/plugins/registry.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement plugin types and registry**

```ts
// src/plugins/types.ts
import type { Page } from 'puppeteer-core';
import type OpenAI from 'openai';
import type { NetworkLogEntry, FormInfo } from '../domain/types.js';

export interface PluginContext {
  appId: number;
  runId: number;
  baseUrl: string;
  pages: Array<{ id: number; url: string; routeKey?: string }>;
  pageStates: Array<{ id: number; pageId: number; contentText?: string; htmlHash?: string }>;
  networkLogs: NetworkLogEntry[];
  forms: FormInfo[];
  openai?: OpenAI;
  browser: Page;
}

export interface PluginIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  pageUrl: string;
  pageId?: number;
  pageStateId?: number;
  details?: Record<string, unknown>;
}

export interface PluginResult {
  issues: PluginIssue[];
  metadata?: Record<string, unknown>;
}

export interface Plugin {
  name: string;
  description: string;
  analyze(context: PluginContext): Promise<PluginResult>;
}
```

```ts
// src/plugins/registry.ts
import type { Plugin } from './types.js';

const PLUGINS = new Map<string, Plugin>();

export function registerPlugin(plugin: Plugin): void {
  PLUGINS.set(plugin.name, plugin);
}

export function getPlugin(name: string): Plugin | undefined {
  return PLUGINS.get(name);
}

export function getEnabledPlugins(names: string[]): Plugin[] {
  return names.map((n) => PLUGINS.get(n)).filter((p): p is Plugin => p !== undefined);
}

export function getAllPluginNames(): string[] {
  return [...PLUGINS.keys()];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/plugins/registry.test.ts`
Expected: PASS

- [ ] **Step 5: Wire plugin phase into orchestrator**

Add to `src/orchestrator.ts` after auth scanning, before test generation:

```ts
import { getEnabledPlugins } from './plugins/registry.js';
import * as issuesRepo from './db/repositories/issues.js';

// Plugin phase
const enabledPlugins = getEnabledPlugins(options.plugins || []);
if (enabledPlugins.length > 0) {
  logger.info({ phase: 'plugins', count: enabledPlugins.length }, 'running plugins');
  await runsRepo.updateRunPhase(run.id, 'plugins');
  phaseStart = Date.now();

  const pluginContext: PluginContext = {
    appId: app.id,
    runId: run.id,
    baseUrl: url,
    pages: allPages,
    pageStates: allPageStates,
    networkLogs: collectedNetworkLogs,
    forms: collectedForms,
    openai: new OpenAI(),
    browser: page,
  };

  for (const plugin of enabledPlugins) {
    logger.info({ plugin: plugin.name }, 'running plugin');
    const result = await plugin.analyze(pluginContext);
    for (const issue of result.issues) {
      await issuesRepo.createIssue({
        runId: run.id,
        plugin: plugin.name,
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        reproductionSteps: [],
        pageId: issue.pageId,
        pageStateId: issue.pageStateId,
        detailsJson: issue.details,
      });
    }
  }

  await runsRepo.updatePhaseDuration(run.id, 'pluginDurationMs', elapsed(phaseStart));
}
```

- [ ] **Step 6: Commit**

```bash
git add src/plugins/types.ts src/plugins/registry.ts tests/plugins/registry.test.ts
git commit -m "feat: plugin architecture — types, registry, orchestrator integration"
```

---

### Task 31: SEO Check Plugin

**Files:**
- Create: `src/plugins/seo/checks.ts`
- Create: `src/plugins/seo/index.ts`
- Test: `tests/plugins/seo/checks.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/plugins/seo/checks.test.ts
import { describe, it, expect } from 'vitest';
import {
  checkTitle,
  checkMetaDescription,
  checkH1,
  checkImgAlt,
  checkCanonical,
  checkViewportMeta,
} from '../src/plugins/seo/checks.js';

describe('SEO checks', () => {
  it('flags missing title', () => {
    const issue = checkTitle('<html><head></head><body></body></html>', 'https://example.com');
    expect(issue).not.toBeNull();
    expect(issue!.type).toBe('seo_missing_title');
  });

  it('passes with valid title', () => {
    const issue = checkTitle('<html><head><title>My Site</title></head></html>', 'https://example.com');
    expect(issue).toBeNull();
  });

  it('flags title too long', () => {
    const longTitle = 'A'.repeat(65);
    const issue = checkTitle(`<title>${longTitle}</title>`, 'https://example.com');
    expect(issue).not.toBeNull();
    expect(issue!.type).toBe('seo_title_too_long');
  });

  it('flags missing meta description', () => {
    const issue = checkMetaDescription('<html><head></head></html>', 'https://example.com');
    expect(issue).not.toBeNull();
  });

  it('flags missing h1', () => {
    const issue = checkH1('<html><body><p>No heading</p></body></html>', 'https://example.com');
    expect(issue).not.toBeNull();
    expect(issue!.type).toBe('seo_missing_h1');
  });

  it('flags multiple h1', () => {
    const issue = checkH1('<h1>A</h1><h1>B</h1>', 'https://example.com');
    expect(issue).not.toBeNull();
    expect(issue!.type).toBe('seo_multiple_h1');
  });

  it('flags images without alt', () => {
    const issues = checkImgAlt('<img src="a.jpg"><img src="b.jpg" alt="desc">', 'https://example.com');
    expect(issues).toHaveLength(1);
  });

  it('flags missing viewport meta', () => {
    const issue = checkViewportMeta('<html><head></head></html>', 'https://example.com');
    expect(issue).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/plugins/seo/checks.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement SEO checks**

```ts
// src/plugins/seo/checks.ts
import type { PluginIssue } from '../types.js';

export function checkTitle(html: string, pageUrl: string): PluginIssue | null {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  if (!match || !match[1].trim()) {
    return { type: 'seo_missing_title', severity: 'error', description: 'Page has no <title> tag', pageUrl };
  }
  const title = match[1].trim();
  if (title.length > 60) {
    return { type: 'seo_title_too_long', severity: 'warning', description: `Title is ${title.length} chars (recommended max 60)`, pageUrl };
  }
  if (title.length < 10) {
    return { type: 'seo_title_too_short', severity: 'warning', description: `Title is only ${title.length} chars`, pageUrl };
  }
  return null;
}

export function checkMetaDescription(html: string, pageUrl: string): PluginIssue | null {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  if (!match || !match[1].trim()) {
    return { type: 'seo_missing_meta_description', severity: 'error', description: 'Page has no meta description', pageUrl };
  }
  if (match[1].length > 160) {
    return { type: 'seo_description_too_long', severity: 'warning', description: `Meta description is ${match[1].length} chars (max 160)`, pageUrl };
  }
  return null;
}

export function checkH1(html: string, pageUrl: string): PluginIssue | null {
  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length === 0) {
    return { type: 'seo_missing_h1', severity: 'error', description: 'Page has no H1 tag', pageUrl };
  }
  if (h1s.length > 1) {
    return { type: 'seo_multiple_h1', severity: 'warning', description: `Page has ${h1s.length} H1 tags`, pageUrl };
  }
  return null;
}

export function checkImgAlt(html: string, pageUrl: string): PluginIssue[] {
  const imgs = html.match(/<img[^>]*>/gi) || [];
  return imgs
    .filter((img) => !img.includes('alt='))
    .map((img) => {
      const src = img.match(/src=["']([^"']*)["']/)?.[1] || 'unknown';
      return { type: 'seo_missing_img_alt', severity: 'warning', description: `Image missing alt attribute: ${src.split('/').pop()}`, pageUrl };
    });
}

export function checkCanonical(html: string, pageUrl: string): PluginIssue | null {
  if (!html.includes('rel="canonical"') && !html.includes("rel='canonical'")) {
    return { type: 'seo_missing_canonical', severity: 'warning', description: 'Page has no canonical URL', pageUrl };
  }
  return null;
}

export function checkViewportMeta(html: string, pageUrl: string): PluginIssue | null {
  if (!html.includes('name="viewport"') && !html.includes("name='viewport'")) {
    return { type: 'seo_missing_viewport', severity: 'error', description: 'Page has no viewport meta tag', pageUrl };
  }
  return null;
}

export function checkOpenGraph(html: string, pageUrl: string): PluginIssue[] {
  const issues: PluginIssue[] = [];
  if (!html.includes('og:title')) issues.push({ type: 'seo_missing_og_title', severity: 'warning', description: 'Missing og:title', pageUrl });
  if (!html.includes('og:description')) issues.push({ type: 'seo_missing_og_description', severity: 'warning', description: 'Missing og:description', pageUrl });
  if (!html.includes('og:image')) issues.push({ type: 'seo_missing_og_image', severity: 'warning', description: 'Missing og:image', pageUrl });
  return issues;
}

export function checkStructuredData(html: string, pageUrl: string): PluginIssue | null {
  if (!html.includes('application/ld+json')) {
    return { type: 'seo_missing_structured_data', severity: 'info', description: 'No JSON-LD structured data found', pageUrl };
  }
  return null;
}
```

```ts
// src/plugins/seo/index.ts
import { registerPlugin } from '../registry.js';
import type { Plugin, PluginContext, PluginIssue } from '../types.js';
import { checkTitle, checkMetaDescription, checkH1, checkImgAlt, checkCanonical, checkViewportMeta, checkOpenGraph, checkStructuredData } from './checks.js';

const seoPlugin: Plugin = {
  name: 'seo',
  description: 'Check pages for SEO best practices',
  async analyze(ctx: PluginContext): Promise<{ issues: PluginIssue[] }> {
    const issues: PluginIssue[] = [];
    const titles = new Map<string, string[]>();

    for (const ps of ctx.pageStates) {
      const page = ctx.pages.find((p) => p.id === ps.pageId);
      if (!page) continue;
      const html = ps.contentText || '';
      const url = page.url;

      const titleIssue = checkTitle(html, url);
      if (titleIssue) issues.push(titleIssue);

      // Track titles for duplicate check
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch?.[1]) {
        const t = titleMatch[1].trim();
        if (!titles.has(t)) titles.set(t, []);
        titles.get(t)!.push(url);
      }

      const descIssue = checkMetaDescription(html, url);
      if (descIssue) issues.push(descIssue);

      const h1Issue = checkH1(html, url);
      if (h1Issue) issues.push(h1Issue);

      issues.push(...checkImgAlt(html, url));

      const canonicalIssue = checkCanonical(html, url);
      if (canonicalIssue) issues.push(canonicalIssue);

      const viewportIssue = checkViewportMeta(html, url);
      if (viewportIssue) issues.push(viewportIssue);

      issues.push(...checkOpenGraph(html, url));

      const sdIssue = checkStructuredData(html, url);
      if (sdIssue) issues.push(sdIssue);
    }

    // Duplicate title check
    for (const [title, urls] of titles) {
      if (urls.length > 1) {
        issues.push({
          type: 'seo_duplicate_title',
          severity: 'warning',
          description: `Title "${title}" is used on ${urls.length} pages`,
          pageUrl: urls[0],
          details: { duplicateUrls: urls },
        });
      }
    }

    // Check robots.txt and sitemap.xml
    try {
      const robotsRes = await fetch(`${ctx.baseUrl}/robots.txt`);
      if (!robotsRes.ok) issues.push({ type: 'seo_missing_robots', severity: 'warning', description: 'robots.txt not accessible', pageUrl: ctx.baseUrl });
    } catch { issues.push({ type: 'seo_missing_robots', severity: 'warning', description: 'robots.txt not accessible', pageUrl: ctx.baseUrl }); }

    try {
      const sitemapRes = await fetch(`${ctx.baseUrl}/sitemap.xml`);
      if (!sitemapRes.ok) issues.push({ type: 'seo_missing_sitemap', severity: 'warning', description: 'sitemap.xml not accessible', pageUrl: ctx.baseUrl });
    } catch { issues.push({ type: 'seo_missing_sitemap', severity: 'warning', description: 'sitemap.xml not accessible', pageUrl: ctx.baseUrl }); }

    return { issues };
  },
};

registerPlugin(seoPlugin);
export default seoPlugin;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/plugins/seo/checks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugins/seo/ tests/plugins/seo/
git commit -m "feat: SEO check plugin"
```

---

### Task 32: Security Check Plugin

**Files:**
- Create: `src/plugins/security/header-checks.ts`
- Create: `src/plugins/security/network-checks.ts`
- Create: `src/plugins/security/html-checks.ts`
- Create: `src/plugins/security/index.ts`
- Test: `tests/plugins/security/network-checks.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/plugins/security/network-checks.test.ts
import { describe, it, expect } from 'vitest';
import { checkApiKeysInUrls, checkSensitiveHeaders, checkSensitiveResponseData } from '../src/plugins/security/network-checks.js';

describe('security network checks', () => {
  it('flags API key in URL query params', () => {
    const issues = checkApiKeysInUrls([
      { method: 'GET', url: 'https://api.example.com/data?api_key=REDACTED_KEY', status: 200, contentType: 'application/json' },
    ], 'https://example.com');
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('security_api_key_in_url');
    expect(issues[0].severity).toBe('error');
  });

  it('flags apikey param', () => {
    const issues = checkApiKeysInUrls([
      { method: 'GET', url: 'https://maps.google.com/api?apikey=AIza123456', status: 200, contentType: 'text/html' },
    ], 'https://example.com');
    expect(issues).toHaveLength(1);
  });

  it('ignores URLs without sensitive params', () => {
    const issues = checkApiKeysInUrls([
      { method: 'GET', url: 'https://example.com/page?q=search&page=2', status: 200, contentType: 'text/html' },
    ], 'https://example.com');
    expect(issues).toHaveLength(0);
  });

  it('flags known key prefixes in response data', () => {
    const issues = checkSensitiveResponseData('{"key": "REDACTED_STRIPE_KEY_EXAMPLE"}', 'https://example.com/api/config', 'example.com');
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('security_sensitive_data_in_response');
  });

  it('ignores normal response data', () => {
    const issues = checkSensitiveResponseData('{"name": "John", "email": "john@test.com"}', 'https://example.com/api/user', 'example.com');
    expect(issues).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/plugins/security/network-checks.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement security checks**

```ts
// src/plugins/security/network-checks.ts
import type { PluginIssue } from '../types.js';
import type { NetworkLogEntry } from '../../domain/types.js';

const SENSITIVE_PARAM_PATTERNS = [
  'api_key', 'apikey', 'api-key', 'access_token', 'token',
  'secret', 'password', 'passwd', 'private_key', 'auth',
];

const SENSITIVE_KEY_PREFIXES = [
  'sk_live_***', 'sk_test_***', 'pk_live_***', 'pk_test_***',  // Stripe
  'AKIA',                                             // AWS
  'AIza',                                             // Google
  'ghp_', 'gho_', 'ghu_', 'ghs_',                   // GitHub
  'xoxb-', 'xoxp-',                                   // Slack
];

export function checkApiKeysInUrls(entries: NetworkLogEntry[], baseUrl: string): PluginIssue[] {
  const issues: PluginIssue[] = [];
  for (const entry of entries) {
    try {
      const url = new URL(entry.url);
      for (const [key] of url.searchParams) {
        if (SENSITIVE_PARAM_PATTERNS.some((p) => key.toLowerCase().includes(p))) {
          issues.push({
            type: 'security_api_key_in_url',
            severity: 'error',
            description: `Sensitive parameter "${key}" found in URL: ${entry.method} ${entry.url.split('?')[0]}`,
            pageUrl: baseUrl,
            details: { method: entry.method, url: entry.url, param: key },
          });
        }
      }
    } catch { continue; }
  }
  return issues;
}

export function checkSensitiveHeaders(entries: NetworkLogEntry[], domain: string, baseUrl: string): PluginIssue[] {
  const issues: PluginIssue[] = [];
  for (const entry of entries) {
    try {
      const url = new URL(entry.url);
      const isThirdParty = url.hostname !== domain && !url.hostname.endsWith('.' + domain);
      if (isThirdParty && entry.url.toLowerCase().includes('authorization')) {
        issues.push({
          type: 'security_auth_to_third_party',
          severity: 'warning',
          description: `Authorization header sent to third-party: ${url.hostname}`,
          pageUrl: baseUrl,
          details: { thirdPartyDomain: url.hostname },
        });
      }
    } catch { continue; }
  }
  return issues;
}

export function checkSensitiveResponseData(body: string, url: string, domain: string): PluginIssue[] {
  const issues: PluginIssue[] = [];
  if (!body) return issues;

  for (const prefix of SENSITIVE_KEY_PREFIXES) {
    if (body.includes(prefix)) {
      issues.push({
        type: 'security_sensitive_data_in_response',
        severity: 'error',
        description: `Response from ${url} contains sensitive key prefix "${prefix}"`,
        pageUrl: url,
        details: { prefix, url },
      });
    }
  }

  // Check for long random strings that look like API keys (32+ alphanumeric chars)
  const longTokenPattern = /["']\w{40,}["']/g;
  const matches = body.match(longTokenPattern) || [];
  for (const match of matches.slice(0, 3)) {
    // Skip common false positives (hashes, UUIDs are usually 32-36 chars)
    if (match.length <= 40) continue;
    issues.push({
      type: 'security_possible_key_in_response',
      severity: 'warning',
      description: `Response from ${url} contains possible API key/token (${match.length} char string)`,
      pageUrl: url,
    });
  }

  return issues;
}
```

```ts
// src/plugins/security/header-checks.ts
import type { PluginIssue } from '../types.js';

const REQUIRED_HEADERS: Array<{ header: string; type: string; severity: 'error' | 'warning' | 'info' }> = [
  { header: 'content-security-policy', type: 'security_missing_csp', severity: 'warning' },
  { header: 'strict-transport-security', type: 'security_missing_hsts', severity: 'warning' },
  { header: 'x-frame-options', type: 'security_missing_x_frame_options', severity: 'warning' },
  { header: 'x-content-type-options', type: 'security_missing_x_content_type', severity: 'warning' },
  { header: 'referrer-policy', type: 'security_missing_referrer_policy', severity: 'info' },
];

export function checkSecurityHeaders(headers: Record<string, string>, pageUrl: string): PluginIssue[] {
  const lowerHeaders = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return REQUIRED_HEADERS
    .filter((req) => !lowerHeaders[req.header])
    .map((req) => ({
      type: req.type,
      severity: req.severity,
      description: `Missing security header: ${req.header}`,
      pageUrl,
    }));
}
```

```ts
// src/plugins/security/html-checks.ts
import type { PluginIssue } from '../types.js';

export function checkMixedContent(html: string, pageUrl: string): PluginIssue[] {
  if (!pageUrl.startsWith('https://')) return [];
  const issues: PluginIssue[] = [];
  const httpRefs = html.match(/(?:src|href|action)=["']http:\/\/[^"']+["']/gi) || [];
  for (const ref of httpRefs) {
    issues.push({
      type: 'security_mixed_content',
      severity: 'error',
      description: `Mixed content: ${ref.slice(0, 80)}`,
      pageUrl,
    });
  }
  return issues;
}

export function checkCsrfTokens(html: string, pageUrl: string): PluginIssue[] {
  const forms = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
  const issues: PluginIssue[] = [];
  for (const form of forms) {
    if (form.toLowerCase().includes('method="post"') || form.toLowerCase().includes("method='post'")) {
      const hasCsrf = /csrf|_token|authenticity_token|__RequestVerificationToken/i.test(form);
      if (!hasCsrf) {
        issues.push({
          type: 'security_form_no_csrf',
          severity: 'warning',
          description: 'POST form has no CSRF token',
          pageUrl,
        });
      }
    }
  }
  return issues;
}

export function checkExposedSecrets(html: string, pageUrl: string): PluginIssue[] {
  const issues: PluginIssue[] = [];
  const patterns = [
    { pattern: /sk_live_[a-zA-Z0-9]{20,}/g, name: 'Stripe key' },
    { pattern: /AKIA[A-Z0-9]{16}/g, name: 'AWS access key' },
    { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, name: 'hardcoded password' },
  ];
  for (const { pattern, name } of patterns) {
    if (pattern.test(html)) {
      issues.push({
        type: 'security_exposed_secret',
        severity: 'error',
        description: `Possible ${name} found in page HTML source`,
        pageUrl,
      });
    }
    pattern.lastIndex = 0;
  }
  return issues;
}
```

```ts
// src/plugins/security/index.ts
import { registerPlugin } from '../registry.js';
import type { Plugin, PluginIssue } from '../types.js';
import { checkSecurityHeaders } from './header-checks.js';
import { checkMixedContent, checkCsrfTokens, checkExposedSecrets } from './html-checks.js';
import { checkApiKeysInUrls, checkSensitiveHeaders } from './network-checks.js';

const securityPlugin: Plugin = {
  name: 'security',
  description: 'Check for security issues: headers, mixed content, exposed secrets, API keys in traffic',
  async analyze(ctx): Promise<{ issues: PluginIssue[] }> {
    const issues: PluginIssue[] = [];
    const domain = new URL(ctx.baseUrl).hostname;

    // Check each page
    for (const ps of ctx.pageStates) {
      const page = ctx.pages.find((p) => p.id === ps.pageId);
      if (!page) continue;
      const html = ps.contentText || '';

      // HTTPS check
      if (!page.url.startsWith('https://')) {
        issues.push({ type: 'security_no_https', severity: 'error', description: 'Page not served over HTTPS', pageUrl: page.url });
      }

      issues.push(...checkMixedContent(html, page.url));
      issues.push(...checkCsrfTokens(html, page.url));
      issues.push(...checkExposedSecrets(html, page.url));
    }

    // Check security headers (via live browser)
    try {
      const response = await ctx.browser.goto(ctx.baseUrl, { waitUntil: 'networkidle0' });
      if (response) {
        issues.push(...checkSecurityHeaders(response.headers(), ctx.baseUrl));
      }
    } catch {}

    // Check cookies
    const cookies = await ctx.browser.cookies();
    for (const cookie of cookies) {
      if (!cookie.secure) issues.push({ type: 'security_cookie_no_secure', severity: 'warning', description: `Cookie "${cookie.name}" missing Secure flag`, pageUrl: ctx.baseUrl });
      if (!cookie.httpOnly) issues.push({ type: 'security_cookie_no_httponly', severity: 'warning', description: `Cookie "${cookie.name}" missing HttpOnly flag`, pageUrl: ctx.baseUrl });
      if (!cookie.sameSite || cookie.sameSite === 'None') issues.push({ type: 'security_cookie_no_samesite', severity: 'info', description: `Cookie "${cookie.name}" missing SameSite flag`, pageUrl: ctx.baseUrl });
    }

    // Network traffic checks
    issues.push(...checkApiKeysInUrls(ctx.networkLogs, ctx.baseUrl));
    issues.push(...checkSensitiveHeaders(ctx.networkLogs, domain, ctx.baseUrl));

    return { issues };
  },
};

registerPlugin(securityPlugin);
export default securityPlugin;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/plugins/security/network-checks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugins/security/ tests/plugins/security/
git commit -m "feat: security check plugin with network traffic API key detection"
```

---

### Task 33: Content Check Plugin

**Files:**
- Create: `src/plugins/content/checks.ts`
- Create: `src/plugins/content/ai-checks.ts`
- Create: `src/plugins/content/index.ts`
- Test: `tests/plugins/content/checks.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/plugins/content/checks.test.ts
import { describe, it, expect } from 'vitest';
import { checkPlaceholderContent, checkReadability, checkCopyrightYear } from '../src/plugins/content/checks.js';

describe('content checks', () => {
  it('flags Lorem ipsum', () => {
    const issues = checkPlaceholderContent('Welcome to our site. Lorem ipsum dolor sit amet.', 'https://example.com');
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('content_placeholder');
  });

  it('flags TODO text', () => {
    const issues = checkPlaceholderContent('This feature is TODO', 'https://example.com');
    expect(issues).toHaveLength(1);
  });

  it('computes readability score', () => {
    const result = checkReadability('The cat sat on the mat. It was a good day. The sun was bright.', 'https://example.com');
    expect(result).not.toBeNull();
    expect(result!.details!.score).toBeGreaterThan(0);
  });

  it('flags outdated copyright year', () => {
    const issue = checkCopyrightYear('© 2020 Example Inc.', 'https://example.com');
    expect(issue).not.toBeNull();
    expect(issue!.type).toBe('content_outdated_copyright');
  });

  it('passes current copyright year', () => {
    const issue = checkCopyrightYear(`© ${new Date().getFullYear()} Example Inc.`, 'https://example.com');
    expect(issue).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/plugins/content/checks.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement content checks**

```ts
// src/plugins/content/checks.ts
import type { PluginIssue } from '../types.js';

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i, /dolor sit amet/i, /TODO/g, /FIXME/g,
  /coming soon/i, /under construction/i, /TBD/g,
  /placeholder/i, /sample text/i,
];

export function checkPlaceholderContent(text: string, pageUrl: string): PluginIssue[] {
  const issues: PluginIssue[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) {
      issues.push({
        type: 'content_placeholder',
        severity: 'error',
        description: `Page contains placeholder content matching: ${pattern.source}`,
        pageUrl,
      });
    }
    if ('lastIndex' in pattern) pattern.lastIndex = 0;
  }
  return issues;
}

export function checkReadability(text: string, pageUrl: string): PluginIssue | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 30) return null;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  // Simplified Flesch-Kincaid approximation
  const syllables = words.reduce((sum, w) => sum + Math.max(1, w.replace(/[^aeiouy]/gi, '').length), 0);
  const avgSyllablesPerWord = syllables / words.length;
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return {
    type: 'content_readability',
    severity: 'info',
    description: `Readability score: ${score.toFixed(1)} (Flesch-Kincaid). ${score < 30 ? 'Very difficult to read' : score < 50 ? 'Difficult' : score < 60 ? 'Moderate' : 'Easy'}`,
    pageUrl,
    details: { score: Math.round(score * 10) / 10, words: words.length, sentences: sentences.length },
  };
}

export function checkCopyrightYear(text: string, pageUrl: string): PluginIssue | null {
  const match = text.match(/©\s*(\d{4})/);
  if (!match) return null;
  const year = parseInt(match[1]);
  const currentYear = new Date().getFullYear();
  if (year < currentYear) {
    return {
      type: 'content_outdated_copyright',
      severity: 'warning',
      description: `Copyright year ${year} is outdated (current: ${currentYear})`,
      pageUrl,
    };
  }
  return null;
}

export function checkEmptyPage(text: string, pageUrl: string): PluginIssue | null {
  if (text.trim().length < 50) {
    return { type: 'content_empty_page', severity: 'error', description: 'Page has very little content (<50 chars)', pageUrl };
  }
  return null;
}
```

```ts
// src/plugins/content/ai-checks.ts
import type OpenAI from 'openai';
import type { PluginIssue } from '../types.js';

export async function checkSpellingAndGrammar(client: OpenAI, text: string, pageUrl: string): Promise<PluginIssue[]> {
  if (text.length < 50) return [];
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Check this text for spelling and grammar errors. Return a JSON array of objects with "error" (the mistake) and "suggestion" (the fix). Return empty array if no errors.\n\nText: ${text.slice(0, 2000)}`,
    }],
    response_format: { type: 'json_object' },
    temperature: 0,
  });
  const content = response.choices[0].message.content || '{"errors":[]}';
  const parsed = JSON.parse(content);
  const errors: Array<{ error: string; suggestion: string }> = parsed.errors || [];
  return errors.map((e) => ({
    type: 'content_spelling_grammar',
    severity: 'warning' as const,
    description: `"${e.error}" → "${e.suggestion}"`,
    pageUrl,
  }));
}

export async function checkTerminologyConsistency(client: OpenAI, pageTexts: Array<{ url: string; text: string }>): Promise<PluginIssue[]> {
  const combined = pageTexts.map((p) => `[${p.url}]: ${p.text.slice(0, 300)}`).join('\n\n');
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Analyze these page texts for inconsistent terminology (e.g., "Sign In" vs "Log In", "Cart" vs "Basket"). Return a JSON array of objects with "term1", "term2", and "pages" (array of URLs). Return empty array if consistent.\n\n${combined}`,
    }],
    response_format: { type: 'json_object' },
    temperature: 0,
  });
  const content = response.choices[0].message.content || '{"inconsistencies":[]}';
  const parsed = JSON.parse(content);
  const items: Array<{ term1: string; term2: string; pages: string[] }> = parsed.inconsistencies || [];
  return items.map((i) => ({
    type: 'content_inconsistent_terminology',
    severity: 'warning' as const,
    description: `Inconsistent terms: "${i.term1}" vs "${i.term2}"`,
    pageUrl: i.pages[0] || '',
    details: { term1: i.term1, term2: i.term2, pages: i.pages },
  }));
}
```

```ts
// src/plugins/content/index.ts
import { registerPlugin } from '../registry.js';
import type { Plugin, PluginIssue } from '../types.js';
import { checkPlaceholderContent, checkReadability, checkCopyrightYear, checkEmptyPage } from './checks.js';
import { checkSpellingAndGrammar, checkTerminologyConsistency } from './ai-checks.js';

const contentPlugin: Plugin = {
  name: 'content',
  description: 'Check content quality: placeholders, readability, spelling, terminology consistency',
  async analyze(ctx): Promise<{ issues: PluginIssue[] }> {
    const issues: PluginIssue[] = [];
    const pageTexts: Array<{ url: string; text: string }> = [];

    for (const ps of ctx.pageStates) {
      const page = ctx.pages.find((p) => p.id === ps.pageId);
      if (!page) continue;
      const text = ps.contentText || '';

      issues.push(...checkPlaceholderContent(text, page.url));
      const readability = checkReadability(text, page.url);
      if (readability) issues.push(readability);
      const copyright = checkCopyrightYear(text, page.url);
      if (copyright) issues.push(copyright);
      const empty = checkEmptyPage(text, page.url);
      if (empty) issues.push(empty);

      if (text.length > 50) pageTexts.push({ url: page.url, text });

      // AI spelling check (if OpenAI available)
      if (ctx.openai && text.length > 100) {
        const spellingIssues = await checkSpellingAndGrammar(ctx.openai, text, page.url);
        issues.push(...spellingIssues);
      }
    }

    // AI terminology consistency (cross-page)
    if (ctx.openai && pageTexts.length >= 2) {
      const termIssues = await checkTerminologyConsistency(ctx.openai, pageTexts);
      issues.push(...termIssues);
    }

    return { issues };
  },
};

registerPlugin(contentPlugin);
export default contentPlugin;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/plugins/content/checks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugins/content/ tests/plugins/content/
git commit -m "feat: content check plugin with AI spelling and terminology"
```

---

### Task 34: UI Consistency Check Plugin

**Files:**
- Create: `src/plugins/ui-consistency/style-extractor.ts`
- Create: `src/plugins/ui-consistency/comparator.ts`
- Create: `src/plugins/ui-consistency/index.ts`
- Test: `tests/plugins/ui-consistency/comparator.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/plugins/ui-consistency/comparator.test.ts
import { describe, it, expect } from 'vitest';
import { findStyleDeviations } from '../src/plugins/ui-consistency/comparator.js';

describe('UI consistency comparator', () => {
  it('detects font inconsistency across pages', () => {
    const styles = [
      { pageUrl: '/home', category: 'headings', tag: 'h1', styles: { fontFamily: 'Arial', fontSize: '32px', fontWeight: '700', color: '#000' } },
      { pageUrl: '/about', category: 'headings', tag: 'h1', styles: { fontFamily: 'Arial', fontSize: '32px', fontWeight: '700', color: '#000' } },
      { pageUrl: '/contact', category: 'headings', tag: 'h1', styles: { fontFamily: 'Helvetica', fontSize: '28px', fontWeight: '700', color: '#000' } },
    ];
    const deviations = findStyleDeviations(styles);
    expect(deviations.length).toBeGreaterThan(0);
    expect(deviations[0].pageUrl).toBe('/contact');
    expect(deviations[0].details!.property).toBeDefined();
  });

  it('reports no deviations when consistent', () => {
    const styles = [
      { pageUrl: '/home', category: 'buttons', tag: 'button', styles: { backgroundColor: '#2563EB', fontSize: '14px' } },
      { pageUrl: '/about', category: 'buttons', tag: 'button', styles: { backgroundColor: '#2563EB', fontSize: '14px' } },
    ];
    const deviations = findStyleDeviations(styles);
    expect(deviations).toHaveLength(0);
  });

  it('detects button color inconsistency', () => {
    const styles = [
      { pageUrl: '/home', category: 'buttons', tag: 'button', styles: { backgroundColor: '#2563EB', fontSize: '14px', borderRadius: '4px', padding: '8px 16px' } },
      { pageUrl: '/about', category: 'buttons', tag: 'button', styles: { backgroundColor: '#2563EB', fontSize: '14px', borderRadius: '4px', padding: '8px 16px' } },
      { pageUrl: '/checkout', category: 'buttons', tag: 'button', styles: { backgroundColor: '#FF0000', fontSize: '14px', borderRadius: '4px', padding: '8px 16px' } },
    ];
    const deviations = findStyleDeviations(styles);
    expect(deviations.length).toBeGreaterThan(0);
    expect(deviations.some((d) => d.details!.property === 'backgroundColor')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/plugins/ui-consistency/comparator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement style extractor and comparator**

```ts
// src/plugins/ui-consistency/style-extractor.ts
import type { Page } from 'puppeteer-core';

export interface ExtractedStyle {
  pageUrl: string;
  category: string;
  tag: string;
  styles: Record<string, string>;
}

const STYLE_TARGETS: Record<string, { selectors: string[]; props: string[] }> = {
  headings: { selectors: ['h1', 'h2', 'h3'], props: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'lineHeight'] },
  bodyText: { selectors: ['p', 'li'], props: ['fontFamily', 'fontSize', 'color', 'lineHeight'] },
  buttons: { selectors: ['button', '[role="button"]', 'input[type="submit"]'], props: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderRadius', 'padding', 'height'] },
  links: { selectors: ['a'], props: ['fontFamily', 'fontSize', 'color', 'textDecoration'] },
  inputs: { selectors: ['input[type="text"]', 'input[type="email"]', 'textarea'], props: ['fontFamily', 'fontSize', 'borderColor', 'borderRadius', 'padding', 'height'] },
};

export async function extractStyles(page: Page, pageUrl: string): Promise<ExtractedStyle[]> {
  const results: ExtractedStyle[] = [];

  for (const [category, config] of Object.entries(STYLE_TARGETS)) {
    for (const selector of config.selectors) {
      const styles = await page.evaluate((sel: string, props: string[]) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const computed = window.getComputedStyle(el);
        const result: Record<string, string> = {};
        for (const prop of props) {
          result[prop] = computed.getPropertyValue(
            prop.replace(/([A-Z])/g, '-$1').toLowerCase()
          );
        }
        return result;
      }, selector, config.props);

      if (styles) {
        results.push({ pageUrl, category, tag: selector, styles });
      }
    }
  }

  return results;
}
```

```ts
// src/plugins/ui-consistency/comparator.ts
import type { PluginIssue } from '../types.js';
import type { ExtractedStyle } from './style-extractor.js';

export function findStyleDeviations(allStyles: ExtractedStyle[]): PluginIssue[] {
  const issues: PluginIssue[] = [];

  // Group by category + tag
  const groups = new Map<string, ExtractedStyle[]>();
  for (const s of allStyles) {
    const key = `${s.category}:${s.tag}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  for (const [key, entries] of groups) {
    if (entries.length < 2) continue;

    // For each style property, find the majority value
    const propNames = Object.keys(entries[0].styles);
    for (const prop of propNames) {
      const valueCounts = new Map<string, string[]>();
      for (const entry of entries) {
        const val = entry.styles[prop] || '';
        if (!valueCounts.has(val)) valueCounts.set(val, []);
        valueCounts.get(val)!.push(entry.pageUrl);
      }

      if (valueCounts.size <= 1) continue;

      // Find majority (most common value)
      let majorityValue = '';
      let majorityCount = 0;
      for (const [val, pages] of valueCounts) {
        if (pages.length > majorityCount) {
          majorityCount = pages.length;
          majorityValue = val;
        }
      }

      // Flag deviations from majority
      for (const [val, pages] of valueCounts) {
        if (val === majorityValue) continue;
        for (const pageUrl of pages) {
          const [category, tag] = key.split(':');
          issues.push({
            type: `ui_inconsistent_${category}`,
            severity: 'warning',
            description: `${tag} on ${pageUrl} uses ${prop}: ${val}, but ${majorityCount}/${entries.length} pages use ${majorityValue}`,
            pageUrl,
            details: { property: prop, actual: val, expected: majorityValue, category, tag },
          });
        }
      }
    }
  }

  return issues;
}
```

```ts
// src/plugins/ui-consistency/index.ts
import { registerPlugin } from '../registry.js';
import type { Plugin, PluginIssue } from '../types.js';
import { extractStyles, type ExtractedStyle } from './style-extractor.js';
import { findStyleDeviations } from './comparator.js';

const uiConsistencyPlugin: Plugin = {
  name: 'ui-consistency',
  description: 'Check cross-page UI consistency: fonts, button styles, colors, spacing',
  async analyze(ctx): Promise<{ issues: PluginIssue[] }> {
    const allStyles: ExtractedStyle[] = [];

    // Extract styles from each page
    for (const page of ctx.pages) {
      try {
        await ctx.browser.goto(page.url, { waitUntil: 'networkidle0', timeout: 15_000 });
        const styles = await extractStyles(ctx.browser, page.url);
        allStyles.push(...styles);
      } catch {
        continue;
      }
    }

    // Compare across pages
    const issues = findStyleDeviations(allStyles);

    // Check for text overflow
    const overflows = await ctx.browser.evaluate(() => {
      const elements = document.querySelectorAll('p, h1, h2, h3, span, a, button, li');
      const issues: Array<{ selector: string; text: string }> = [];
      elements.forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 2) {
          issues.push({
            selector: el.tagName.toLowerCase(),
            text: el.textContent?.slice(0, 40) || '',
          });
        }
      });
      return issues;
    });

    for (const overflow of overflows) {
      issues.push({
        type: 'ui_text_overflow',
        severity: 'warning',
        description: `Text overflow detected in <${overflow.selector}>: "${overflow.text}..."`,
        pageUrl: ctx.browser.url(),
      });
    }

    return { issues };
  },
};

registerPlugin(uiConsistencyPlugin);
export default uiConsistencyPlugin;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/plugins/ui-consistency/comparator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/plugins/ui-consistency/ tests/plugins/ui-consistency/
git commit -m "feat: UI consistency check plugin with cross-page style comparison"
```

---

### Task 35: Reusable Component Detector

**Files:**
- Create: `src/scanner/component-detector.ts`
- Create: `src/db/repositories/components.ts`
- Test: `tests/scanner/component-detector.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/scanner/component-detector.test.ts
import { describe, it, expect } from 'vitest';
import {
  extractCandidateRegions,
  groupByHash,
  COMPONENT_SELECTORS,
} from '../src/scanner/component-detector.js';
import { normalizeHtml } from '../src/browser/page-utils.js';
import { createHash } from 'node:crypto';

function sha256(s: string) { return createHash('sha256').update(s).digest('hex'); }

describe('component-detector', () => {
  it('COMPONENT_SELECTORS includes nav, header, footer', () => {
    expect(COMPONENT_SELECTORS).toContain('nav');
    expect(COMPONENT_SELECTORS).toContain('header');
    expect(COMPONENT_SELECTORS).toContain('footer');
    expect(COMPONENT_SELECTORS).toContain('[role="navigation"]');
  });

  it('extractCandidateRegions finds nav and footer', () => {
    const html = '<header><nav><a href="/">Home</a></nav></header><main>Content</main><footer><p>Copyright</p></footer>';
    const regions = extractCandidateRegions(html);
    expect(regions.length).toBeGreaterThanOrEqual(2);
    const selectors = regions.map((r) => r.selector);
    expect(selectors).toContain('nav');
    expect(selectors).toContain('footer');
  });

  it('groupByHash groups identical regions', () => {
    const navHtml = '<a href="/">Home</a><a href="/about">About</a>';
    const hash = sha256(normalizeHtml(navHtml));
    const regions = [
      { pageStateId: 1, selector: 'nav', innerHtml: navHtml, hash },
      { pageStateId: 2, selector: 'nav', innerHtml: navHtml, hash },
      { pageStateId: 3, selector: 'nav', innerHtml: navHtml + '<a href="/new">New</a>', hash: sha256(normalizeHtml(navHtml + '<a href="/new">New</a>')) },
    ];
    const groups = groupByHash(regions);
    expect(groups.length).toBe(2);
    const mainGroup = groups.find((g) => g.instances.length === 2);
    expect(mainGroup).toBeDefined();
    expect(mainGroup!.hash).toBe(hash);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/scanner/component-detector.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement component detector**

```ts
// src/scanner/component-detector.ts
import { createHash } from 'node:crypto';
import { normalizeHtml } from '../browser/page-utils.js';
import pino from 'pino';

const logger = pino({ name: 'component-detector' });

export const COMPONENT_SELECTORS = [
  'nav', 'header', 'footer',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
];

const COMPONENT_CLASS_PATTERNS = [
  'navbar', 'nav-bar', 'sidebar', 'side-bar', 'menu',
  'footer', 'header', 'top-bar', 'topbar', 'bottom-bar',
];

export interface CandidateRegion {
  pageStateId: number;
  selector: string;
  innerHtml: string;
  hash: string;
}

export interface ComponentGroup {
  selector: string;
  hash: string;
  instances: Array<{ pageStateId: number }>;
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function extractCandidateRegions(html: string): Array<{ selector: string; innerHtml: string }> {
  const results: Array<{ selector: string; innerHtml: string }> = [];
  for (const selector of COMPONENT_SELECTORS) {
    const tagName = selector.replace(/\[.*\]/, '').trim();
    if (tagName && !tagName.startsWith('[')) {
      const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
      let match;
      while ((match = pattern.exec(html)) !== null) {
        results.push({ selector: tagName, innerHtml: match[1].trim() });
      }
    }
    if (selector.startsWith('[role=')) {
      const role = selector.match(/role="([^"]+)"/)?.[1];
      if (role) {
        const rolePattern = new RegExp(`<\\w+[^>]*role=["']${role}["'][^>]*>([\\s\\S]*?)<\\/\\w+>`, 'gi');
        let match;
        while ((match = rolePattern.exec(html)) !== null) {
          results.push({ selector, innerHtml: match[1].trim() });
        }
      }
    }
  }
  return results;
}

export function hashRegion(innerHtml: string): string {
  return sha256(normalizeHtml(innerHtml));
}

export function groupByHash(regions: CandidateRegion[]): ComponentGroup[] {
  const groups = new Map<string, ComponentGroup>();
  for (const region of regions) {
    const key = `${region.selector}:${region.hash}`;
    if (!groups.has(key)) {
      groups.set(key, { selector: region.selector, hash: region.hash, instances: [] });
    }
    groups.get(key)!.instances.push({ pageStateId: region.pageStateId });
  }
  return [...groups.values()];
}

export interface DetectedComponent {
  name: string;
  selector: string;
  hash: string;
  canonicalPageStateId: number;
  instances: Array<{ pageStateId: number; isIdentical: boolean; hash: string }>;
}

export function detectComponents(allRegions: CandidateRegion[]): DetectedComponent[] {
  const bySelector = new Map<string, CandidateRegion[]>();
  for (const r of allRegions) {
    if (!bySelector.has(r.selector)) bySelector.set(r.selector, []);
    bySelector.get(r.selector)!.push(r);
  }

  const components: DetectedComponent[] = [];

  for (const [selector, regions] of bySelector) {
    if (regions.length < 2) continue;

    const groups = groupByHash(regions);
    let canonicalGroup = groups[0];
    for (const g of groups) {
      if (g.instances.length > canonicalGroup.instances.length) canonicalGroup = g;
    }

    const name = selector.replace(/[\[\]"'=]/g, '').replace(/^\./, '');
    const allInstances: DetectedComponent['instances'] = [];
    for (const group of groups) {
      for (const inst of group.instances) {
        allInstances.push({
          pageStateId: inst.pageStateId,
          isIdentical: group.hash === canonicalGroup.hash,
          hash: group.hash,
        });
      }
    }

    components.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      selector,
      hash: canonicalGroup.hash,
      canonicalPageStateId: canonicalGroup.instances[0].pageStateId,
      instances: allInstances,
    });

    const identicalCount = allInstances.filter((i) => i.isIdentical).length;
    const variantCount = allInstances.filter((i) => !i.isIdentical).length;
    logger.info({ selector, identicalCount, variantCount }, 'component detected');
  }

  return components;
}
```

- [ ] **Step 4: Implement components repository**

```ts
// src/db/repositories/components.ts
import { eq } from 'drizzle-orm';
import { getDb } from '../connection.js';
import { components, componentInstances } from '../schema.js';
import type { DetectedComponent } from '../../scanner/component-detector.js';

export async function saveComponent(appId: number, sizeClass: string, comp: DetectedComponent) {
  const db = getDb();
  const [row] = await db.insert(components).values({
    appId,
    name: comp.name,
    selector: comp.selector,
    htmlHash: comp.hash,
    canonicalPageStateId: comp.canonicalPageStateId,
    sizeClass,
  }).returning();

  for (const inst of comp.instances) {
    await db.insert(componentInstances).values({
      componentId: row.id,
      pageStateId: inst.pageStateId,
      isIdentical: inst.isIdentical,
      htmlHash: inst.hash,
    });
  }
  return row;
}

export async function getComponentsByApp(appId: number) {
  const db = getDb();
  return db.query.components.findMany({ where: eq(components.appId, appId) });
}

export async function getComponentInstances(componentId: number) {
  const db = getDb();
  return db.query.componentInstances.findMany({
    where: eq(componentInstances.componentId, componentId),
  });
}

export async function getCanonicalPageStateIds(appId: number): Promise<Set<number>> {
  const comps = await getComponentsByApp(appId);
  return new Set(comps.map((c) => c.canonicalPageStateId));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bunx vitest run tests/scanner/component-detector.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/scanner/component-detector.ts src/db/repositories/components.ts tests/scanner/component-detector.test.ts
git commit -m "feat: reusable component detection across pages"
```

---

## Summary

Final phase gate reminder:
- publish/update lower-level libraries with `/testomniac_app/scripts/push_all.sh` before relying on them upstream
- after each phase, confirm `bun run dev` works in both `/testomniac_api` and `/testomniac_app`

**35 tasks, 6 phases:**

| Phase | Tasks | What's Built |
|-------|-------|-------------|
| 1: Setup + Domain + DB | Tasks 1-5 | Project scaffold, types, config, schema (projects, forms, components, ai_usage, test_runs), repositories |
| 2: Browser + Scanner | Tasks 6-10 | Chromium manager, extractor, issue detector, action queue, mouse scanner |
| 3: Auth + AI + Input | Tasks 11-15 | Form identifier, login/Signic, pairwise generator, AI analyzer, input scanner |
| 4: Test Generation | Task 16 | Templates (render, interaction, form, navigation, e2e), suite tagger |
| 5: Runner + API + Integration | Tasks 17-29 | Executor, worker pool (Test Runs), email, API contract + worker integration, orchestrator (phase timing), projects repo, AI token tracker, email detector/checker, phase timer, password testing, loop guard, scroll scanner, dialog handler, form negative tests, password template, CRUD routes, rate limiting |
| 6: Optional Plugins + Components | Tasks 30-35 | Plugin architecture, SEO check, Security check (network traffic API key detection), Content check (AI), UI Consistency check (cross-page style comparison), Reusable component detection |

Each task is independently committable and testable. Phases 1-5 build the core system and should ship first. Phase 6 is optional follow-on scope and must not block MVP delivery.
