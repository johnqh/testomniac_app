# Testomniac App

Web application for the Testomniac project.

**Package**: `@sudobility/entitytestomniac_app` (private, BUSL-1.1)

## Tech Stack

- **Language**: TypeScript (strict mode, JSX)
- **Runtime**: Bun
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Framework**: React 19
- **Routing**: React Router v7
- **Build**: Vite 6
- **Styling**: Tailwind CSS 3
- **i18n**: i18next (16 languages, RTL support)
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
│   └── initialize.ts                     # App initialization
├── context/
│   └── ThemeContext.tsx                   # Theme provider
├── components/
│   ├── ErrorBoundary.tsx                 # Error boundary with retry support
│   ├── layout/
│   │   ├── TopBar.tsx                    # Navigation bar
│   │   ├── Footer.tsx                    # Page footer
│   │   ├── ScreenContainer.tsx           # Page wrapper
│   │   ├── ProtectedRoute.tsx            # Auth guard
│   │   ├── LocalizedLink.tsx             # Language-aware links
│   │   ├── LanguageRedirect.tsx          # Auto-redirect to lang prefix
│   │   └── EntityRedirect.tsx            # Redirect to user's default entity
│   ├── providers/
│   │   └── AuthProviderWrapper.tsx       # Firebase auth provider
│   ├── scanner/
│   │   ├── EventLog.tsx                  # Real-time scan event stream
│   │   ├── LiveCounters.tsx              # Live scan statistics
│   │   ├── PhaseIndicator.tsx            # Current scan phase display
│   │   ├── RunSummaryCard.tsx            # Run overview card
│   │   ├── ScanForm.tsx                  # New scan submission form
│   │   ├── ScanProgressPanel.tsx         # Scan progress visualization
│   │   └── StatusBadge.tsx               # Run status indicator
│   ├── data/
│   │   ├── JsonViewer.tsx                # Collapsible JSON display
│   │   └── DataTable.tsx                 # Reusable data table
│   └── dashboard/
│       └── DashboardSidebar.tsx          # Dashboard navigation sidebar
├── hooks/
│   ├── useLocalizedNavigate.ts           # Navigate with lang prefix
│   ├── useDocumentLanguage.ts            # Set HTML lang attribute
│   ├── useBreadcrumbs.ts                 # Breadcrumb navigation
│   ├── useBuildingBlocksAnalytics.ts     # Analytics integration
│   ├── useEventSource.ts                 # SSE event stream hook
│   └── usePageConfig.ts                  # Page title/meta configuration
├── utils/
│   └── formatDateTime.ts                 # Locale-aware date/time formatting
└── pages/
    ├── HomePage.tsx                      # Landing page
    ├── LoginPage.tsx                     # Authentication page
    ├── DocsPage.tsx                      # Documentation
    ├── SitemapPage.tsx                   # Sitemap
    ├── DashboardPage.tsx                 # Dashboard layout (with sidebar + Outlet)
    ├── DashboardOverview.tsx             # Dashboard home / project overview
    ├── StartScanPage.tsx                 # New scan form page
    ├── ScanProgressPage.tsx              # Authenticated scan progress
    ├── PublicScanProgressPage.tsx        # Public scan progress (no auth)
    ├── RunDetailsPage.tsx                # Individual run details
    ├── TestCasesPage.tsx                 # Generated test cases list
    ├── TestRunsPage.tsx                  # Test execution results
    ├── IssuesPage.tsx                    # Detected issues list
    ├── PagesPage.tsx                     # Discovered pages list
    ├── MapPage.tsx                       # Site map visualization
    ├── ScaffoldsPage.tsx                # Detected scaffolds list
    ├── PersonasPage.tsx                  # AI-generated personas
    ├── SettingsPage.tsx                  # User settings
    ├── WorkspacesPage.tsx                # Workspace management
    ├── MembersPage.tsx                   # Team members
    └── InvitationsPage.tsx              # Pending invitations
```

## Commands

```bash
bun run dev            # Vite dev server
bun run build          # TypeScript check + Vite build
bun run preview        # Preview production build
bun run typecheck      # TypeScript check
bun run lint           # Run ESLint
bun run format         # Format with Prettier
bun run verify         # Run typecheck + lint + format:check (no test suite; relies on type checking)
```

## Routing

Language-prefixed routes: `/:lang/*` (e.g., `/en/dashboard`, `/ja/settings`).

16 supported languages: en, ar, de, es, fr, it, ja, ko, pt, ru, sv, th, uk, vi, zh, zh-hant.

Pages are lazy-loaded with React Suspense.

### Route Structure

- `/:lang/` — Home
- `/:lang/login` — Login
- `/:lang/docs` — Documentation
- `/:lang/sitemap` — Sitemap
- `/:lang/scan/:runId/progress` — Public scan progress (no auth)
- `/:lang/dashboard` — Redirects to default entity
- `/:lang/dashboard/:entitySlug/` — Dashboard overview
- `/:lang/dashboard/:entitySlug/scan/new` — Start new scan
- `/:lang/dashboard/:entitySlug/runs/:runId` — Run details
- `/:lang/dashboard/:entitySlug/runs/:runId/progress` — Scan progress
- `/:lang/dashboard/:entitySlug/runs/:runId/test-cases` — Test cases
- `/:lang/dashboard/:entitySlug/runs/:runId/test-runs` — Test runs
- `/:lang/dashboard/:entitySlug/runs/:runId/issues` — Issues
- `/:lang/dashboard/:entitySlug/runs/:runId/pages` — Pages
- `/:lang/dashboard/:entitySlug/runs/:runId/map` — Site map
- `/:lang/dashboard/:entitySlug/runners/:runnerId/scaffolds` — Scaffolds
- `/:lang/dashboard/:entitySlug/runs/:runId/personas` — Personas
- `/:lang/dashboard/:entitySlug/settings` — Settings
- `/:lang/dashboard/:entitySlug/workspaces` — Workspaces
- `/:lang/dashboard/:entitySlug/members` — Members
- `/:lang/dashboard/:entitySlug/invitations` — Invitations

## Shared Components

Uses `@sudobility/building_blocks` for:

- TopBar, LoginPage, SettingsPage, SudobilityAppWithFirebaseAuth

## Environment Variables

| Variable                    | Description          | Default                 |
| --------------------------- | -------------------- | ----------------------- |
| `VITE_API_URL`              | Backend API URL      | `http://localhost:8027` |
| `VITE_FIREBASE_API_KEY`     | Firebase API key     | required                |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | required                |
| `VITE_FIREBASE_PROJECT_ID`  | Firebase project ID  | required                |
| `VITE_APP_NAME`             | Application name     | `Testomniac`        |
| `VITE_APP_DOMAIN`           | Application domain   | `localhost`             |

**Note**: The default API URL in constants is `http://localhost:8027`, matching the API server's default port.

## Related Projects

- **entitytestomniac_types** — Shared type definitions; imported transitively via entitytestomniac_client
- **entitytestomniac_client** — API client SDK with TanStack Query hooks; provides data fetching layer
- **entitytestomniac_lib** — Business logic library with `useScanManager`, `useDashboardManager`, `useRunManager` hooks; primary integration point for this app
- **entitytestomniac_api** — Backend server that this app communicates with (web defaults to `localhost:8027`)
- **entityentitytestomniac_app_rn** — React Native counterpart of this web app; shares entitytestomniac_client, entitytestomniac_lib, and entitytestomniac_types

Uses `@sudobility/building_blocks` for shared shell components (TopBar, LoginPage, SettingsPage, SudobilityAppWithFirebaseAuth).

## Coding Patterns

- All routes are language-prefixed: `/:lang/*` (e.g., `/en/dashboard`, `/ja/settings`) -- never create routes without the language prefix
- Pages are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>` for code splitting
- 16 languages are supported with RTL support (Arabic) -- use `LocalizedLink` and `useLocalizedNavigate` for navigation
- `ThemeContext` provides light/dark theme switching throughout the app
- `ProtectedRoute` component guards authenticated pages -- wrap any page requiring auth with it
- Vite config deduplicates React and shared dependencies to prevent multiple React instances
- i18next is configured in `src/i18n.ts` with language detection and fallback to English

## Gotchas

- API URL: `.env` defaults to `localhost:8027` to match the API server (`entitytestomniac_api`) -- verify `VITE_API_URL` matches your running API if using a different port
- Vite deduplicates React and shared deps in its config -- if you add new shared dependencies, check if they need deduplication
- All routes MUST be under the `/:lang/` prefix -- routes without the language prefix will not work correctly
- Firebase configuration requires all `VITE_FIREBASE_*` environment variables to be set; missing any will break authentication
- `@sudobility/building_blocks` provides shared UI components -- check there before creating duplicate components
