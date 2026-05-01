# Data Models

## Core Domain

### User

A Firebase-authenticated user.

| Field        | Type     | Description                              |
|--------------|----------|------------------------------------------|
| firebaseUid  | string   | Primary key (Firebase UID)               |
| email        | string?  | User email                               |
| displayName  | string?  | Display name                             |
| createdAt    | string?  | Creation timestamp                       |
| updatedAt    | string?  | Last update timestamp                    |

### Project

A project owned by an entity, containing one or more apps.

| Field           | Type     | Description                              |
|-----------------|----------|------------------------------------------|
| id              | number   | Primary key                              |
| entityId        | string   | Parent entity                            |
| title           | string   | Project title                            |
| description     | string?  | Project description                      |
| contactEmail    | string?  | Contact email                            |
| claimedByUserId | string?  | User who claimed this project            |
| claimedAt       | string?  | When the project was claimed             |
| createdAt       | string?  | Creation timestamp                       |
| updatedAt       | string?  | Last update timestamp                    |

### App

A website or web application to be tested.

| Field            | Type     | Description                              |
|------------------|----------|------------------------------------------|
| id               | number   | Primary key                              |
| projectId        | number   | Parent project                           |
| title            | string   | App title                                |
| baseUrl          | string   | Base URL (e.g., `https://example.com`)   |
| normalizedBaseUrl| string   | Normalized base URL for dedup            |
| createdAt        | string?  | Creation timestamp                       |

---

## Page Domain

### Page

A unique path discovered within an app.

| Field          | Type     | Description                              |
|----------------|----------|------------------------------------------|
| id             | number   | Primary key                              |
| appId          | number   | Parent app                               |
| relativePath   | string   | Path relative to app's base URL (e.g., `/products/123`) |
| routeKey       | string?  | Normalized path for grouping (e.g., `/products/:id`) |
| requiresLogin  | boolean? | Whether this page requires authentication |
| createdAt      | string?  | Creation timestamp                       |

### Page State

A single captured rendering of a page. The same page can have multiple states (e.g., different content, different viewport sizes). Uses multiple hashes for deduplication and change detection.

| Field                  | Type     | Description                              |
|------------------------|----------|------------------------------------------|
| id                     | number   | Primary key                              |
| pageId                 | number   | Parent page                              |
| sizeClass              | string   | desktop or mobile                        |
| *— Full page hashes —*|          |                                          |
| htmlHash               | string?  | SHA-256 of raw HTML — detects any change |
| normalizedHtmlHash     | string?  | SHA-256 of normalized HTML — ignores CSS/attribute variations |
| textHash               | string?  | SHA-256 of visible text only — detects content changes |
| actionableHash         | string?  | SHA-256 of sorted interactive elements — detects UI control changes |
| *— Decomposed hashes (component-aware) —* | | |
| fixedBodyHash          | string?  | SHA-256 of body minus reusable regions and patterns |
| reusableElementsHash   | string?  | SHA-256 of header/footer/nav components  |
| patternsHash           | string?  | SHA-256 of UI patterns (cards, modals, tables, etc.) |
| *— HTML content —*     |          |                                          |
| bodyHtmlElementId      | number?  | Full body HTML element record            |
| contentHtmlElementId   | number?  | Content body HTML element record         |
| fixedBodyHtmlElementId | number?  | Stripped body HTML element record (minus components and patterns) |
| rawHtmlPath            | string?  | Path to stored raw HTML file             |
| contentText            | string?  | Extracted visible text                   |
| *— Metadata —*         |          |                                          |
| screenshotPath         | string?  | Path to captured screenshot              |
| createdByTestRunId     | number?  | Test run that created this state         |
| capturedAt             | string?  | When this state was captured             |

---

## Component Domain

### HTML Element

A stored chunk of HTML markup, content-addressed by hash.

| Field     | Type     | Description                              |
|-----------|----------|------------------------------------------|
| id        | number   | Primary key                              |
| html      | string   | Full HTML markup                         |
| hash      | string   | SHA-256 of the HTML content              |
| createdAt | string?  | Creation timestamp                       |

### Reusable HTML Element

An app-level canonical component (e.g., a site header, footer, sidebar). Deduplicated by type + hash — the same component appearing on many pages is stored once.

| Field         | Type     | Description                              |
|---------------|----------|------------------------------------------|
| id            | number   | Primary key                              |
| appId         | number   | Parent app                               |
| type          | string   | Component type (see values below)        |
| htmlElementId | number   | References the HTML Element record       |
| htmlHash      | string?  | Hash of the component's HTML             |
| createdAt     | string?  | Creation timestamp                       |

**Component types:** topMenu, footer, breadcrumb, leftMenu, hamburgerMenu, rightSidebar, searchBar, userMenu, cookieBanner, chatWidget, socialLinks, skipNav, languageSwitcher, announcementBar, backToTop

### Actionable Item

An interactive UI element discovered on a page state (button, link, input, select, etc.).

| Field                | Type     | Description                              |
|----------------------|----------|------------------------------------------|
| id                   | number   | Primary key                              |
| htmlElementId        | number   | The HTML element record                  |
| stableKey            | string   | Persistent element ID across scans       |
| selector             | string   | CSS selector                             |
| tagName              | string   | HTML tag name                            |
| role                 | string?  | ARIA role (button, link, textbox, etc.)  |
| actionKind           | string   | click, fill, select, navigate, or radio_select |
| accessibleName       | string?  | ARIA label or accessible name            |
| disabled             | boolean  | Whether the element is disabled          |
| visible              | boolean  | Whether the element is in the viewport   |
| attributesJson       | json     | All HTML attributes                      |
| reusableHtmlElementId| number?  | If part of a reusable component          |
| elementIdentityId    | number?  | Linked element identity                  |

### Element Identity

App-level persistent record of a UI element, tracked across scans. Used to generate stable Playwright locators.

| Field                | Type     | Description                              |
|----------------------|----------|------------------------------------------|
| id                   | number   | Primary key                              |
| appId                | number   | Parent app                               |
| role                 | string   | ARIA role                                |
| computedName         | string?  | Accessible name                          |
| tagName              | string   | HTML tag name                            |
| labelText            | string?  | Form label text                          |
| groupName            | string?  | Fieldset/group context                   |
| placeholder          | string?  | Placeholder text                         |
| altText              | string?  | Image alt text                           |
| testId               | string?  | data-testid attribute                    |
| inputType            | string?  | HTML input type                          |
| nthInGroup           | number?  | Position among similar elements          |
| formContext          | string?  | Parent form name                         |
| headingContext       | string?  | Nearby heading text                      |
| landmarkAncestor     | string?  | Parent landmark (nav, main, etc.)        |
| playwrightLocator    | string   | Playwright locator string                |
| playwrightScopeChain | string?  | Nested scope path                        |
| isUniqueOnPage       | boolean  | Whether this element is unique on the page |
| cssSelector          | string   | Fallback CSS selector                    |
| locators             | json     | Array of locator strategies (test-id, role-name, label, placeholder, text, alt-text, css) |
| firstSeenScanId      | number   | First scan this element was seen in      |
| lastSeenScanId       | number   | Most recent scan this element was seen in |
| timesSeen            | number   | Number of scans this element appeared in |
| createdAt            | string?  | Creation timestamp                       |
| updatedAt            | string?  | Last update timestamp                    |

### Form

A form extracted from a page state.

| Field          | Type     | Description                              |
|----------------|----------|------------------------------------------|
| id             | number   | Primary key                              |
| pageStateId    | number   | Parent page state                        |
| selector       | string   | CSS selector of the form element         |
| action         | string?  | Form action URL                          |
| method         | string?  | GET or POST                              |
| submitSelector | string?  | CSS selector of the submit button        |
| fieldCount     | number   | Number of fields in the form             |
| formType       | string?  | Categorization of form purpose           |
| fieldsJson     | json     | Array of form fields (name, type, label, required, options) |
| createdAt      | string?  | Creation timestamp                       |

### Page State Reusable Element

Junction linking which reusable components appear on which page states.

| Field                | Type   | Description                    |
|----------------------|--------|--------------------------------|
| id                   | number | Primary key                    |
| pageStateId          | number | The page state                 |
| reusableHtmlElementId| number | The reusable component         |

### Page State Pattern

A detected UI pattern instance on a page state. Unlike reusable elements (which are unique components), patterns are repeating structures like cards, tables, or modals.

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| id          | number   | Primary key                              |
| pageStateId | number   | The page state where this pattern appears |
| patternType | string   | Pattern type (see values below)          |
| selector    | string   | CSS selector for the pattern             |
| count       | number   | Number of instances on the page          |
| createdAt   | string?  | Creation timestamp                       |

**Pattern types:** card, table, form, modal, toast, alert, tabs, accordion, carousel, dropdown, pagination, skeleton, emptyState, errorMessage, progressBar, tooltip, badge, avatar, tag, stepper

---

## Scan Domain

### Scan

A scan has two interleaved phases that run in a loop:

1. **Generate** — AI Decomposition Jobs decompose page states into pieces and create test suites (with dedup) containing test cases.
2. **Run** — Test cases are executed. If a test case produces a target page state that differs from any previously seen page state, a new AI Decomposition Job is created for it, feeding back into phase 1.

This loop continues until no new page states are discovered.

`createdByUserId` is always set to the user who initiated the scan. `ownedByUserId` is set only when the scan is initiated from the web extension (meaning the user's browser runs it). When `ownedByUserId` is null, the server-side scanner (`testomniac_runner`) picks up and executes the scan.

| Field                     | Type     | Description                              |
|---------------------------|----------|------------------------------------------|
| id                        | number   | Primary key                              |
| appId                     | number   | Parent app                               |
| scanUrl                   | string   | URL to scan (may differ from app's baseUrl) |
| createdByUserId           | string   | User who initiated the scan              |
| ownedByUserId             | string?  | User who owns/runs the scan (set when initiated from web extension; null for server-side execution) |
| status                    | string   | pending, running, completed, failed      |
| sizeClass                 | string   | desktop or mobile                        |
| pagesFound                | number?  | Number of unique pages discovered        |
| pageStatesFound           | number?  | Number of page state captures            |
| testRunsCompleted         | number?  | Number of test runs completed            |
| aiSummary                 | string?  | AI-generated summary of the scan         |
| totalDurationMs           | number?  | Total scan duration                      |
| createdAt                 | string   | Creation timestamp (status set to pending) |
| startedAt                 | string?  | When execution started                   |
| endedAt                   | string?  | When execution ended                     |

**Scan loop:**
```
Scan starts with initial page state
  │
  ▼
┌─────────────────────────────────────────────────┐
│ Phase 1: GENERATE                               │
│   AI Decomposition Job (per new page state)     │
│     → Decompose into pieces (reusable + body)   │
│     → Create/dedup Test Suites                  │
│     → Create Test Cases within suites           │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│ Phase 2: RUN                                    │
│   Create Test Runs for test cases               │
│     → Execute test cases                        │
│     → If target page state is NEW               │
│         → Create new AI Decomposition Job ──┐   │
└─────────────────────────────────────────────┼───┘
                                              │
                       loops back to Phase 1 ◄┘
                       
Until no new page states are discovered → Scan complete
```

### AI Decomposition Job

Created by a scan for each page state that needs decomposition. Takes the page state, breaks it into pieces (reusable elements and main body), and creates test suites for each piece. New jobs can be created during test execution when previously unseen page states are encountered.

| Field        | Type     | Description                              |
|--------------|----------|------------------------------------------|
| id           | number   | Primary key                              |
| scanId       | number   | Parent scan                              |
| pageStateId  | number   | The page state to decompose              |
| personaId    | number?  | Persona context for test generation      |
| status       | string   | Pending or Done                          |
| createdAt    | string?  | Creation timestamp                       |
| completedAt  | string?  | When decomposition finished              |

### Credential

Stored login credentials for an app (used during scanning).

| Field         | Type     | Description                              |
|---------------|----------|------------------------------------------|
| id            | number   | Primary key                              |
| appId         | number   | Parent app                               |
| username      | string?  | Login username                           |
| email         | string?  | Login email                              |
| password      | string   | Login password                           |
| twoFactorCode | string?  | 2FA code                                 |
| createdAt     | string?  | Creation timestamp                       |

---

## Persona Domain

### Persona

An AI-generated user archetype for a website.

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| id          | number   | Primary key                              |
| appId       | number   | Parent app                               |
| title       | string   | Persona title (e.g., "New Customer")     |
| description | string?  | User profile description                 |
| createdAt   | string?  | Creation timestamp                       |

### Use Case

A task or goal for a persona.

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| id          | number   | Primary key                              |
| personaId   | number   | Parent persona                           |
| title       | string   | Use case title (e.g., "Browse Products") |
| description | string?  | Task description                         |
| createdAt   | string?  | Creation timestamp                       |

### Input Value

A test data value mapped to a form field for a use case.

| Field         | Type     | Description                              |
|---------------|----------|------------------------------------------|
| id            | number   | Primary key                              |
| useCaseId     | number   | Parent use case                          |
| fieldSelector | string   | CSS selector of the target form field    |
| fieldName     | string?  | Human-readable field name                |
| value         | string   | Test data value (email, name, etc.)      |
| createdAt     | string?  | Creation timestamp                       |

---

## Operational Domain

### Report Email

An email report sent for a scan.

| Field         | Type     | Description                              |
|---------------|----------|------------------------------------------|
| id            | number   | Primary key                              |
| scanId        | number   | Parent scan                              |
| userEmail     | string   | Recipient email                          |
| deepLinkToken | string   | Unique token for deep link access        |
| sentAt        | string?  | When the email was sent                  |

---

## Expertise Domain

### Expertise

A verification ruleset applied to page states during test runs. All expertises run against all test runs globally. At each test run, the target page state is sent to every expertise's rules for verification. Rules can be deterministic code or AI-powered (calling an external AI endpoint).

*Future: users will have subscriptions that enable specific expertises.*

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| id          | number   | Primary key                              |
| slug        | string   | Unique identifier for code lookup (e.g., `accessibility`, `performance`) |
| title       | string   | Expertise title                          |
| description | string   | What this expertise verifies             |
| createdAt   | string?  | Creation timestamp                       |

### Expertise Rule

A single verification rule within an expertise. May be deterministic (code-based) or AI-powered (calls an AI endpoint).

| Field          | Type     | Description                              |
|----------------|----------|------------------------------------------|
| id             | number   | Primary key                              |
| expertiseId    | number   | Parent expertise                         |
| title          | string   | Rule title                               |
| description    | string   | What this rule checks                    |
| aiEndpointUrl  | string?  | AI endpoint URL (null = deterministic code rule) |
| createdAt      | string?  | Creation timestamp                       |

---

## Test Domain

### Hierarchy

```
App
 └─ Test Suites ──┐
                   ├── (many-to-many) ──► Test Suites
                   └── (many-to-many) ──► Test Cases
                                            └── (one-to-many) ──► Test Actions

Scan
 └─ AI Decomposition Jobs (per page state)
      └─ Creates Test Suites / Test Cases

Test Run ──► points to one Test Suite or one Test Case
 └─ Test Run Findings (errors/warnings)
 └─ Verified by Expertise Rules (global)
```

### Test Suite

A named grouping that can contain other test suites and/or test cases. The relationship is a **directed acyclic graph (DAG)** — a test suite can belong to multiple other test suites, and a test case can belong to multiple test suites. **Circular references must be prevented** (e.g., A contains B contains A is invalid).

| Field                    | Type     | Description                |
|--------------------------|----------|----------------------------|
| id                       | number   | Primary key                |
| appId                    | number   | Parent app                 |
| decompositionJobId       | number?  | AI Decomposition Job that created this suite |
| title                    | string   | Suite title                |
| description              | string   | Suite description          |
| sizeClass                | string   | desktop or mobile          |
| priority                 | number   | 1 (highest) to 5 (lowest) |
| startingPageStateId      | number   | Page state where this suite begins |
| startingPath             | string   | Entry path (relative to app's baseUrl) |
| dependencyTestCaseId     | number?  | Test case that must complete before this suite can run |
| personaIds               | number[] | Associated personas        |
| reusableHtmlElementId    | number?  | If this suite tests a reusable element (header, footer, etc.) |
| reusableHtmlElementType  | string?  | Component type (topMenu, footer, breadcrumb, etc.) |
| patternType              | string?  | If this suite tests a UI pattern (card, modal, table, etc.) |
| suiteTags                | string[] | Categorization tags        |
| estimatedDurationMs      | number?  | Estimated duration         |
| createdAt                | string?  | Creation timestamp         |

**Relationships:**
- Many-to-many with other Test Suites (DAG — no cycles allowed)
- Many-to-many with Test Cases (a suite can contain cases, a case can be in multiple suites)

### Test Case

A single test scenario containing an ordered list of test actions. Belongs to one or more test suites.

| Field                  | Type       | Description                        |
|------------------------|------------|------------------------------------|
| id                     | number     | Primary key                        |
| appId                  | number     | Parent app                         |
| title                  | string     | Test case title                    |
| testType               | string     | render, interaction, form, form_negative, password, navigation, e2e |
| sizeClass              | string     | desktop or mobile                  |
| suiteTags              | string[]   | Categorization tags                |
| priority               | number     | 1 (highest) to 5 (lowest)         |
| reusableHtmlElementId  | number?    | If this case tests a reusable element (header, footer, etc.) |
| patternType            | string?    | If this case tests a UI pattern (card, modal, table, etc.) |
| dependencyTestCaseId   | number?    | Test case that must complete before this one can run |
| pageId                 | number?    | Associated page                    |
| personaId              | number?    | Associated persona                 |
| useCaseId              | number?    | Associated use case                |
| startingPageStateId    | number?    | Initial page state                 |
| startingPath           | string?    | Entry path (relative to app's baseUrl) |
| globalExpectationsJson | unknown    | Expectations checked after all steps |
| estimatedDurationMs    | number?    | Estimated duration                 |
| generatedAt            | string?    | Generation timestamp               |

**Relationships:**
- Many-to-many with Test Suites (a case can belong to multiple suites)
- One-to-many with Test Actions (strict parent/child — actions belong to exactly one case)
- Optional dependency on another Test Case (must complete first)

### Test Action

A single step within a test case. Strict parent/child relationship with its test case.

| Field                      | Type     | Description                              |
|----------------------------|----------|------------------------------------------|
| id                         | number   | Primary key                              |
| testCaseId                 | number   | Parent test case (strict ownership)      |
| stepOrder                  | number   | Position within the test case            |
| actionType                 | string   | goto, click, fill, select, screenshot, etc. |
| pageStateId                | number?  | Page state context for this action       |
| elementIdentityId          | number?  | Target element                           |
| containerType              | string?  | Component type if targeting element inside a component (topMenu, footer, etc.) |
| containerElementIdentityId | number?  | Element identity of the container component |
| value                      | string?  | Input value (for fill/select)            |
| path                       | string?  | Target path (relative to app's baseUrl, for goto) |
| playwrightCode             | string   | Executable Playwright code               |
| description                | string   | Human-readable step description          |
| expectations               | json     | Array of expectations to verify after this action |
| continueOnFailure          | boolean  | Whether to proceed if this step fails    |

### Test Run

A single execution of a test suite or test case. Points to exactly one test suite **or** one test case (not both).

| Field          | Type     | Description                              |
|----------------|----------|------------------------------------------|
| id             | number   | Primary key                              |
| scanId         | number   | Parent scan execution                    |
| testSuiteId    | number?  | The test suite being run (nullable)      |
| testCaseId     | number?  | The test case being run (nullable)       |
| sizeClass      | string   | desktop or mobile                        |
| status         | string   | Planned, Running, or Completed           |
| durationMs     | number?  | Execution duration                       |
| errorMessage   | string?  | Failure details                          |
| screenshotPath | string?  | Result screenshot                        |
| consoleLog     | string?  | Browser console output                   |
| networkLog     | string?  | Network requests log                     |
| createdAt      | string   | Creation timestamp (status set to Planned) |
| startedAt      | string?  | When status changed to Running           |
| completedAt    | string?  | When status changed to Completed         |

**Constraint:** Exactly one of `testSuiteId` or `testCaseId` must be set.

### Test Run Finding

An error or warning discovered during a test run.

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| id              | number   | Primary key                              |
| testRunId       | number   | Parent test run                          |
| expertiseRuleId | number?  | Expertise rule that produced this finding |
| type            | string   | error or warning                         |
| title           | string   | Finding summary                          |
| description     | string   | Detailed description                     |
| createdAt       | string?  | Creation timestamp                       |

### Junction Tables

**test_suite_suites** (suite-to-suite, many-to-many):

| Field         | Type   | Description        |
|---------------|--------|--------------------|
| parentSuiteId | number | Containing suite   |
| childSuiteId  | number | Contained suite    |

**test_suite_cases** (suite-to-case, many-to-many):

| Field       | Type   | Description        |
|-------------|--------|--------------------|
| testSuiteId | number | Containing suite   |
| testCaseId  | number | Contained case     |
