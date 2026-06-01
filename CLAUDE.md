# Testomniac App

Web application for the Testomniac project.

**Package**: `@sudobility/testomniac_app` (private, BUSL-1.1)

## Tech Stack

- **Language**: TypeScript (strict mode, JSX)
- **Runtime**: Bun
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Framework**: React 19
- **Routing**: React Router v7
- **Build**: Vite 6
- **Styling**: Tailwind CSS 3
- **i18n**: i18next (15 languages, RTL support)
- **Auth**: Firebase Auth

## Project Structure

```
src/
├── main.tsx                              # App entry point
├── App.tsx                               # Router setup, lazy-loaded routes
├── i18n.ts                               # i18next configuration
├── config/
│   ├── constants.ts                      # App constants, supported languages
│   ├── auth-config.ts                    # Firebase auth configuration
│   └── initialize.ts                     # App initialization (DI + Firebase + i18n)
├── context/
│   └── ThemeContext.tsx                   # Theme provider (light/dark)
├── components/
│   ├── ErrorBoundary.tsx                 # Error boundary with retry + analytics
│   ├── SEOHead.tsx                       # Helmet wrapper for SEO meta tags
│   ├── layout/
│   │   ├── TopBar.tsx                    # Navigation bar
│   │   ├── Footer.tsx                    # Page footer
│   │   ├── ScreenContainer.tsx           # Page wrapper with breadcrumbs
│   │   ├── ProtectedRoute.tsx            # Auth guard
│   │   ├── LocalizedLink.tsx             # Language-aware links
│   │   └── EntityRedirect.tsx            # Redirect to user's default entity
│   ├── providers/
│   │   └── AuthProviderWrapper.tsx       # Firebase auth provider
│   ├── scanner/                          # Scan progress components
│   │   ├── ScanForm.tsx                  # URL + email input form
│   │   ├── EventLog.tsx                  # Real-time event stream (SSE)
│   │   ├── LiveCounters.tsx, PhaseIndicator.tsx, StatusBadge.tsx
│   │   ├── RunSummaryCard.tsx, ScanProgressPanel.tsx
│   └── data/
│       ├── DataTable.tsx                 # TanStack Table (sorting, pagination, filtering)
│       └── JsonViewer.tsx                # Collapsible JSON display
├── hooks/
│   ├── useLocalizedNavigate.ts           # Navigate with lang prefix + switchLanguage()
│   ├── useDocumentLanguage.ts            # Sync HTML lang + RTL dir attribute
│   ├── useBreadcrumbs.ts                 # Breadcrumb navigation
│   ├── useEventSource.ts                 # SSE event stream hook
│   └── usePageConfig.ts                  # Page title/meta configuration
├── utils/
│   └── formatDateTime.ts                 # Locale-aware date/time formatting
└── pages/                                # 52 lazy-loaded pages
    ├── HomePage.tsx                      # Landing page with ScanForm
    ├── LoginPage.tsx                     # Authentication page
    ├── DashboardPage.tsx                 # Dashboard layout (master-detail sidebar)
    ├── DashboardOverview.tsx             # Stats + product/environment cards
    ├── StartScanPage.tsx                 # New scan submission
    ├── ScanProgressPage.tsx              # Authenticated scan progress (SSE)
    ├── PublicScanProgressPage.tsx         # Public scan progress (no auth)
    ├── TestSurfacesListPage.tsx          # Test surfaces list
    ├── TestSurfaceDetailPage.tsx         # Test surface detail
    ├── TestInteractionsPage.tsx          # Test interactions list
    ├── TestInteractionDetailPage.tsx     # Interaction detail
    ├── TestRunsListPage.tsx              # Test execution results
    ├── TestRunDetailPage.tsx             # Test run detail
    ├── BundlesPage.tsx                   # Test bundles list
    ├── BundleDetailPage.tsx              # Bundle detail
    ├── FindingsListPage.tsx              # Findings/issues list
    ├── PagesPage.tsx                     # Discovered pages
    ├── PageDetailPage.tsx                # Page detail + states
    ├── PageStateDetailPage.tsx           # Page state details
    ├── RunnerGraphPage.tsx               # Site map visualization (ReactFlow)
    ├── PageGraphPage.tsx                 # Page state graph
    ├── ScaffoldsPage.tsx                 # Detected scaffolds
    ├── ScaffoldDetailPage.tsx            # Scaffold detail
    ├── PatternsPage.tsx                  # UI patterns
    ├── PersonasPage.tsx                  # AI-generated personas
    ├── SchedulesPage.tsx                 # Test schedules
    ├── TestScenariosPage.tsx             # Test scenarios list
    ├── TestScenarioDetailPage.tsx        # Scenario detail
    ├── RunnerSettingsPage.tsx            # Environment/runner settings
    ├── SettingsPage.tsx                  # Entity settings
    ├── WorkspacesPage.tsx                # Workspace management
    ├── MembersPage.tsx                   # Team members
    ├── InvitationsPage.tsx               # Pending invitations
    └── profile/                          # Profile sub-pages
        ├── AccountPage.tsx, ApiKeysPage.tsx
        ├── ProfileWorkspacesPage.tsx, ProfileMembersPage.tsx
        └── ProfileInvitationsPage.tsx
```

## Commands

```bash
bun run dev            # Vite dev server (port 5135)
bun run build          # Full prod build: typecheck + seo:fetch + generate assets + tsc + vite build
bun run preview        # Preview production build
bun run typecheck      # TypeScript check
bun run lint           # Run ESLint
bun run format         # Format with Prettier
bun run verify         # typecheck + lint + format:check
bun run localize       # Batch localization via Whisperly API
```

## Routing

Language-prefixed routes: `/:lang/*` (e.g., `/en/dashboard`, `/ja/settings`).

15 supported languages: en, de, es, fr, it, ja, ko, pt, ru, sv, th, uk, vi, zh, zh-hant.

Pages are lazy-loaded with React Suspense.

### Route Structure

- `/:lang/` — Home
- `/:lang/login` — Login
- `/:lang/scan/:runId/progress` — Public scan progress (no auth)
- `/:lang/dashboard` — Redirects to default entity
- `/:lang/dashboard/:entitySlug/` — Dashboard overview
- `/:lang/dashboard/:entitySlug/scan/new` — Start new scan
- `/:lang/dashboard/:entitySlug/runs/:runId` — Run details
- `/:lang/dashboard/:entitySlug/runs/:runId/progress` — Scan progress
- `/:lang/dashboard/:entitySlug/runs/:runId/test-surfaces` — Test surfaces
- `/:lang/dashboard/:entitySlug/runs/:runId/test-surfaces/:surfaceId` — Surface detail
- `/:lang/dashboard/:entitySlug/runs/:runId/test-interactions` — Test interactions
- `/:lang/dashboard/:entitySlug/runs/:runId/test-interactions/:interactionId` — Interaction detail
- `/:lang/dashboard/:entitySlug/runs/:runId/test-runs` — Test runs
- `/:lang/dashboard/:entitySlug/runs/:runId/test-runs/:testRunId` — Test run detail
- `/:lang/dashboard/:entitySlug/runs/:runId/bundles` — Bundles
- `/:lang/dashboard/:entitySlug/runs/:runId/bundles/:bundleId` — Bundle detail
- `/:lang/dashboard/:entitySlug/runs/:runId/findings` — Findings
- `/:lang/dashboard/:entitySlug/runs/:runId/pages` — Pages
- `/:lang/dashboard/:entitySlug/runs/:runId/pages/:pageId` — Page detail
- `/:lang/dashboard/:entitySlug/runs/:runId/map` — Site map graph
- `/:lang/dashboard/:entitySlug/runners/:runnerId/scaffolds` — Scaffolds
- `/:lang/dashboard/:entitySlug/runners/:runnerId/patterns` — Patterns
- `/:lang/dashboard/:entitySlug/runs/:runId/personas` — Personas
- `/:lang/dashboard/:entitySlug/runners/:runnerId/scenarios` — Scenarios
- `/:lang/dashboard/:entitySlug/runners/:runnerId/schedules` — Schedules
- `/:lang/dashboard/:entitySlug/runners/:runnerId/settings` — Runner settings
- `/:lang/dashboard/:entitySlug/settings` — Entity settings
- `/:lang/dashboard/:entitySlug/workspaces` — Workspaces
- `/:lang/dashboard/:entitySlug/members` — Members
- `/:lang/dashboard/:entitySlug/invitations` — Invitations
- `/:lang/profile/*` — Profile sub-routes (account, API keys, workspaces, members, invitations)

## Shared Components

Uses `@sudobility/building_blocks` for:

- TopBar, LoginPage, SettingsPage, SudobilityAppWithFirebaseAuth

Uses `@sudobility/components` for:

- MasterDetailLayout, Combobox, Input, LanguageValidator

## Environment Variables

| Variable                    | Description          | Default                 |
| --------------------------- | -------------------- | ----------------------- |
| `VITE_API_URL`              | Backend API URL      | `http://localhost:8027` |
| `VITE_FIREBASE_API_KEY`     | Firebase API key     | required                |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | required                |
| `VITE_FIREBASE_PROJECT_ID`  | Firebase project ID  | required                |
| `VITE_APP_NAME`             | Application name     | `Testomniac`            |
| `VITE_APP_DOMAIN`           | Application domain   | `localhost`             |

**Note**: The default API URL in constants is `http://localhost:8027`, matching the API server's default port.

## Related Projects

- **testomniac_types** — Shared type definitions; imported transitively via testomniac_client
- **testomniac_client** — API client SDK with TanStack Query hooks; provides data fetching layer
- **testomniac_lib** — Business logic library with hooks (`useScanManager`, `useDashboardManager`, `useRunManager`, etc.); primary integration point
- **testomniac_api** — Backend server (defaults to `localhost:8027`)

Uses `@sudobility/building_blocks` for shared shell components (TopBar, LoginPage, SettingsPage).

## Coding Patterns

- All routes are language-prefixed: `/:lang/*` — never create routes without the language prefix
- Pages are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>` for code splitting
- 15 languages are supported — use `LocalizedLink` and `useLocalizedNavigate` for navigation
- `ThemeContext` provides light/dark theme switching throughout the app
- `ProtectedRoute` component guards authenticated pages — wrap any page requiring auth with it
- Vite config deduplicates React and shared dependencies to prevent multiple React instances
- i18next is configured in `src/i18n.ts` with language detection and fallback to English
- Path alias `@/` maps to `src/` for imports

## Gotchas

- API URL: `.env` defaults to `localhost:8027` to match the API server — verify `VITE_API_URL` matches your running API
- Vite deduplicates React and shared deps — if you add new shared dependencies, check if they need deduplication
- All routes MUST be under the `/:lang/` prefix — routes without the language prefix will not work correctly
- Firebase configuration requires all `VITE_FIREBASE_*` environment variables to be set
- `@sudobility/building_blocks` provides shared UI components — check there before creating duplicate components
- Dev server runs on port 5135
