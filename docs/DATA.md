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

App-level persistent record of a UI element, tracked across test runs. Used to generate stable Playwright locators.

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
| firstSeenTestRunId   | number   | First test run this element was seen in  |
| lastSeenTestRunId    | number   | Most recent test run this element was seen in |
| timesSeen            | number   | Number of test runs this element appeared in |
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

## Test Domain

### Hierarchy

```
App
 ├── Test Suites (1:many with App)
 │     └── Test Cases (1:many via testSuiteId FK)
 │           └── Test Actions (1:many, strict parent/child)
 │
 ├── Test Suite Bundles (1:many with App, user-created)
 │     └── test_suite_bundle_suites ──► Test Suites (many:many)
 │
 ├── Test Schedules (1:many with App)
 │     └── targets one of: Test Suite, Test Case, or Test Suite Bundle
 │
 └── Test Runs (tree via parentTestRunId/rootTestRunId)
       └── points to one of:
           ├── Test Suite Bundle Run
           │     └── Test Suite Runs (1:many)
           │           └── Test Case Runs (1:many)
           │                 └── Test Run Findings (1:many)
           ├── Test Suite Run
           │     └── Test Case Runs (1:many)
           │           └── Test Run Findings (1:many)
           └── Test Case Run
                 └── Test Run Findings (1:many)

AI Decomposition Jobs ──► testRunId
Report Email ──► rootTestRunId
Element Identity ──► firstSeenTestRunId / lastSeenTestRunId
```

### Test Suite

A named grouping of test cases. Each test suite belongs to one app. Test cases have a 1:many relationship with their suite (each test case belongs to exactly one suite).

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

### Test Suite Bundle

A user-created grouping of test suites. Many-to-many relationship with test suites. Bundles are manually created for organizing suites for running/scheduling. Discovery never creates or modifies bundles.

| Field       | Type     | Description                |
|-------------|----------|----------------------------|
| id          | number   | Primary key                |
| appId       | number   | Parent app                 |
| title       | string   | Bundle title               |
| description | string?  | Bundle description         |
| createdAt   | string?  | Creation timestamp         |
| updatedAt   | string?  | Last update timestamp      |

**Junction: test_suite_bundle_suites**

| Field              | Type   | Description         |
|--------------------|--------|---------------------|
| id                 | number | Primary key         |
| testSuiteBundleId  | number | The bundle          |
| testSuiteId        | number | The suite           |

UNIQUE constraint on (testSuiteBundleId, testSuiteId).

### Test Case

A single test scenario containing an ordered list of test actions. Belongs to exactly one test suite. If the same scenario is needed in multiple suites, the test case is duplicated.

| Field                  | Type       | Description                        |
|------------------------|------------|------------------------------------|
| id                     | number     | Primary key                        |
| appId                  | number     | Parent app                         |
| testSuiteId            | number     | Parent test suite (1:many)         |
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

### Test Case Run

A single execution of a test case. This is where actual browser work happens — navigation, clicks, assertions, screenshots. Contains execution details and findings.

| Field           | Type     | Description                              |
|-----------------|----------|------------------------------------------|
| id              | number   | Primary key                              |
| testCaseId      | number   | The test case being executed             |
| testSuiteRunId  | number?  | Parent test suite run (null if run standalone) |
| status          | string   | pending, running, completed, failed      |
| durationMs      | number?  | Execution duration                       |
| errorMessage    | string?  | Failure details                          |
| screenshotPath  | string?  | Result screenshot                        |
| consoleLog      | string?  | Browser console output                   |
| networkLog      | string?  | Network requests log                     |
| startedAt       | string?  | When execution started                   |
| completedAt     | string?  | When execution ended                     |
| createdAt       | string?  | Creation timestamp                       |

### Test Suite Run

A single execution of a test suite. Contains a list of Test Case Runs (one per test case in the suite).

| Field                | Type     | Description                              |
|----------------------|----------|------------------------------------------|
| id                   | number   | Primary key                              |
| testSuiteId          | number   | The test suite being executed            |
| testSuiteBundleRunId | number?  | Parent bundle run (null if run standalone) |
| status               | string   | pending, running, completed, failed      |
| startedAt            | string?  | When execution started                   |
| completedAt          | string?  | When execution ended                     |
| createdAt            | string?  | Creation timestamp                       |

### Test Suite Bundle Run

A single execution of a test suite bundle. Contains a list of Test Suite Runs (one per suite in the bundle).

| Field              | Type     | Description                              |
|--------------------|----------|------------------------------------------|
| id                 | number   | Primary key                              |
| testSuiteBundleId  | number   | The bundle being executed                |
| status             | string   | pending, running, completed, failed      |
| startedAt          | string?  | When execution started                   |
| completedAt        | string?  | When execution ended                     |
| createdAt          | string?  | Creation timestamp                       |

### Test Run

The top-level execution record. Points to exactly one of: Test Suite Bundle Run, Test Suite Run, or Test Case Run. Test runs form a tree via `parentTestRunId`/`rootTestRunId`. Root test runs (where `parentTestRunId` is null) carry discovery metadata and aggregate stats.

When `discovery` is true, the test run triggers AI decomposition of discovered page states and creates child test runs for newly generated test suites.

`createdByUserId` is always set to the user who initiated the run. `ownedByUserId` is set only when initiated from the web extension (meaning the user's browser runs it). When `ownedByUserId` is null, the server-side runner (`testomniac_runner`) picks up and executes the run.

| Field                | Type     | Description                              |
|----------------------|----------|------------------------------------------|
| id                   | number   | Primary key                              |
| appId                | number   | Parent app                               |
| testSuiteBundleRunId | number?  | Target bundle run (exactly one of three) |
| testSuiteRunId       | number?  | Target suite run (exactly one of three)  |
| testCaseRunId        | number?  | Target case run (exactly one of three)   |
| discovery            | boolean  | When true, AI decomposes discovered pages. Default false |
| parentTestRunId      | number?  | Parent test run (null for root)          |
| rootTestRunId        | number?  | Topmost ancestor (null for root itself)  |
| sizeClass            | string   | desktop or mobile                        |
| status               | string   | pending, planned, running, completed, failed |
| createdByUserId      | string?  | User who initiated this run              |
| ownedByUserId        | string?  | User who owns/runs it (null = server-side) |
| scanUrl              | string?  | URL being tested (set on root runs)      |
| pagesFound           | number?  | Number of unique pages discovered        |
| pageStatesFound      | number?  | Number of page state captures            |
| testRunsCompleted    | number?  | Number of child test runs completed      |
| aiSummary            | string?  | AI-generated summary                     |
| totalDurationMs      | number?  | Total tree duration                      |
| createdAt            | string   | Creation timestamp                       |
| startedAt            | string?  | When execution started                   |
| completedAt          | string?  | When execution ended                     |

**Constraint:** Exactly one of `testSuiteBundleRunId`, `testSuiteRunId`, or `testCaseRunId` must be set.

### Test Run Finding

An error or warning discovered during a test case run execution.

| Field           | Type     | Description                              |
|-----------------|----------|------------------------------------------|
| id              | number   | Primary key                              |
| testCaseRunId   | number   | Parent test case run                     |
| expertiseRuleId | number?  | Expertise rule that produced this finding |
| type            | string   | error or warning                         |
| title           | string   | Finding summary                          |
| description     | string   | Detailed description                     |
| createdAt       | string?  | Creation timestamp                       |

---

## Discovery Domain

### AI Decomposition Job

Created during a discovery test run for each page state that needs decomposition. Takes the page state, breaks it into pieces (reusable elements and main body), and creates test suites with test cases for each piece. New jobs can be created during test execution when previously unseen page states are encountered.

| Field        | Type     | Description                              |
|--------------|----------|------------------------------------------|
| id           | number   | Primary key                              |
| testRunId    | number   | The test run that triggered this job     |
| pageStateId  | number   | The page state to decompose              |
| personaId    | number?  | Persona context for test generation      |
| status       | string   | Pending or Done                          |
| createdAt    | string?  | Creation timestamp                       |
| completedAt  | string?  | When decomposition finished              |

### Discovery Flow

Discovery replaces the old scanning concept. A discovery-mode test run explores the site and auto-generates test suites and test cases.

```
User enters URL
  │
  v
1. Find/create App for URL
2. Find/create singleton "Direct Navigations" test suite for app
3. Find/create test case with navigate action to URL, add to suite
4. Create ROOT test run (discovery=true, parentTestRunId=null)
  │
  v
5. Execute: navigate to URL, capture page state
6. Create AI Decomposition Job (testRunId = root)
  │
  v
7. AI processes decomposition:
   - For each component: find/create persistent per-app suite
     (e.g., "Top Menu"), generate test cases in it
   - For each link: add navigation test case to "Direct Navigations"
     if not already present
  │
  v
8. Create child test runs for new suites (discovery=true inherited)
9. Execute child runs → discover new page states → new decomp jobs
  │
  v
10. Loop until no new page states → mark root completed with stats
```

Test suites are persistent per-app singletons that accumulate test cases across discovery runs.

### Credential

Stored login credentials for an app (used during test runs).

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

## Scheduling Domain

### Test Schedule

A flexible scheduling object to automate test run creation. Can target a test suite, test case, or test suite bundle.

| Field             | Type     | Description                              |
|-------------------|----------|------------------------------------------|
| id                | number   | Primary key                              |
| appId             | number   | Parent app                               |
| title             | string   | Schedule title                           |
| testSuiteId       | number?  | Target suite (exactly one of three)      |
| testCaseId        | number?  | Target case (exactly one of three)       |
| testSuiteBundleId | number?  | Target bundle (exactly one of three)     |
| discovery         | boolean  | Default false. Passed to created test runs |
| recurrenceType    | string   | one_time, weekday, daily, weekly         |
| timeOfDay         | string   | HH:MM format (e.g., "09:00")            |
| dayOfWeek         | number?  | 0-6 (Sunday-Saturday); required when recurrenceType=weekly |
| timezone          | string   | IANA timezone (e.g., "America/New_York") |
| enabled           | boolean  | Default true                             |
| sizeClass         | string   | desktop or mobile                        |
| createdByUserId   | string   | User who created the schedule            |
| lastRunAt         | string?  | Timestamp of last execution              |
| nextRunAt         | string?  | Computed next execution time             |
| createdAt         | string?  | Creation timestamp                       |
| updatedAt         | string?  | Last update timestamp                    |

**Constraint:** Exactly one of `testSuiteId`, `testCaseId`, or `testSuiteBundleId` must be set.

**Recurrence types:**
- `one_time` — runs once at the specified time, then disabled
- `weekday` — runs Monday through Friday at the specified time
- `daily` — runs every day at the specified time
- `weekly` — runs on the specified `dayOfWeek` at the specified time

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

An email report sent for a test run.

| Field           | Type     | Description                              |
|-----------------|----------|------------------------------------------|
| id              | number   | Primary key                              |
| rootTestRunId   | number   | Root test run this report is for         |
| userEmail       | string   | Recipient email                          |
| deepLinkToken   | string   | Unique token for deep link access        |
| sentAt          | string?  | When the email was sent                  |

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
