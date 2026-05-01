# Web App Discovery, AI Exploration, and Test Automation System
## Integrated Design Specification

**Date:** April 19, 2026
**Status:** Approved design

---

# 1. Purpose

A Node.js system that discovers UI elements on web applications through action-driven scanning, augments discovery with AI-generated personas and use cases, generates JSON test sequences, and executes them via Puppeteer. Scanning is deterministic and exhaustive within explicit traversal limits; AI is used to understand the site and generate meaningful input data, not to drive navigation.

---

# 2. Goals

1. Action-driven scanning: discover all pages and page states via mouseover → click traversal
2. Extract actionable UI items with screen position, attributes, accessibility info
3. AI-generated personas and use cases to drive form input values
4. Pairwise testing of discrete control combinations (checkbox, toggle, select)
5. Generate JSON action sequence tests via templates
6. Execute tests with a custom Puppeteer runner
7. Capture console logs, network logs, screenshots
8. Detect page state changes via HTML hashing
9. Persist all data in normalized PostgreSQL
10. Email test reports with deep link session rehydration
11. Scan per SizeClass (desktop + mobile); test cases specify which to run

---

# 3. Non-Goals

- CAPTCHA bypass
- MFA beyond single 2FA code entry (e.g., hardware keys, push notifications)
- Multi-browser support
- Distributed crawling
- Advanced visual diffing
- AI-generated test code (templates only)
- Cloud browser services (local Chromium only)
- Exhaustive control combinations (pairwise only)
- Iframe content scanning (payment forms, embedded widgets)
- Shadow DOM traversal

---

# 4. Design Clarifications

These rules resolve the main ambiguities in the original design and are part of the approved plan.

## 4.1 Service Boundaries

- `testomniac_api` remains the existing `Hono` API service.
- The scanner lives in its own project at `~/projects/testomniac_runner`.
- The scanner is a separate worker/service that polls PostgreSQL for pending runs.
- The API does not launch Chromium or perform scanning work directly.
- Real-time updates flow through PostgreSQL `LISTEN/NOTIFY` and are exposed by the API via SSE.

## 4.1.1 Anonymous Project Creation And Claiming

Projects may be created before login.

Anonymous entry flow:
- On the home page, the user enters a URL to scan
- The user may optionally enter an email address
- The system normalizes the URL and checks whether a project for that URL already exists

Email rule:
- If an email is supplied, its domain must match the registrable domain of the submitted URL
- If the domain does not match, reject the request with a validation error

Project creation rule:
- If the URL has not been seen before, create a new project and app for that URL and immediately start scanning
- The new project may exist without being tied to an entity

Duplicate URL rule:
- If a project already exists for the URL and it belongs to an entity:
  - do not create a new project
  - tell the user to ask the owner's email to invite them or let them join the organization
- If a project already exists for the URL and it does not belong to an entity:
  - do not create a new project
  - tell the user to create an account with an email on that domain to claim the project

Anonymous progress rule:
- If the user started a scan without logging in, the UI still shows live scan progress
- At minimum show phase/status, progress bar, and the latest screenshot of the page currently being scanned

Admin rule:
- Site admins can view all projects that are not tied to an entity
- Site admins may use this view to audit, moderate, or manually assist with project claiming

## 4.1.2 Shared Type Ownership

Shared domain and API contract types must live in `testomniac_types`.

Rules:
- `testomniac_api`, `testomniac_runner`, and `testomniac_client` all consume shared types from `testomniac_types`
- Do not duplicate source-of-truth request/response/domain models across those projects
- Scanner-only internal helper types may live in the scanner project, but persisted models and API-facing contracts belong in `testomniac_types`

## 4.2 State Identity Contract

A `Page` is a route-level location. A `Page State` is a materially distinct interactive state within that page.

Page identity:
- Same-origin URL, normalized by removing hash fragments and known tracking query params (`utm_*`, `gclid`, etc.)
- Query params that materially change content remain part of the Page identity

Page State identity:
- Computed from a tuple of:
  - normalized page URL
  - normalized HTML hash
  - actionable item hash
  - visible modal/drawer/menu fingerprint
- Ignore transient differences:
  - timestamps
  - CSRF tokens and nonce-like values
  - randomized element IDs/classes when detectable
  - analytics/debug script content
  - caret/focus/hover-only styling with no new actionable items

A new `Page State` is created only when the post-action result is materially different for future traversal or testing.

## 4.3 Traversal Boundaries And Stop Conditions

Scanning is bounded. “Exhaustive” means exhaustive within the allowed state space for a single run.

Traversal boundaries:
- Same origin only by default
- Skip explicit logout links/buttons
- Skip obviously destructive actions unless explicitly enabled later:
  - delete
  - remove account
  - cancel subscription
  - irreversible admin actions
- Skip file uploads, payments, captcha, and third-party embedded flows

Required stop conditions:
- action signature deduplication per run
- state hash deduplication per SizeClass
- max actions per page state
- max repeated visits to the same page state
- max total actions per run
- max traversal depth from a root navigate action
- max idle retries when an action yields no new state

## 4.4 What Counts As An Actionable Item

An actionable item is any visible, enabled element that a normal user can interact with and that may affect navigation, state, or submitted data.

Include:
- links
- buttons
- menu triggers
- tabs
- accordions
- inputs
- selects
- textareas
- checkboxes
- radios
- switches/toggles
- elements with `role=button`, `role=link`, or click handlers

Exclude:
- hidden or disabled controls
- duplicate elements with the same stable fingerprint inside the same state
- purely decorative elements
- container elements whose only purpose is layout

## 4.5 Authentication And Sign-Up Precedence

Authentication flow order:
1. If user credentials are provided, use login flow first.
2. If login is unavailable but sign-up is detected and auto-registration is allowed, use Signic registration.
3. If both fail, mark authenticated scanning as skipped and record an issue.

Scope rules:
- Support one interactive 2FA step only
- Support email verification via Signic inbox polling
- Do not attempt CAPTCHA bypass
- Credentials are stored encrypted per run/persona and reused by the scanner and runner

## 4.6 Pairwise Scope

Pairwise generation applies only to discrete controls within a single form and a single reachable starting page state.

Rules:
- Free-text fields are filled from AI-generated values before pairwise combinations are applied
- Pairwise covers checkboxes, radios, toggles, and selects
- Do not compute pairwise across multiple forms or across unrelated page states
- If the combination count still exceeds configured caps, trim by priority and log the truncation

## 4.7 Test Generation Prioritization

Generated test cases are prioritized into tiers:

1. Smoke:
   - route renders
   - primary navigation
   - auth entry points
2. Core interaction:
   - click paths that produced new states
   - major modal/menu/tab state changes
3. Form coverage:
   - one positive path per form/persona/use case
   - pairwise discrete combinations
   - negative validation cases
4. Extended E2E:
   - longer multi-step paths with highest user value

Execution always runs higher-priority tiers first if budgets are limited.

---

# 5. High-Level Architecture

```
Node.js
  → Chromium (Puppeteer-core, local, persistent profile)
    → Phase 1a: Mouse-Only Scanning (public)
      → Navigate to pages
      → Mouseover all interactive elements
      → Click all interactive elements
      → Discover Pages, Page States, and element inventory
      → Skip text inputs and form submissions
    → Phase 1a.5: Reusable Component Detection
      → Detect nav, footer, sidebar across all pages
      → Hash and group identical components
      → Mark canonical instance for testing
    → Phase 1b: AI Analysis
      → Send all page content to OpenAI
      → Generate site summary, Personas, Use Cases
      → Generate input values per Persona + Use Case
    → Phase 1c: Input Scanning (public)
      → Fill text inputs with AI-generated values (per Persona + Use Case)
      → Test all discrete control combinations (pairwise)
      → Submit forms, discover new Pages and Page States
    → Phase 1d: Re-verify public pages
      → Navigate to all non-login pages
      → Ensure consistent state capture
    → Phase 2: Login-Required Scanning
      → Authenticate per Persona with credentials
      → Repeat 1a → 1c for authenticated pages
    → Phase 3: Test Generation (template-based)
      → Generate JSON action sequences from discovered data
    → Phase 4: Test Execution
      → Custom runner interprets JSON actions via Puppeteer
      → Captures pass/fail, screenshots, logs
      → Sends email report with deep link
  → PostgreSQL (shared DB, normalized schema)
  → File Storage (screenshots, logs, test artifacts)

testomniac_api (Hono)
  → Firebase Auth middleware
  → REST API for frontend
  → PostgreSQL (shared DB — reads scanner results, writes scan requests)
  → LISTEN/NOTIFY for real-time scan progress → SSE to frontend

testomniac_app (React web) / testomniac_app_rn (React Native)
  → testomniac_client (TanStack Query hooks)
    → testomniac_api
  → SSE for real-time scan progress
  → React Flow for site map visualization
  → TanStack Table for data-heavy list views
```

## System Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  testomniac_app     │     │  testomniac_app_rn   │
│  (React web)        │     │  (React Native)      │
└────────┬────────────┘     └────────┬─────────────┘
         │  HTTP + SSE               │  HTTP + SSE
         └───────────┬───────────────┘
                     ▼
          ┌─────────────────────┐
          │  testomniac_api     │
          │  (Hono + Firebase)  │
          └──────────┬──────────┘
                     │  SQL + LISTEN/NOTIFY
                     ▼
          ┌─────────────────────┐
          │    PostgreSQL       │
          │  (shared database)  │
          └──────────┬──────────┘
                     │  SQL + NOTIFY
                     ▲
          ┌──────────┴──────────┐
          │  Scanner Service    │
          │  (Puppeteer + AI)   │
          │  Polls for pending  │
          │  runs, writes       │
          │  results + events   │
          └─────────────────────┘
```

**Data flow for a scan:**
1. User enters a URL on the home page, with optional email
2. Frontend calls `testomniac_api`
3. API normalizes the URL and checks for an existing project
4. If duplicate project exists:
   - if tied to an entity, return claim/join guidance
   - if unclaimed, return claim guidance
5. If no project exists:
   - create project + app
   - optionally record contact email if domain matches
   - insert `runs` row with status `pending`
6. Scanner polls DB, picks up pending run, sets status `running`
7. Scanner emits progress via `NOTIFY run_events` on PostgreSQL
8. API's SSE endpoint `LISTEN`s on `run_events` channel, streams to frontend
9. Scanner completes and sets status `completed`
10. Frontend shows live progress and final results

---

# 6. Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Browser | Chromium (local) |
| Automation | Puppeteer-core |
| AI | OpenAI Node.js SDK (Phase 1b: personas/use cases) |
| API | Hono (existing testomniac_api) |
| DB | PostgreSQL |
| ORM | Drizzle ORM |
| Real-time | PostgreSQL LISTEN/NOTIFY → SSE |
| HTML processing | jsdom (offline re-parsing fallback) |
| Storage | Filesystem |
| Logging | Pino |
| Email | Postmark (postmark.js) |
| Auth | Firebase (existing) |
| Entity management | @sudobility/entity_service |
| Throwaway email | @sudobility/signic_sdk |
| Token signing | jose |
| Web frontend | React 19, Vite, React Router, TailwindCSS |
| Mobile frontend | React Native 0.81, Expo 54, React Navigation |
| Shared types | @sudobility/testomniac_types |
| API client | @sudobility/testomniac_client (TanStack Query hooks) |
| Business logic | @sudobility/testomniac_lib (Zustand + hooks) |
| Map visualization | React Flow |
| Data tables | TanStack Table |
| UI components | @sudobility/components, @sudobility/building_blocks |

---

# 7. Core Concepts

| Concept | Definition |
|---------|-----------|
| Project | A container for a scanned application. A Project may belong to an entity or may be temporarily unclaimed. Each Project has one App |
| App | Target web application (URL + name). Belongs to a Project |
| Page | A distinct route, identified by URL |
| Page State | A specific DOM state within a Page. One Page can have multiple Page States (e.g., menu open vs. closed). Detected via HTML change hashing |
| Action | A user interaction (navigate, mouseover, click, fill, select, check, toggle, check_email). Has a starting Page State and a target Page + Page State (both optional). Tracks its own duration |
| Persona | A type of user of the web app. Every app has at least one. Created by AI after mouse-only scanning |
| Use Case | A specific user goal belonging to a Persona (e.g., "Purchase a product"). AI creates these and generates input values for each |
| SizeClass | Enum: `desktop` \| `mobile`. Scanner runs once per SizeClass |
| Screen | Enum of common resolutions within a SizeClass (e.g., 1920x1080, 1366x768 for desktop; 390x844, 360x800 for mobile). Test cases run across Screens |
| Component | A reusable UI region (nav bar, footer, sidebar) detected across multiple pages. Identical HTML hash = same component, tested once. Variations tested separately |
| Test Case | An ordered sequence of one or more Actions forming a testable scenario |
| Test Run | An individual execution of a Test Case. Created by the runner. Navigates from the nearest starting point, replays the action chain, detects issues, tracks duration |
| Issue | A problem detected during scanning or test execution: dead click, error on page, console error, or network error. Linked to the triggering Action and optionally to a Test Run. Contains reproduction steps |
| Run | A full session (scanning → test generation → test execution). Tracks wall-clock and per-phase durations |

## Relationships

```
Entity (from entity_service)
  └── Project (1:many)
       └── App (1:1)
            └── Persona (1:many)
            │    └── Use Case (1:many)
            │         └── Input Values (per form field)
            └── Page (1:many)
                 └── Page State (1:many)
                      └── Action (many, as startingPageState)

Unclaimed Project
  └── App (1:1)

Component
  ├── app → App
  ├── canonical_page_state → Page State (the one used for testing)
  ├── html_hash: char(64)
  └── ComponentInstance (1:many)
       ├── page_state → Page State
       └── is_identical: boolean

Action
  ├── type: navigate | mouseover | click | fill | select | check | toggle | check_email
  ├── startingPageState → Page State (optional, null for initial navigate)
  ├── targetPage → Page (optional, null if same page)
  ├── targetPageState → Page State (optional, filled after execution)
  ├── persona → Persona (optional, for input actions)
  ├── useCase → Use Case (optional, for input actions)
  ├── status: open | completed
  └── durationMs: int (time to execute this action)

Run
  ├── app → App
  ├── totalDurationMs: int (wall-clock)
  ├── phaseDurations: { mouse_scanning, ai_analysis, input_scanning, auth_scanning, test_generation, test_execution } (ms each)
  └── Test Case (1:many, generated from scan data)

Test Case
  └── Action (1:many, ordered)
  └── persona → Persona (optional)
  └── sizeClass → SizeClass

Test Run
  ├── test_case → Test Case
  ├── run → Run
  ├── screen → Screen
  ├── status: passed | failed | skipped
  ├── durationMs: int
  └── Issue (0:many, detected during execution)

Issue
  ├── action → Action (optional, the triggering scanning action)
  ├── test_run → Test Run (optional, if detected during test execution)
  ├── test_case → Test Case
  ├── page → Page
  ├── page_state → Page State
  └── type: dead_click | error_on_page | console_error | network_error | email_not_received
```

---

# 8. Functional Requirements

## 8.1 Authentication

Authentication is optional for initial project creation and public scanning. Login is only required later for claiming projects, joining organizations, or accessing organization-scoped data.

### Login Detection

Pages requiring login are detected via:
- HTTP redirect to `/login`, `/signin`, `/auth` (or similar)
- HTTP 401/403 response

### Form Identification

The scanner identifies sign-up and login forms using heuristics (both applied, either sufficient):

**URL/text matching:** Forms on pages with URLs or visible text containing "signup", "sign up", "register", "create account", "join", "get started" → sign-up form. URLs/text containing "login", "log in", "signin", "sign in" → login form.

**Field pattern matching:**
- Sign-up form: has "name"/"first name" + "email" + "password" + optional "confirm password"
- Login form: has only "email"/"username" + "password" (2 fields, no name field)
- Contact/other form: has "message"/"subject" or lacks password field → not auth

### Two Credential Modes

**Mode A: User-Provided Credentials**

The tester provides:
- Email or username
- Password
- 2FA code (optional)

The scanner uses these to log in via the identified login form:
1. Navigate to login page
2. Fill email/username and password fields
3. Submit form
4. If 2FA prompt detected (input field after login submit, typically with "code", "verification", "2FA", "authenticator" labels): fill the provided 2FA code
5. Verify login succeeded (no redirect back to login, no error on page)
6. Proceed with authenticated scanning

**Mode B: Signic Auto-Registration (No Credentials Provided)**

When no credentials are provided, the scanner creates an account automatically using the Signic SDK:

1. Generate a random Ethereum private key
2. Create a `SignicClient` → derive email address (`0x...@signic.email`)
3. Generate a test password (e.g., `TestPass!${randomHex(8)}`)
4. Find the sign-up form (identified in Phase 1a via heuristics)
5. Fill the form: name = "Test User", email = Signic email, password = generated password
6. Submit the form
7. Poll Signic inbox (`client.getUnreadEmails()`) for verification email
8. Extract OTP code or verification link from email body (`client.getEmail()`)
9. If OTP: find the verification input field, fill it, submit
10. If link: navigate to the verification URL
11. Verify account creation succeeded
12. Store the credentials (Signic email + password) for use in Phase 2 login

If the site rejects the Signic email format or sign-up fails, skip authenticated scanning and log the issue.

### Password Requirement Testing (Sign-Up Screens)

When a sign-up form is identified, the scanner detects password requirements from visible text on the page (e.g., "Password must be at least 8 characters", "Must contain uppercase, lowercase, number, and special character", "No spaces allowed").

**Detection:** Text pattern matching on visible page text for common password rule phrases:
- Length: "at least N characters", "minimum N characters", "N+ characters"
- Uppercase: "uppercase", "capital letter"
- Lowercase: "lowercase"
- Number/digit: "number", "digit"
- Special character: "special character", "symbol", "!@#$"
- No spaces: "no spaces"

**Test generation:** Based on detected requirements, the scanner generates password test cases:

1. **Fail cases first** — one test per requirement violation:
   - Too short (if min length detected)
   - No uppercase (if uppercase required)
   - No lowercase (if lowercase required)
   - No number (if number required)
   - No special character (if special char required)
   - Contains spaces (if no-spaces rule detected)
   Each fail case fills the sign-up form, submits, and asserts that the form shows a validation error or does not proceed.

2. **Pass case last** — a password satisfying all detected requirements:
   - Fill the sign-up form with a valid password, submit, assert success.

These test cases are created during Phase 1c (Input Scanning) when processing sign-up forms. Each becomes a test case linked to the sign-up page.

### Session Persistence

- Persistent Chromium profile via `user-data-dir`
- Login session preserved across scanning phases
- If session expires mid-scan, re-authenticate using stored credentials

## 8.2 Phase 1a: Mouse-Only Scanning (Public)

Discovers all publicly reachable Pages and Page States using only navigate, mouseover, and click. No text input, no form submission.

**Action queue algorithm:**

The scanner maintains a queue of open Actions. It always picks the next open Action, executes it, records the result, and creates new Actions from what it discovers. Scanning ends when no open Actions remain.

**Step 1 — Seed the queue:**

Create an initial `navigate` Action:
- `startingPageState`: null
- `targetPage`: base URL Page
- `targetPageState`: null (to be filled)
- `status`: open

**Step 2 — Process loop:**

```
while (open mouse actions exist):
  pick next open action

  if action's startingPageState != current browser state:
    find nearest navigate action to reach the right state
    execute that navigation first

  execute the action:

    case NAVIGATE:
      load the URL
      parse HTML → create target Page State
      scan page → extract all interactive elements
      create MOUSEOVER Action for each element:
        startingPageState = this navigate's targetPageState
      mark navigate as completed

    case MOUSEOVER:
      simulate mouse hover on element
      if HTML changed:
        create new Page State as targetPageState
        scan new state → create MOUSEOVER Actions for newly visible elements
      else:
        targetPageState = startingPageState
      create a CLICK Action:
        startingPageState = this mouseover's targetPageState
      mark mouseover as completed

    case CLICK:
      simulate click
      if URL changed:
        targetPage = new or existing Page
        parse HTML → targetPageState = new or existing Page State
        if new Page State:
          scan → create MOUSEOVER Actions for elements
      else (same URL):
        if HTML changed:
          targetPageState = new Page State
          scan → create MOUSEOVER Actions for new elements
        else:
          targetPageState = startingPageState
      mark click as completed

  deduplication:
    if targetPage + targetPageState already fully covered:
      don't create new Actions from it
```

**Element discovery** — runs as `page.evaluate()` on each new Page State:

Selectors:
```
a[href], button, input:not([type="hidden"]), select, textarea, summary,
[role="button"], [role="link"], [role="checkbox"], [role="radio"],
[role="switch"], [role="tab"], [role="menuitem"], [role="textbox"],
[role="combobox"], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]
```

Captured per element:
```ts
type ActionableItem = {
  stableKey: string
  selector: string
  tagName: string
  role?: string
  inputType?: string
  actionKind: 'click' | 'fill' | 'toggle' | 'select' | 'navigate'
  accessibleName?: string
  textContent?: string
  href?: string
  disabled: boolean
  visible: boolean
  x?: number
  y?: number
  width?: number
  height?: number
  attributes: Record<string, unknown>
}
```

**What this phase skips:**
- Elements requiring text input (`input[type=text]`, `textarea`, etc.) — deferred to Phase 1c
- Form submit buttons — deferred until inputs are filled in Phase 1c

**What this phase produces:**
- All publicly reachable Pages and Page States
- Full actionable item inventory per Page State
- Page State hashes for change detection
- Screenshots and console/network logs per Page State

## 8.3 Phase 1a.5: Reusable Component Detection

After mouse-only scanning discovers all pages and page states, detect reusable components (nav bars, footers, sidebars) to avoid duplicate testing.

### Detection Algorithm

1. **Extract candidate regions** from each Page State's HTML using structural selectors:
   - `<nav>`, `<header>`, `<footer>`
   - `[role="navigation"]`, `[role="banner"]`, `[role="contentinfo"]`
   - Elements with IDs/classes matching common patterns: `navbar`, `sidebar`, `menu`, `footer`, `header`, `top-bar`, `bottom-bar`

2. **Normalize and hash** each candidate's inner HTML (strip whitespace, sort attributes — same normalization as page state hashing)

3. **Group by hash** across all Page States:
   - Same hash on 2+ pages → reusable component. Create a `components` row with one `canonical_page_state_id` (the first page state where it appeared)
   - Create `component_instances` rows for each occurrence, marking `is_identical = true`

4. **Detect variations**: If a candidate region (same selector, e.g., `<nav>`) appears on multiple pages but with different hashes:
   - Each unique hash gets its own `components` row
   - Instances with a different hash from the canonical are marked `is_identical = false`
   - Example: a nav bar that adds an "active" class on the current page → different hash → tested separately

### Impact on Scanning and Testing

**During Phase 1a (mouse scanning):**
- All elements on all pages are still scanned — component detection doesn't skip scanning
- Component detection runs after Phase 1a completes, before Phase 1b

**During test generation (Phase 3):**
- For identical component instances (`is_identical = true`): generate test actions only for the canonical page state. Skip generating mouseover/click actions for the same elements on other pages
- For non-identical instances (`is_identical = false`): generate test actions for each unique variation
- Navigation and E2E tests still traverse through pages with components — only the component-internal actions (e.g., clicking each nav link) are deduplicated

**Example:**
- Footer appears identically on 20 pages → 1 render test for footer elements (on canonical page), not 20
- Header nav appears on 20 pages but has "active" state variations on 3 pages → 1 canonical test + 3 variation tests

### Hamburger Menu Handling

On mobile SizeClass, the scanner detects hamburger menus via:
- Buttons with `aria-label` matching "menu", "hamburger", "toggle navigation"
- Elements with `role="button"` that toggle `aria-expanded`
- Elements containing the typical hamburger icon (three-line pattern)

The hamburger menu and its expanded content are treated as a component. If the expanded menu HTML is identical across pages, it's tested once.

## 8.4 Phase 1b: AI Analysis

After mouse-only scanning completes, send all page content to OpenAI:

1. **Site summary** — what the website does, its domain, key features
2. **Personas** — types of users the site serves (e.g., "Shopper", "Blog Reader", "Admin"). Every app gets at least one Persona
3. **Use Cases** per Persona — specific user goals (e.g., Shopper: "Search for a product", "Add to cart", "Complete checkout")
4. **Input values** per Use Case — for each form field encountered, AI generates appropriate values tied to the Persona + Use Case context (e.g., for Shopper "Sign up": name = "Jane Smith", email = "jane@example.com")

Personas, Use Cases, and input values are persisted to the DB for use in Phase 1c and test generation.

## 8.5 Phase 1c: Input Scanning (Public)

Process all deferred input actions, informed by Personas and Use Cases.

### Text inputs

For each form with text fields, for each Persona with a relevant Use Case:
- Create `fill` Actions with AI-generated input values for that Persona + Use Case
- Create a `click` Action on the submit button
- Execute → record resulting Page + Page State
- If new Page State → scan for new elements and create Actions

Each Persona gets its own separate set of fill + submit Actions, even on shared forms.

### Discrete controls (pairwise testing)

| Control | States |
|---------|--------|
| Checkbox | checked / unchecked |
| Toggle | on / off |
| Select/dropdown | each option value |
| Radio group | each option |

For forms with multiple discrete controls, use **pairwise testing** (all 2-way combinations) instead of exhaustive combinations:
- Generates far fewer test cases (e.g., 5 checkboxes + 2 selects with 4 options: ~20 pairwise vs. 512 exhaustive)
- Covers all interactions between any two controls
- Each pairwise combination becomes a separate Action sequence (fill/check/select/toggle + submit)
- Each result is a potential new Page State

```
for each form:
  generate pairwise combinations of control values
  for each combination:
    for each Persona with a relevant Use Case:
      create fill/check/select/toggle Actions (with Persona's text input values)
      create submit Action
      execute → record resulting Page + Page State
      if new state → scan for new Actions
```

## 8.6 Phase 1d: Re-Verify Public Pages

After Phases 1a-1c complete, re-verify all public pages to detect login requirements. During earlier phases, some pages may not have been tested for auth (they were reached via click, not direct navigation).

1. Review all discovered Pages
2. For each page, attempt a fresh `navigate` (direct URL load)
3. If the response redirects to an auth page or returns 401/403: mark `requires_login = true`
4. If the page loads normally: compare hashes against the most recent Page State to detect any content changes since initial scan
5. This categorizes all pages into public vs. login-required, which drives Phase 2

## 8.7 Phase 2: Login-Required Scanning

After public scanning + re-verification:

1. **Authenticate:**
   - If user-provided credentials: use login-executor to fill the login form, handle 2FA if needed
   - If no credentials: use signic-registrar to auto-register (see Section 7.1 Mode B), then log in with the generated credentials
2. **Scan authenticated pages:**
   - Create `navigate` Actions to all pages that returned 401/403 or redirected to auth
   - Run the same process loop (Phase 1a algorithm) for authenticated pages
   - Then run Phase 1c (input scanning) for authenticated forms using Persona Use Cases
3. New authenticated Pages, Page States, and Actions are discovered and persisted
4. If session expires mid-scan, re-authenticate using stored credentials and resume

## 8.8 State Management

The scanner tracks the current browser state (current Page + Page State). When picking the next open Action:

- If the Action's `startingPageState` matches the current browser state → execute directly
- If not → restore the required state using the **action chain**:
  1. Each Page State records `created_by_action_id` — the action that first produced this state
  2. Walk backward from the target Page State via `created_by_action_id` to find the nearest `navigate` action
  3. Execute the navigate action (load the URL)
  4. Replay the mouseover chain in order to reach the target Page State
  5. This chain is typically: navigate → mouseover (produces intermediate state) → mouseover (produces target state)

## 8.9 SizeClass Scanning

The full scanning process (Phases 1a through 2) runs **once per SizeClass**:

1. **Desktop scan** — full viewport (e.g., 1920x1080)
2. **Mobile scan** — mobile viewport (e.g., 390x844)

Each may discover different elements (hamburger menus, mobile nav, responsive layouts). Pages, Page States, and Actions are tagged with their SizeClass.

Test cases specify which SizeClass they belong to. During test execution, the runner selects which SizeClass and Screen resolutions to test.

## 8.10 Issue Detection

Issues are created automatically during scanning when the scanner detects problems. All issues are severity `error` (warning-level issues are a future addition).

### Issue Types

| Issue Type | Trigger | Detection |
|-----------|---------|-----------|
| `dead_click` | A click action's ending Page State is the same as its starting Page State | Compare `target_page_state_id` == `starting_page_state_id` after click execution. The click didn't navigate or change anything |
| `error_on_page` | The ending Page State contains an error message | Text pattern matching (visible text containing "error", "failed", "something went wrong", "not found", "500", "404", "oops", "unexpected", etc.) + HTML pattern matching (elements with `role="alert"`, `.error`, `.alert-danger`, `.alert-error`, `[data-error]`, `.error-message`, `.toast-error`) |
| `console_error` | Console error logged during an action | Capture all `console.error` calls during action execution. Filter out known noise: favicon 404s, third-party script errors (different domain), deprecated API warnings |
| `network_error` | Network request failure during an action | Same-domain requests with status >= 400, OR any domain with status >= 500. Ignore third-party 4xx (analytics, tracking, ads) |
| `email_not_received` | `check_email` action timed out waiting for email | Signic inbox polled for 60s with no matching email |

### Issue Content

Each issue contains:
- **Reproduction steps**: The full action chain from the initial `navigate` action to the action that triggered the issue. This is the minimal path to reproduce
- **Description**: Human-readable text describing what happened (e.g., "Click on 'Submit' button did not navigate or change page state", "Page shows error message: 'Something went wrong'", "POST /api/orders returned 500")
- **Console log**: Full console output captured during the triggering action
- **Network log**: All network requests/responses during the triggering action
- **Screenshot**: Screenshot of the page at the time of the issue

### When Issues Are Created

Issues are detected and created in real-time during scanning (all phases):
- After every `click` action: check for `dead_click`
- After every action: check ending Page State for `error_on_page`
- After every action: check console buffer for `console_error`
- After every action: check network log for `network_error`

A single action can produce multiple issues (e.g., a click that returns a 500 AND shows an error message AND logs a console error = 3 separate issues, all sharing the same reproduction steps).

## 8.11 Email Detection and Checking

The scanner detects when an action will trigger an email, and automatically creates a `check_email` action to verify it arrives and act on its content.

### Detection: Two Cases

**Case 1: Public page with email input**

Before form submission, detect:
- The form contains an email input field
- Visible text on the page matches email-hint patterns: "we'll send you", "check your email", "verification email", "confirm your email", "we'll email you", "you'll receive an email", "enter your email to receive"

After form submission, confirm:
- Visible text matches confirmation patterns: "email sent", "check your inbox", "we've sent", "verification link sent", "please check your email", "confirmation email"

**Case 2: Logged-in action triggering email**

After a click or form submission in an authenticated session:
- Visible text matches the same confirmation patterns as Case 1
- Applies to any action, not just form submissions (e.g., clicking "Resend verification", "Send invoice", "Reset password")

### check_email Action

When email detection triggers (either case), the scanner creates a `check_email` action:
- `startingPageState`: the current Page State (after submission)
- Uses the Signic SDK to poll the inbox
- Waits up to 60 seconds for the email to arrive (poll every 2 seconds)
- Records whether the email arrived (creates an issue of type `email_not_received` if it doesn't)

**Signic client sharing:** When Signic auto-registration is used (Mode B), the Signic client and private key are stored in the `credential_manager`. Both the scanner and the test runner access the same client via the credential manager, ensuring they poll the same inbox. For test execution, the runner re-creates the Signic client from the stored private key if a `check_email` action is encountered.

### Acting on Email Content

When an email arrives, the scanner examines its content:

1. **OTP code found** (4-8 digit number): 
   - Find an input field on the current page matching OTP selectors (`input[name*="code"]`, `input[name*="otp"]`, `input[name*="verification"]`, etc.)
   - Create a `fill` action with the OTP value
   - Create a `click` action on the submit button

2. **Verification/action link found** (URL containing "verify", "confirm", "activate", "reset"):
   - Create a `navigate` action to the link URL
   - After navigation, capture the resulting Page State

3. **Neither found**:
   - Record that the email was received but contained no actionable content
   - No further actions created

### Issue Type for Email

| Issue Type | Trigger | Detection |
|-----------|---------|-----------|
| `email_not_received` | `check_email` action timed out waiting for email | Signic inbox polled for 60s with no matching email |

## 8.12 JavaScript Dialog Handling

The scanner auto-handles JavaScript dialogs to prevent blocking:
- `alert()` → auto-dismiss
- `confirm()` → auto-accept (click OK)
- `prompt()` → auto-dismiss with empty string
- `beforeunload` → auto-accept (allow navigation)

Puppeteer's `page.on('dialog')` handler is registered at page creation. All dialogs are logged in the action's console log.

## 8.13 Scroll Handling

Puppeteer's `el.hover()` and `el.click()` auto-scroll elements into view. The scanner does not need explicit scroll actions during discovery. However, some elements may only appear after scrolling (lazy-loaded content). After initial page state extraction, the scanner scrolls to bottom in increments, checking for new elements at each step. New elements found after scroll create additional mouseover actions.

## 8.14 Infinite Loop Protection

The scanning algorithm can encounter cycles (Page State A → click → Page State B → click → Page State A). Protection mechanisms:

- **Action signature deduplication**: Before creating an action, compute a signature (`type + actionable_item_id + starting_page_state_id`). If this signature already exists for the current run, skip creation.
- **Max actions per page state**: No more than 200 actions can originate from a single Page State. Beyond this, log a warning and stop creating new actions for that state.
- **Max total actions per run**: Default 5000. Configurable. Scanner stops when reached.
- **Max pages per run**: Default 100. Configurable.

## 8.15 Page Change Detection

| Hash | Purpose |
|------|---------|
| HTML hash | Coarse full-page change |
| Normalized HTML hash | Structural change (whitespace/attribute-order normalized) |
| Text hash | Visible content change |
| Actionable hash | Interaction surface change |

A new Page State is created if ANY hash differs from the current state. URL change creates a new Page.

## 8.16 Artifact Capture

Per Page State (during scanning):
- Screenshot (JPEG, quality 72)
- Console log buffer (errors, warnings)
- Network log buffer (API calls: method, URL, status, content-type)
- Raw HTML snapshot

Per test execution:
- Screenshot on failure
- Console errors during execution

All artifacts stored to filesystem, paths recorded in DB.

**Directory structure:**
```
artifacts/
  {run_id}/
    pages/
      {page_id}/
        {page_state_id}/
          screenshot.jpg
          raw.html
    test_runs/
      {test_run_id}/
        failure.jpg
    logs/
      console.log
      network.log
```

---

# 9. Test Case Generation (Phase 3)

Test cases are generated from the scanning data. Template-based, no AI. Each test case is a JSON action sequence.

## Generation Rules

| Scanning Pattern | Test Case |
|-----------------|-----------|
| `navigate` | Own test case: navigate to page, assert it loads |
| `mouseover` → `click` | Grouped into one test case |
| `mouseover` → `mouseover` → `click` (menu drill-down) | All grouped into one test case |
| `fill` (multiple fields) → `submit` | One test case per Persona + Use Case (positive) |
| Required fields empty → `submit` | One negative test case per form: leave each required field empty, assert validation error |
| Invalid format → `submit` | One negative test per field type: invalid email, too-short text, etc. |
| Pairwise control combinations → `submit` | One test case per pairwise combination per Persona |
| Password fail case → `submit` | One test per requirement violation on sign-up forms (too short, no uppercase, etc.) |
| Password pass case → `submit` | One test with valid password on sign-up forms |

Each Persona gets separate test cases even on shared forms.

## Test Types

### Render tests
For each Page State: navigate (+ any mouseover chain to reach the state), assert key elements visible.

```json
{
  "name": "Render — Homepage",
  "type": "render",
  "sizeClass": "desktop",
  "suite_tags": ["regression", "sanity"],
  "page_id": 1,
  "actions": [
    { "action": "navigate", "url": "https://example.com" },
    { "action": "waitForLoad" },
    { "action": "assertVisible", "selector": "[role='button'][name='Sign Up']" },
    { "action": "assertVisible", "selector": "a[href='/pricing']" },
    { "action": "screenshot", "label": "homepage-rendered" }
  ]
}
```

### Mouseover + Click tests
For interactive elements that trigger state changes.

```json
{
  "name": "Mouseover + Click — Main Nav → Products Menu",
  "type": "interaction",
  "sizeClass": "desktop",
  "suite_tags": ["regression"],
  "actions": [
    { "action": "navigate", "url": "https://example.com" },
    { "action": "waitForLoad" },
    { "action": "mouseover", "selector": "a[href='/products']" },
    { "action": "assertVisible", "selector": ".dropdown-menu" },
    { "action": "click", "selector": "a[href='/products/shoes']" },
    { "action": "waitForNavigation" },
    { "action": "assertUrl", "pattern": "/products/shoes" }
  ]
}
```

### Form tests
Per Persona + Use Case. Includes pairwise combinations for discrete controls.

```json
{
  "name": "Form — Contact (Persona: Shopper, UC: Ask about order)",
  "type": "form",
  "sizeClass": "desktop",
  "persona_id": 1,
  "use_case_id": 3,
  "suite_tags": ["regression", "sanity"],
  "actions": [
    { "action": "navigate", "url": "https://example.com/contact" },
    { "action": "fill", "selector": "[name='name']", "value": "Jane Smith" },
    { "action": "fill", "selector": "[name='email']", "value": "jane@example.com" },
    { "action": "fill", "selector": "[name='message']", "value": "Where is my order #12345?" },
    { "action": "select", "selector": "[name='topic']", "value": "orders" },
    { "action": "click", "selector": "button[type='submit']" },
    { "action": "waitForNavigation" },
    { "action": "assertUrlChanged" }
  ]
}
```

### Form negative tests
For each form with required fields: leave required fields empty and submit. Also test invalid formats (bad email, too-short input).

```json
{
  "name": "Form Negative — Contact (missing email)",
  "type": "form_negative",
  "sizeClass": "desktop",
  "suite_tags": ["regression"],
  "actions": [
    { "action": "navigate", "url": "https://example.com/contact" },
    { "action": "fill", "selector": "[name='name']", "value": "Jane Smith" },
    { "action": "fill", "selector": "[name='message']", "value": "Hello" },
    { "action": "click", "selector": "button[type='submit']" },
    { "action": "assertUrlChanged", "_expect": "should NOT change" },
    { "action": "assertVisible", "selector": "[role='alert'], .error, .field-error" }
  ]
}
```

### Password tests
For sign-up forms with detected password requirements. Fail cases first, pass case last.

```json
{
  "name": "Password Fail — Sign Up (too short)",
  "type": "password",
  "sizeClass": "desktop",
  "suite_tags": ["regression"],
  "actions": [
    { "action": "navigate", "url": "https://example.com/signup" },
    { "action": "fill", "selector": "[name='email']", "value": "test@example.com" },
    { "action": "fill", "selector": "[name='password']", "value": "Ab1!" },
    { "action": "click", "selector": "button[type='submit']" },
    { "action": "assertUrl", "pattern": "/signup", "_comment": "should stay on signup" }
  ]
}
```

### Navigation tests
For each page-to-page transition discovered during scanning.

```json
{
  "name": "Navigation — Home → Pricing",
  "type": "navigation",
  "sizeClass": "desktop",
  "suite_tags": ["regression", "sanity"],
  "actions": [
    { "action": "navigate", "url": "https://example.com" },
    { "action": "waitForLoad" },
    { "action": "click", "selector": "a[href='/pricing']" },
    { "action": "waitForNavigation" },
    { "action": "assertUrl", "pattern": "/pricing" }
  ]
}
```

### E2E tests
Multi-hop journeys via DFS path enumeration (acyclic paths, length >= 3, max depth 6, max 20 paths).

```json
{
  "name": "E2E — Home → Pricing → Sign Up",
  "type": "e2e",
  "sizeClass": "desktop",
  "suite_tags": ["regression", "sanity", "smoke"],
  "actions": [
    { "action": "navigate", "url": "https://example.com" },
    { "action": "step", "label": "Step 1: Home → Pricing" },
    { "action": "click", "selector": "a[href='/pricing']" },
    { "action": "assertUrl", "pattern": "/pricing" },
    { "action": "step", "label": "Step 2: Pricing → Sign Up" },
    { "action": "click", "selector": "a[href='/signup']" },
    { "action": "assertUrl", "pattern": "/signup" }
  ]
}
```

## Action Vocabulary

| Action | Parameters | Purpose |
|--------|-----------|---------|
| `navigate` | `url` | Go to URL |
| `waitForLoad` | | Wait for networkidle |
| `waitForNavigation` | | Wait after click triggers navigation |
| `mouseover` | `selector` | Hover over element |
| `click` | `selector` | Click element |
| `fill` | `selector`, `value` | Type into input |
| `select` | `selector`, `value` | Select dropdown option |
| `check` | `selector`, `value` (true/false) | Set checkbox state |
| `toggle` | `selector`, `value` (true/false) | Set toggle state |
| `scroll` | `direction`, `amount` | Scroll page |
| `screenshot` | `label` | Capture screenshot |
| `assertVisible` | `selector` | Assert element visible |
| `assertNotVisible` | `selector` | Assert element hidden |
| `assertUrl` | `pattern` | Assert URL matches pattern |
| `assertUrlChanged` | | Assert URL differs from start |
| `assertText` | `selector`, `text` | Assert element contains text |
| `check_email` | `timeout` | Poll Signic inbox for email, act on OTP/link if found |
| `step` | `label` | Label for grouping (E2E) |

## Suite Tag Assignment

- All tests get `regression`
- High-priority render tests get `sanity` + `smoke`
- High-priority form tests get `sanity`
- Navigation tests get `sanity`
- E2E tests get `sanity` + `smoke`

**Priority heuristics:** URLs/titles containing login, signin, signup, register, checkout, payment, cart, settings, admin, dashboard, account, profile, auth → `high`.

---

# 10. Test Execution (Phase 4)

Custom runner interprets JSON action sequences using Puppeteer. Each execution of a Test Case creates a **Test Run** record.

1. Read `test_cases` from DB, optionally filter by `suite_tags`, `sizeClass`, `persona_id`
2. For each selected Screen resolution within the SizeClass: set viewport size
3. Execute via worker pool (default 3 workers, configurable)
4. Per test case per screen:
   - Create a `test_runs` row with `status: running` and `started_at: now()`
   - Fresh page in shared Chromium instance, set viewport to Screen resolution
   - Navigate to the nearest starting point (the first `navigate` action in the test case)
   - Iterate actions, execute via Puppeteer mapping
   - After each action: check for issues (error on page, console errors, network errors)
   - If issue detected: create `issues` row linked to the `test_run_id`
   - On assertion failure: mark Test Run `failed`, capture screenshot + error
   - On success: mark Test Run `passed`
   - Record duration, screenshot path, console log, network log on the Test Run
   - Set `completed_at: now()` and compute `duration_ms`
5. 1 automatic retry on failure before final `failed` status
6. Timeouts: 30s per test case, 10s per individual action
7. Per-phase duration tracked: total time for all Test Runs recorded as `test_execution_duration_ms` on the Run

**Action-to-Puppeteer mapping:**

```
navigate         → page.goto(url, { waitUntil: 'networkidle0' })
waitForLoad      → page.waitForNavigation({ waitUntil: 'networkidle0' })
waitForNavigation → page.waitForNavigation({ waitUntil: 'networkidle0' })
mouseover        → page.waitForSelector(selector) → el.hover()
click            → page.waitForSelector(selector) → el.click()
fill             → page.waitForSelector(selector) → el.type(value)
select           → page.select(selector, value)
check            → page.waitForSelector(selector) → set checked state
toggle           → page.waitForSelector(selector) → el.click()
scroll           → page.evaluate(window.scrollBy)
screenshot       → page.screenshot({ path })
assertVisible    → page.waitForSelector(selector, { visible: true, timeout: 5000 })
assertNotVisible → page.waitForSelector(selector, { hidden: true, timeout: 5000 })
assertUrl        → check page.url() matches pattern
assertUrlChanged → check page.url() !== startUrl
assertText       → el.textContent includes text
check_email      → poll Signic inbox (2s intervals, 60s timeout), extract OTP/link, act
step             → no-op, label in results
```

---

# 11. Email Reporting

After test execution:
1. Compute summary: total, passed, failed, skipped, duration
2. Generate signed deep link token (jose, contains run_id)
3. Build HTML + plain text email
4. Send via Postmark
5. Record in `report_emails` table

---

# 12. Database Schema

```sql
-- Projects may belong to an entity or remain unclaimed until later
create table projects (
  id bigserial primary key,
  entity_id uuid,
  name text not null,
  description text,
  contact_email text,
  claimed_by_user_id uuid,
  claimed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Target applications (one per project)
create table apps (
  id bigserial primary key,
  project_id bigint references projects(id) not null,
  name text not null,
  base_url text,
  normalized_base_url text not null unique,
  created_at timestamptz default now()
);

-- Personas for an app (AI-generated)
create table personas (
  id bigserial primary key,
  app_id bigint references apps(id),
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Use cases per persona (AI-generated)
create table use_cases (
  id bigserial primary key,
  persona_id bigint references personas(id),
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- AI-generated input values per use case + form field
create table input_values (
  id bigserial primary key,
  use_case_id bigint references use_cases(id),
  field_selector text not null,
  field_name text,
  value text not null,
  created_at timestamptz default now()
);

-- Logical pages (identified by URL)
create table pages (
  id bigserial primary key,
  app_id bigint references apps(id),
  url text not null,
  route_key text,
  requires_login boolean default false,
  created_at timestamptz default now()
);

-- Page states (DOM states within a page)
create table page_states (
  id bigserial primary key,
  page_id bigint references pages(id),
  size_class text not null default 'desktop',
  created_by_action_id bigint,
  html_hash char(64),
  normalized_html_hash char(64),
  text_hash char(64),
  actionable_hash char(64),
  screenshot_path text,
  raw_html_path text,
  content_text text,
  captured_at timestamptz default now()
);

-- Forms discovered on page states
create table forms (
  id bigserial primary key,
  page_state_id bigint references page_states(id),
  selector text not null,
  action text,
  method text default 'GET',
  submit_selector text,
  field_count int default 0,
  form_type text,
  fields_json jsonb not null,
  created_at timestamptz default now()
);

-- Individual interactable elements per page state
create table actionable_items (
  id bigserial primary key,
  page_state_id bigint references page_states(id),
  stable_key text,
  selector text,
  tag_name text,
  role text,
  action_kind text,
  accessible_name text,
  disabled boolean,
  visible boolean,
  x double precision,
  y double precision,
  width double precision,
  height double precision,
  attributes_json jsonb
);

-- Reusable components detected across pages
create table components (
  id bigserial primary key,
  app_id bigint references apps(id),
  name text not null,
  selector text not null,
  html_hash char(64) not null,
  canonical_page_state_id bigint references page_states(id),
  size_class text not null default 'desktop',
  created_at timestamptz default now()
);

-- Instances of components on specific page states
create table component_instances (
  id bigserial primary key,
  component_id bigint references components(id),
  page_state_id bigint references page_states(id),
  is_identical boolean default true,
  html_hash char(64),
  created_at timestamptz default now()
);

-- Discovery + test session (defined before actions due to FK dependency)
create table runs (
  id bigserial primary key,
  app_id bigint references apps(id),
  status text not null default 'running',
  phase text not null default 'mouse_scanning',
  size_class text not null default 'desktop',
  pages_found int default 0,
  page_states_found int default 0,
  actions_completed int default 0,
  ai_summary text,
  total_duration_ms int,
  mouse_scanning_duration_ms int,
  ai_analysis_duration_ms int,
  input_scanning_duration_ms int,
  auth_scanning_duration_ms int,
  test_generation_duration_ms int,
  test_execution_duration_ms int,
  plugin_duration_ms int,
  plugins_enabled text[] default '{}',
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Actions (scanning interactions)
create table actions (
  id bigserial primary key,
  run_id bigint references runs(id),
  type text not null,
  actionable_item_id bigint references actionable_items(id),
  starting_page_state_id bigint references page_states(id),
  target_page_id bigint references pages(id),
  target_page_state_id bigint references page_states(id),
  persona_id bigint references personas(id),
  use_case_id bigint references use_cases(id),
  input_value text,
  status text not null default 'open',
  size_class text not null default 'desktop',
  duration_ms int,
  screenshot_before text,
  screenshot_after text,
  console_log text,
  network_log text,
  started_at timestamptz,
  executed_at timestamptz
);

-- Generated test cases (JSON action sequences)
create table test_cases (
  id bigserial primary key,
  run_id bigint references runs(id),
  name text not null,
  test_type text not null,
  size_class text not null default 'desktop',
  suite_tags text[] not null default '{}',
  page_id bigint references pages(id),
  persona_id bigint references personas(id),
  use_case_id bigint references use_cases(id),
  priority text not null default 'normal',
  actions_json jsonb not null,
  generated_at timestamptz default now()
);

-- Individual execution of a test case
create table test_runs (
  id bigserial primary key,
  test_case_id bigint references test_cases(id),
  run_id bigint references runs(id),
  screen text not null,
  status text not null default 'running',
  duration_ms int default 0,
  error_message text,
  screenshot_path text,
  console_log text,
  network_log text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- Issues detected during scanning, test execution, or plugins
create table issues (
  id bigserial primary key,
  run_id bigint references runs(id),
  action_id bigint references actions(id),
  test_case_id bigint references test_cases(id),
  test_run_id bigint references test_runs(id),
  plugin text,
  type text not null,
  severity text not null default 'error',
  description text not null,
  reproduction_steps jsonb,
  console_log text,
  network_log text,
  screenshot_path text,
  page_id bigint references pages(id),
  page_state_id bigint references page_states(id),
  details_json jsonb,
  created_at timestamptz default now()
);

-- AI token usage tracking
create table ai_usage (
  id bigserial primary key,
  run_id bigint references runs(id),
  phase text not null,
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  purpose text,
  created_at timestamptz default now()
);

-- Encrypted scan credentials (separate from runs for security)
create table scan_credentials (
  id bigserial primary key,
  run_id bigint references runs(id) unique,
  encrypted_email text,
  encrypted_password text,
  encrypted_two_factor_code text,
  created_at timestamptz default now()
);

-- Real-time scan progress events (for LISTEN/NOTIFY streaming)
create table run_events (
  id bigserial primary key,
  run_id bigint references runs(id),
  event_type text not null,
  event_data jsonb not null,
  created_at timestamptz default now()
);

-- Email report tracking
create table report_emails (
  id bigserial primary key,
  run_id bigint references runs(id),
  user_email text not null,
  deep_link_token text unique,
  sent_at timestamptz default now()
);
```

---

# 13. API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/public/scan` | Anonymous URL submission. Creates project + pending run, or returns duplicate/claim guidance |
| GET | `/api/public/runs/:runId` | Anonymous read-only run progress and latest screenshot metadata |
| GET | `/api/public/runs/:runId/stream` | Anonymous SSE stream for live scan progress |
| POST | `/api/scan` | Start full run (all phases) |
| POST | `/api/scan/stream` | SSE streaming with real-time events |
| GET | `/api/projects` | List projects for an entity (query: `entityId`) |
| GET | `/api/projects/:projectId` | Get project details with app |
| GET | `/api/projects/:projectId/runs` | List runs for a project's app |
| GET | `/api/runs/:runId` | Get run status, phase durations, summary stats |
| GET | `/api/runs/:runId/test-cases` | List test cases for a run (filter: `suiteTags`, `testType`, `personaId`) |
| GET | `/api/runs/:runId/test-runs` | List test runs for a run (filter: `status`, `screen`) |
| GET | `/api/runs/:runId/issues` | List issues for a run (filter: `type`) |
| GET | `/api/runs/:runId/ai-usage` | Get AI token usage for a run |
| GET | `/api/results/:token` | Resolve deep link, return full results |

**Anonymous scan request behavior**
- Input: `url`, optional `email`
- If `email` is present, validate that it matches the submitted site's registrable domain
- If no project exists for the normalized URL:
  - create unclaimed project + app
  - optionally store `contact_email`
  - create pending run
  - return `runId`, `projectId`, and stream URL
- If a project exists and `entity_id` is not null:
  - return `duplicate_owned` with guidance to contact the organization owner/admin
- If a project exists and `entity_id` is null:
  - return `duplicate_unclaimed` with guidance to sign up using an email on that domain to claim it

**SSE events (streaming):**

| Event | Data |
|-------|------|
| `session_created` | `{ runId }` |
| `page_discovered` | `{ url, name, phase, sizeClass }` |
| `page_state_created` | `{ pageId, stateId, trigger }` |
| `action_completed` | `{ type, selector, pageChanged }` |
| `issue_detected` | `{ type, description, actionId, pageUrl }` |
| `ai_analysis_complete` | `{ personas, useCases }` |
| `stats_update` | `{ pages, pageStates, actionsCompleted, actionsRemaining }` |
| `test_generated` | `{ name, type, persona }` |
| `test_run_started` | `{ testRunId, testCaseId, screen }` |
| `test_run_completed` | `{ testRunId, status, durationMs, issueCount }` |
| `run_complete` | `{ summary stats }` |
| `error` | `{ message }` |

---

# 14. Frontend

## 14.1 Multi-Project Architecture

The frontend spans multiple published packages following the existing `@sudobility` pattern:

| Package | Purpose | Consumed By |
|---------|---------|-------------|
| `testomniac_types` | Shared TypeScript types (Run, TestCase, Issue, Page, etc.) | All projects |
| `testomniac_client` | TanStack Query hooks wrapping API endpoints | testomniac_lib |
| `testomniac_lib` | Business logic layer (Zustand stores, React hooks) | testomniac_app, testomniac_app_rn |
| `testomniac_app` | React web frontend | End users |
| `testomniac_app_rn` | React Native mobile frontend (full parity) | End users |

**Existing History types, client hooks, lib stores, API routes, and UI pages will be deleted** and replaced with the new domain objects.

## 14.2 Pages (12 total)

All pages exist in both web and mobile with full parity.

### Home
- Public landing page
- Form: URL input, optional email
- Inline validation: if email is provided, it must match the submitted site's registrable domain
- Submit behavior:
  - if URL is new, create unclaimed project and start scan
  - if URL is already claimed by an entity, show claim/join guidance
  - if URL exists but is unclaimed, show claim guidance
- Redirect anonymous users to the public Scan Progress page when a new scan starts

### Dashboard
- Overview after selecting a project
- Latest run summary: status, phase durations, page/issue counts
- Quick actions: start new scan, view latest issues
- Charts: pass/fail trends over runs (if multiple runs exist)

### Start Scan
- Authenticated/organization-scoped scan form
- Form: URL input, app name (auto-derived from URL)
- SizeClass selection: desktop, mobile, or both
- Credentials (optional): email/username, password, 2FA code
- Plugin selection: checkboxes for SEO, Security, Content, UI Consistency
- Start button → creates pending run → navigates to Scan Progress

### Scan Progress
- Real-time updates via SSE (PostgreSQL LISTEN/NOTIFY → API → SSE → frontend)
- Phase indicator: shows current phase (mouse scanning → component detection → AI analysis → input scanning → auth scanning → plugins → test generation → test execution)
- Live counters: pages discovered, page states, actions completed/remaining, issues found
- Current screenshot panel: latest screenshot from the page currently being scanned
- Event log: scrolling list of events (page discovered, action completed, issue detected)
- Auto-transitions to Run Details when scan completes

### Public Scan Progress
- Available without login for anonymously started runs
- Same progress bar / phase indicator as Scan Progress
- Shows latest scanner screenshot and current page URL if available
- Read-only: no organization data, no admin controls, no credential editing
- If the run becomes associated with a claimed project later, redirect future access through normal authenticated flows

### Run Details
- Run metadata: status, SizeClass, start/end time, total duration
- Phase duration breakdown (bar chart or timeline)
- Summary cards: pages found, page states, test cases generated, test runs, issues
- AI token usage summary
- Plugins run and their issue counts
- Links to all sub-pages (Test Cases, Test Runs, Issues, Pages, Map, Components, Personas)

### Test Cases
- TanStack Table with columns: name, type, suite tags, priority, persona, page
- Filters: test type (render/interaction/form/navigation/e2e/password), suite tags, persona, priority
- Click row → expand to show JSON action sequence
- Bulk actions: run selected test cases

### Test Runs
- TanStack Table: test case name, screen resolution, status (pass/fail/running), duration, issue count
- Filters: status, screen, test type
- Click row → show execution details: error message, screenshot (on failure), console log, network log

### Issues
- TanStack Table: type, severity, description, page URL, source (scanning/test run/plugin)
- Filters: type, severity, plugin
- Click row → expand to show reproduction steps, console log, network log, screenshot
- Group by: page, type, plugin

### Pages
- Grid of discovered pages with thumbnail screenshots
- Each card shows: URL, route key, page state count, element count, requires login badge
- Click → page detail: all page states with screenshots, element list, forms, issues on this page

### Map
- React Flow flowchart visualization
- Nodes = Pages (labeled with page name, colored by priority)
- Edges = Actions that navigate between pages (labeled with action type)
- Click node → side panel opens showing:
  - Page states for this page (with screenshots)
  - All actions originating from this page (mouseover, click, fill, etc.)
  - All actions arriving at this page
  - Issues on this page
- Zoom, pan, minimap
- Layout: dagre auto-layout (top-to-bottom)

### Components
- List of detected reusable components (nav, footer, sidebar)
- Each shows: name, selector, instance count, identical count, variation count
- Expand → list of instances with page URLs, identical/variation badge
- Click canonical instance → screenshot + element list

### Personas
- Cards for each AI-generated persona: name, description
- Expand → list of use cases for this persona
- Each use case shows: name, description, generated input values per form field

## 14.3 SSE Real-Time Architecture

**Scanner service → PostgreSQL → API → Frontend:**

1. Scanner calls `NOTIFY run_events, '{"run_id":1,"event":"page_discovered","data":{...}}'` after each significant action
2. API's SSE endpoint establishes a `LISTEN run_events` connection to PostgreSQL
3. When notification arrives, API filters by `run_id` (from the SSE URL parameter) and sends matching events to the connected client
4. Frontend renders events in real-time (Scan Progress page)

**Event types:**

| Event | Data | Phase |
|-------|------|-------|
| `phase_changed` | `{ phase, runId }` | Any |
| `page_discovered` | `{ url, name, pageId }` | Mouse scanning |
| `page_state_created` | `{ pageId, stateId, trigger }` | Mouse scanning |
| `action_completed` | `{ type, selector, pageChanged, durationMs }` | Mouse scanning |
| `issue_detected` | `{ type, severity, description, pageUrl }` | Any |
| `component_detected` | `{ name, selector, instanceCount }` | Component detection |
| `ai_persona_created` | `{ name, description }` | AI analysis |
| `ai_use_case_created` | `{ personaName, name }` | AI analysis |
| `test_case_generated` | `{ name, type, persona }` | Test generation |
| `test_run_started` | `{ testRunId, testCaseName, screen }` | Test execution |
| `test_run_completed` | `{ testRunId, status, durationMs }` | Test execution |
| `plugin_started` | `{ pluginName }` | Plugins |
| `plugin_issue` | `{ pluginName, type, description }` | Plugins |
| `stats_update` | `{ pages, pageStates, actionsCompleted, actionsRemaining, issues }` | Any |
| `run_complete` | `{ status, totalDurationMs }` | Final |

**Mobile SSE:** React Native uses `react-native-sse` or a fetch-based SSE polyfill. Same event format.

## 14.4 Credential Handling in Frontend

Credentials entered on the Start Scan form are:
1. Sent to `testomniac_api` via HTTPS POST
2. API encrypts using AES-256-GCM with a server-side key (from env var `CREDENTIAL_ENCRYPTION_KEY`)
3. Stored in `scan_credentials` table (separate from `runs`)
4. Scanner decrypts when picking up the run
5. Credentials are deleted from DB after the scan completes (or after 24h TTL)
6. Frontend never stores credentials locally

Anonymous home-page submissions without credentials still create a project and run, but no `scan_credentials` row is created.

## 14.5 Admin View For Unclaimed Projects

Site admins can view all projects where `entity_id` is null.

Admin capabilities:
- list unclaimed projects
- inspect URL, contact email, latest run status, and creation time
- inspect anonymous scan progress/results
- manually assist with claim workflows if needed

---

# 15. Multi-Project Structure

## Scanner Service (`~/projects/testomniac_runner`)

```
src/
  browser/
    chromium.ts           # Launch, manage persistent profile
    page-utils.ts         # Wait helpers, hash computation, screenshot capture
  scanner/
    action-queue.ts       # Open action queue management
    mouse-scanner.ts      # Phase 1a: mouseover + click traversal
    input-scanner.ts      # Phase 1c: form filling + pairwise combinations
    extractor.ts          # page.evaluate() — actionable items, forms
    state-manager.ts      # Track current browser state, navigate to target state
    pairwise.ts           # Pairwise combination generator
    issue-detector.ts     # Detect dead clicks, page errors, console/network errors
    scroll-scanner.ts     # Scroll-to-bottom to discover lazy-loaded elements
    loop-guard.ts         # Action signature dedup, max limits per page state/run
    component-detector.ts # Detect reusable components (nav, footer, sidebar) across pages
    email-detector.ts     # Detect email hints before/after submission, create check_email actions
    email-checker.ts      # Execute check_email: poll Signic, extract OTP/link, act on content
  auth/
    credential-manager.ts # Store/retrieve credentials and Signic client
    password-detector.ts  # Detect password requirements, generate test cases
    form-identifier.ts    # Identify login vs sign-up forms
    login-executor.ts     # Fill login form, handle 2FA
    signic-registrar.ts   # Auto-register via Signic SDK
  ai/
    analyzer.ts           # Phase 1b orchestrator
    persona-generator.ts  # Generate personas from site content
    use-case-generator.ts # Generate use cases per persona
    input-generator.ts    # Generate input values per use case
    token-tracker.ts      # Record token usage per AI call
  generation/
    generator.ts          # Test case generation orchestrator
    render.ts             # Render test template
    interaction.ts        # Mouseover + click test template
    form.ts               # Form positive test template
    form-negative.ts      # Form negative test template
    password.ts           # Password requirement test template
    navigation.ts         # Navigation test template
    e2e.ts                # E2E path enumeration + template
    suite-tagger.ts       # Priority/suite tag assignment
  runner/
    executor.ts           # JSON action interpreter via Puppeteer
    worker-pool.ts        # Concurrent execution, creates Test Runs
    reporter.ts           # Aggregate results
  plugins/
    types.ts              # Plugin interface
    registry.ts           # Plugin registration and lookup
    seo/                  # SEO check plugin
    security/             # Security check plugin (including network traffic)
    content/              # Content check plugin (deterministic + AI)
    ui-consistency/       # UI consistency check plugin (cross-page styles)
  email/
    templates.ts          # HTML + plain text email
    sender.ts             # Postmark client
    deep-link.ts          # Token sign/verify
  db/                     # Shared schema + connection (same DB as API)
  config/                 # Env config + constants
  orchestrator.ts         # Wire all phases, poll for pending runs
Dockerfile               # Container image for scanner deployment
.dockerignore            # Docker build exclusions
```

The scanner project must include a Docker container definition compatible with deployment via `~/projects/sudobility_dockerized`.

## API (testomniac_api — existing Hono project)

```
src/
  index.ts                # Hono app setup, middleware, route registration
  db/
    schema.ts             # Drizzle schema (shared with scanner)
    connection.ts         # DB pool
  routes/
    scan.ts               # POST /api/v1/entities/:entitySlug/scans (create pending run)
    scan-stream.ts        # GET /api/v1/runs/:runId/stream (SSE via LISTEN/NOTIFY)
    projects.ts           # CRUD for projects
    runs.ts               # GET runs, test-cases, test-runs, issues, ai-usage
    results.ts            # GET /api/v1/results/:token (deep link)
  services/
    credential-service.ts # Encrypt/decrypt scan credentials (AES-256-GCM)
    sse-service.ts        # PostgreSQL LISTEN/NOTIFY → SSE stream
  middleware/
    firebase-auth.ts      # Existing Firebase auth middleware
    entity-context.ts     # Existing entity context middleware
```

## Types (testomniac_types)

```
src/
  index.ts                # Re-exports all types
  models/
    run.ts                # Run, RunPhase, RunStatus
    page.ts               # Page, PageState, PageHashes
    action.ts             # Action, ActionType, ActionStatus
    test-case.ts          # TestCase, TestAction, TestType
    test-run.ts           # TestRun, TestRunStatus
    issue.ts              # Issue, IssueType, IssueSeverity
    persona.ts            # Persona, UseCase, InputValue
    component.ts          # Component, ComponentInstance
    project.ts            # Project
    scan-request.ts       # ScanRequest, ScanCredentials
    plugin.ts             # PluginIssue, PluginResult
    enums.ts              # SizeClass, Screen, shared enums
  responses/
    index.ts              # API response wrappers (successResponse, errorResponse)
```

`testomniac_types` is the source of truth for shared contracts used by:
- `testomniac_api`
- `testomniac_runner`
- `testomniac_client`

## Client (testomniac_client)

```
src/
  index.ts                # Re-exports all hooks and client
  client.ts               # TestomniacClient class (HTTP methods)
  hooks/
    useProjects.ts        # CRUD hooks for projects
    useRuns.ts            # List/get runs
    useRunStream.ts       # SSE hook for real-time scan progress
    useTestCases.ts       # List test cases with filters
    useTestRuns.ts        # List test runs with filters
    useIssues.ts          # List issues with filters
    usePages.ts           # List pages and page states
    useMap.ts             # Page graph data for React Flow
    useComponents.ts      # List components and instances
    usePersonas.ts        # List personas and use cases
    useAiUsage.ts         # AI token usage
    useScanActions.ts     # Start scan, cancel scan mutations
  utils/
    headers.ts            # Auth header helpers
    sse.ts                # SSE connection helper (web + RN compatible)
```

## Lib (testomniac_lib)

```
src/
  index.ts                # Re-exports all hooks and stores
  stores/
    scanStore.ts          # Active scan state (Zustand)
    runsStore.ts          # Cached runs data
    mapStore.ts           # Map view state (selected node, panel open)
  hooks/
    useScanManager.ts     # Orchestrates start scan → SSE → results
    useRunDetails.ts      # Aggregates run data from multiple hooks
    useMapData.ts         # Transforms page/action data into React Flow nodes/edges
    useIssueFilters.ts    # Filter/group/sort logic for issues
    useTestCaseFilters.ts # Filter logic for test cases
```

## Web App (testomniac_app)

```
src/
  pages/
    DashboardPage.tsx     # Project overview with latest run summary
    StartScanPage.tsx     # Scan configuration form
    ScanProgressPage.tsx  # Real-time SSE scan progress
    RunDetailsPage.tsx    # Run summary with phase durations
    TestCasesPage.tsx     # TanStack Table of test cases
    TestRunsPage.tsx      # TanStack Table of test runs
    IssuesPage.tsx        # TanStack Table of issues
    PagesPage.tsx         # Grid of discovered pages with screenshots
    MapPage.tsx           # React Flow site map with side panel
    ComponentsPage.tsx    # Reusable component list
    PersonasPage.tsx      # AI-generated personas and use cases
  components/
    scan/
      ScanForm.tsx        # URL, credentials, SizeClass, plugin selection
      ScanProgress.tsx    # Phase indicator, live counters, event log
    map/
      SiteMap.tsx         # React Flow canvas with dagre layout
      MapSidePanel.tsx    # Page detail panel (states, actions, issues)
      PageNode.tsx        # Custom React Flow node for pages
      ActionEdge.tsx      # Custom React Flow edge for actions
    tables/
      TestCaseTable.tsx   # TanStack Table configured for test cases
      TestRunTable.tsx    # TanStack Table for test runs
      IssueTable.tsx      # TanStack Table for issues
    detail/
      RunSummaryCards.tsx  # Summary stat cards for run details
      PhaseDurations.tsx   # Phase duration chart/timeline
      PageStateViewer.tsx  # Screenshot + element list for a page state
      ActionChain.tsx      # Reproduction steps visualization
```

## React Native App (testomniac_app_rn)

```
src/
  screens/
    DashboardScreen.tsx
    StartScanScreen.tsx
    ScanProgressScreen.tsx
    RunDetailsScreen.tsx
    TestCasesScreen.tsx
    TestRunsScreen.tsx
    IssuesScreen.tsx
    PagesScreen.tsx
    MapScreen.tsx          # Simplified flowchart (react-native-graph or SVG-based)
    ComponentsScreen.tsx
    PersonasScreen.tsx
  components/
    scan/                  # RN equivalents of web scan components
    map/                   # RN map visualization
    tables/                # FlatList-based equivalents of TanStack Tables
    detail/                # RN detail viewers
  navigation/
    AppNavigator.tsx       # Tab + stack navigation
    DashboardStack.tsx     # Dashboard → Run Details → sub-pages
    ScanStack.tsx          # Start Scan → Scan Progress
```

---

# 16. Implementation Phases

## 16.1 Development Workflow Requirements

These instructions apply during implementation of any phase:

1. Whenever a library project is modified and is ready to be consumed by an upper-level library or app, run `/testomniac_app/scripts/push_all.sh`.
   - This deploys the lower-level package and updates dependencies in upper libraries and the app.
2. After each implementation phase, verify that `bun run dev` works with no errors in both:
   - `/testomniac_api`
   - `/testomniac_app`

Phase completion is not considered done until both verification checks pass.

## Phase 1: Browser + Mouse-Only Scanning
- Chromium manager with persistent profile
- Action queue system
- Mouse scanner (navigate, mouseover, click loop)
- Element extractor
- Page state hash computation
- State manager (track current state, navigate to target)
- DB schema + migrations
- Repositories for pages, page states, actionable items, actions

## Phase 2: AI Analysis + Input Scanning
- OpenAI integration for persona/use case generation
- Input value generation per persona + use case
- Input scanner (form filling with AI-generated values)
- Pairwise combination generator for discrete controls
- Login detection (redirect + 401/403)
- Login-required scanning flow

## Phase 3: Test Generation
- Render, interaction, form, navigation, E2E template generators
- DFS path enumeration for E2E
- Suite tag / priority assignment
- Per-persona test case generation
- SizeClass tagging
- test_cases persistence

## Phase 4: Test Execution + Reporting
- JSON action sequence runner
- Worker pool for concurrency (creates Test Runs)
- Per-Screen resolution execution
- test_runs persistence with issue detection
- Email templates + Postmark delivery
- Deep link token generation/verification

## Phase 5: API + Streaming
- Fastify server with CORS
- Scan endpoints (sync + SSE streaming)
- Results/deep link endpoints
- Run orchestration (all phases wired together)
- SizeClass scan orchestration (desktop + mobile)

## Phase 6: Plugins + Components
- Plugin architecture (types, registry, orchestrator integration)
- SEO Check plugin
- Security Check plugin (including network traffic API key detection)
- Content Check plugin (deterministic + AI)
- UI Consistency Check plugin (cross-page style comparison)
- Reusable component detection

## Phase 7: Types + Client + Lib (Frontend Shared Packages)
- Delete existing History types/hooks/stores
- Define new shared types in testomniac_types (Run, Page, Action, TestCase, Issue, API contracts, scan requests/responses, SSE events, etc.)
- Implement API client hooks in testomniac_client (TanStack Query)
- Implement SSE hook for real-time scan progress
- Implement business logic hooks/stores in testomniac_lib (Zustand)

## Phase 8: API Routes (testomniac_api)
- Delete existing History routes
- Add scan routes (create pending run, SSE stream via LISTEN/NOTIFY)
- Add project/run/test-case/test-run/issue/ai-usage CRUD routes
- Add credential encryption service
- Add SSE service (PostgreSQL LISTEN → SSE)
- Add deep link results route

## Phase 9: Web Frontend (testomniac_app)
- Delete existing History pages
- Dashboard, Start Scan, Scan Progress pages
- Run Details, Test Cases, Test Runs, Issues pages (TanStack Table)
- Pages page (screenshot grid)
- Map page (React Flow with side panel)
- Components page, Personas page

## Phase 10: Mobile Frontend (testomniac_app_rn)
- Delete existing History screens
- All screens matching web frontend (full parity)
- SSE via react-native-sse polyfill
- Simplified map visualization for mobile

---

# 17. Plugin Architecture

Add-on checks run as opt-in plugins. The user specifies which plugins to enable when starting a scan (e.g., `plugins: ["seo", "security"]`). Plugins execute after scanning completes (after Phase 2) and before test generation (Phase 3). Each plugin analyzes the discovered pages and page states and produces issues.

## Plugin Interface

```ts
interface Plugin {
  name: string;                    // e.g., "seo", "security"
  description: string;
  // Called once after scanning, receives all discovered data
  analyze(context: PluginContext): Promise<PluginResult>;
}

interface PluginContext {
  appId: number;
  runId: number;
  baseUrl: string;
  pages: Page[];                   // all discovered pages
  pageStates: PageState[];         // all states with HTML content
  networkLogs: NetworkLogEntry[];  // all captured network traffic
  forms: FormInfo[];               // all discovered forms
  db: DrizzleDb;                   // for persisting results
  openai?: OpenAI;                 // available if AI is needed
  browser: Page;                   // Puppeteer page for live checks
}

interface PluginResult {
  issues: PluginIssue[];
  metadata?: Record<string, unknown>;  // plugin-specific data stored on run
}

interface PluginIssue {
  type: string;                    // e.g., "seo_missing_title", "security_missing_csp"
  severity: 'error' | 'warning' | 'info';
  description: string;
  pageUrl: string;
  details?: Record<string, unknown>;
}
```

## Plugin Registration

```ts
// src/plugins/registry.ts
const PLUGINS: Record<string, Plugin> = {};

export function registerPlugin(plugin: Plugin): void {
  PLUGINS[plugin.name] = plugin;
}

export function getPlugin(name: string): Plugin | undefined {
  return PLUGINS[name];
}

export function getEnabledPlugins(names: string[]): Plugin[] {
  return names.map((n) => PLUGINS[n]).filter(Boolean);
}
```

Plugins self-register on import:
```ts
// src/plugins/seo/index.ts
import { registerPlugin } from '../registry.js';
registerPlugin({ name: 'seo', description: '...', analyze: ... });
```

## Plugin Execution in Orchestrator

After Phase 2 (scanning) and before Phase 3 (test generation):
```
Phase 1a-1d: Scanning
Phase 2: Auth scanning
→ Plugin phase: run each enabled plugin's analyze()
  → Issues stored in issues table with plugin name as type prefix
Phase 3: Test generation
Phase 4: Test execution
```

## Plugin Issue Storage

Plugin issues are stored in the same `issues` table with the `type` field prefixed by the plugin name (e.g., `seo_missing_title`, `security_api_key_in_url`). The `plugin` column is added to distinguish plugin issues from scanner issues:

```sql
-- Add to issues table
alter table issues add column plugin text;  -- null for scanner issues, plugin name for plugin issues
alter table issues add column severity text default 'error';  -- error | warning | info
```

---

# 18. Add-On Plugins

## 16.1 SEO Check Plugin

Analyzes each page's HTML for SEO best practices. Mostly deterministic; AI used only for content quality scoring.

| Check | Method | AI? | Severity |
|-------|--------|-----|----------|
| Missing `<title>` | Parse HTML | No | error |
| Duplicate `<title>` across pages | Compare titles | No | warning |
| Title too long (>60 chars) or too short (<10 chars) | String length | No | warning |
| Missing `<meta description>` | Parse HTML | No | error |
| Description too long (>160 chars) | String length | No | warning |
| Missing or multiple `<h1>` | Parse HTML | No | error |
| H1 doesn't match `<title>` | String comparison | No | warning |
| Missing `alt` on `<img>` | Parse HTML | No | warning |
| Missing canonical URL (`<link rel="canonical">`) | Parse HTML | No | warning |
| Missing Open Graph tags (og:title, og:description, og:image) | Parse HTML | No | warning |
| Missing structured data (JSON-LD / Schema.org) | Parse HTML | No | info |
| `robots.txt` not accessible | HTTP fetch `{baseUrl}/robots.txt` | No | warning |
| `sitemap.xml` not accessible | HTTP fetch `{baseUrl}/sitemap.xml` | No | warning |
| Broken internal links | Cross-reference discovered pages with `<a>` hrefs | No | error |
| Slow page load (TTFB > 800ms) | Puppeteer Performance API | No | warning |
| Missing viewport meta tag | Parse HTML | No | error |
| Content quality score | **AI** — summarize page, score readability and keyword relevance | Yes | info |

## 16.2 Security Check Plugin

Checks HTTP headers, HTML content, network traffic, and cookies for security issues.

| Check | Method | AI? | Severity |
|-------|--------|-----|----------|
| Missing HTTPS | Check page URL scheme | No | error |
| Missing `Content-Security-Policy` header | HTTP response headers | No | warning |
| Missing `Strict-Transport-Security` header | HTTP response headers | No | warning |
| Missing `X-Frame-Options` header | HTTP response headers | No | warning |
| Missing `X-Content-Type-Options` header | HTTP response headers | No | warning |
| Missing `Referrer-Policy` header | HTTP response headers | No | info |
| Mixed content (HTTP resources on HTTPS page) | Scan HTML for `http://` in src/href attributes | No | error |
| Forms without CSRF tokens | Check form hidden fields for `csrf`/`_token`/`authenticity_token` | No | warning |
| Forms submitting over HTTP | Check form `action` attribute starts with `http://` | No | error |
| Cookies without `Secure` flag | Read cookies via `page.cookies()` | No | warning |
| Cookies without `HttpOnly` flag | Read cookies via `page.cookies()` | No | warning |
| Cookies without `SameSite` flag | Read cookies via `page.cookies()` | No | info |
| **API keys in network URLs** | Scan all captured network request URLs for patterns: `api_key=`, `apikey=`, `key=`, `token=`, `secret=`, `password=`, `Authorization` in query strings | No | error |
| **API keys in request headers** | Scan network request headers for `Authorization: Bearer` tokens, API keys sent as custom headers | No | error |
| **Sensitive data in network responses** | Scan response bodies for patterns matching API keys, tokens, passwords, private keys (regex: `/[A-Za-z0-9_-]{32,}/`, known key prefixes like `sk_live_`, `pk_test_`, `AKIA`) | No | error |
| Exposed sensitive info in HTML source | Regex scan for API keys, tokens, passwords in HTML comments and inline scripts | No | error |
| Open redirect potential | Check if any redirect URLs accept user-controlled input | No | warning |
| SQL injection/XSS vectors | **AI** — analyze form fields, suggest attack patterns to test | Yes | info |

**Network traffic analysis** runs against all `NetworkLogEntry` records captured during scanning. For each request:
1. Parse URL query parameters — flag any parameter name matching sensitive patterns
2. Parse request headers — flag `Authorization`, `X-Api-Key`, custom token headers sent to third-party domains
3. For same-domain API responses: check if response body contains key-like strings that shouldn't be exposed to the browser

## 16.3 Content Check Plugin

Analyzes visible text content across all pages. Mix of deterministic and AI-powered checks.

| Check | Method | AI? | Severity |
|-------|--------|-----|----------|
| Placeholder content ("Lorem ipsum", "TODO", "Coming soon", "TBD") | Regex pattern matching on visible text | No | error |
| Broken external links | HTTP HEAD request to each external href | No | warning |
| Readability score (Flesch-Kincaid) | Deterministic formula on visible text (syllables, words, sentences) | No | info |
| Copyright year outdated | Regex for `© 20XX` in footer, compare to current year | No | warning |
| Empty pages (no meaningful content) | Check if visible text < 50 chars | No | error |
| Spelling errors | **AI** — check visible text for misspellings | Yes | warning |
| Grammar issues | **AI** — check text for grammar problems | Yes | info |
| Inconsistent terminology | **AI** — compare terms across all pages (e.g., "Sign In" vs "Log In", "Cart" vs "Basket") | Yes | warning |
| Inappropriate/offensive content | **AI** — content moderation scan | Yes | error |
| Alt text quality (meaningful, not just "image" or "photo") | **AI** — evaluate whether alt text describes the image purpose | Yes | info |

## 16.4 UI Consistency Check Plugin

Compares visual styles **across all pages** to ensure consistent design language.

**Cross-page style extraction:** For each page state, extract computed styles for key element categories via `page.evaluate()`:

```ts
// Elements to check for consistency across pages
const STYLE_TARGETS = {
  headings: { selectors: ['h1', 'h2', 'h3'], props: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'lineHeight'] },
  bodyText: { selectors: ['p', 'li', 'span'], props: ['fontFamily', 'fontSize', 'color', 'lineHeight'] },
  buttons: { selectors: ['button', '[role="button"]', 'input[type="submit"]'], props: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderRadius', 'padding', 'height'] },
  links: { selectors: ['a'], props: ['fontFamily', 'fontSize', 'color', 'textDecoration'] },
  inputs: { selectors: ['input[type="text"]', 'input[type="email"]', 'textarea'], props: ['fontFamily', 'fontSize', 'borderColor', 'borderRadius', 'padding', 'height'] },
};
```

**Consistency checks (all deterministic):**

| Check | Method | AI? | Severity |
|-------|--------|-----|----------|
| **Heading font inconsistency** | Compare `h1` fontFamily/fontSize across all pages. Flag if >1 distinct style | No | warning |
| **Body text font inconsistency** | Compare `p` fontFamily/fontSize across pages | No | warning |
| **Button style inconsistency** | Compare button backgroundColor/borderRadius/fontSize/padding across pages. Flag if >2 distinct button styles | No | warning |
| **Button size inconsistency** | Compare button height/padding across pages | No | warning |
| **Link color inconsistency** | Compare `a` color across pages | No | warning |
| **Input field style inconsistency** | Compare input border/padding/fontSize across pages | No | warning |
| **Color palette outliers** | Extract all used colors, build a palette, flag colors used on only 1 page | No | info |
| **Inconsistent spacing** | Compare padding/margin on similar containers across pages | No | info |
| Text overflow / truncation | Check if `scrollWidth > clientWidth` on text elements | No | warning |
| Missing focus styles | Tab through interactive elements, check if `:focus` changes outline/border | No | warning |
| Overlapping elements | Check bounding box intersections between visible elements | No | error |
| **Visual regression desktop vs. mobile** | **AI** — compare desktop and mobile screenshots of same page for layout breaks | Yes | warning |

**Cross-page comparison algorithm:**
1. For each style target category (headings, buttons, etc.), collect computed styles from every page state
2. Group by the computed style values → identify the "majority style" (most pages agree)
3. Flag pages that deviate from the majority style, listing the specific property that differs
4. Example output: "Button on /checkout uses backgroundColor #FF0000, but 8/10 pages use #2563EB"

---

# 19. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Action-driven scanning | Exhaustive: every element gets mouseover then click. Discovers all states deterministically |
| Mouse-first, then inputs | Discover all pages/states before filling forms. AI needs full site context to generate good personas |
| AI for personas + input values, not navigation | AI understands meaning; code handles exhaustive traversal |
| Pairwise testing for controls | Covers all 2-way interactions without combinatorial explosion |
| Separate test cases per Persona | Same form tested with different user contexts produces different behavior |
| Scan per SizeClass | Desktop and mobile may have different elements, layouts, and navigation |
| Test across Screen resolutions | Within a SizeClass, test cases run at multiple common viewport sizes |
| Login detection via redirect + HTTP status | Covers both server-rendered (redirect) and API-driven (401/403) auth patterns |
| Puppeteer over Playwright | Node.js native, lighter, direct CDP control |
| Local Chromium over cloud browser | Simpler, free, no vendor dependency |
| Template-based test generation | Deterministic, fast, cheap — AI adds no value for code generation |
| JSON action sequences over generated code | Portable, easy to validate, no string-based code generation |
| Normalized DB over JSONB blobs | Queryable, indexable, proper foreign keys |
| Single Node.js runtime | One language, one deployment, one toolchain |
| Persistent browser profile | Session reuse, manual login bootstrap |
| Plugin architecture for add-ons | SEO, security, content, UI consistency checks run as opt-in plugins after scanning |
| Project → Entity integration | Projects may start unclaimed, then later be claimed by an entity, enabling both anonymous intake and multi-tenant organization support |
| Three-level time tracking | Wall-clock (total run), per-phase, and per-action durations for full observability |
| Test Run per execution | Each Test Case × Screen creates a Test Run record, enabling per-execution issue tracking |
| AI token tracking | Every OpenAI call records prompt/completion tokens for cost visibility |
| Hono over Fastify | Existing testomniac_api uses Hono — no migration needed |
| Separate scanner service | Scanner polls DB for pending runs. Decoupled from API. Independent scaling |
| PostgreSQL LISTEN/NOTIFY for SSE | No Redis needed. Built-in pub/sub for real-time scan progress |
| Encrypted credentials | AES-256-GCM in separate table, deleted after scan completes |
| React Flow for Map | Flowchart-style site map with dagre auto-layout, side panel for page detail |
| TanStack Table for lists | Test Cases, Test Runs, Issues need filtering/sorting/pagination |
| Full mobile parity | All 11 pages available on both web and React Native |
| SSE on both platforms | Web uses native EventSource, React Native uses polyfill |
