# @sudobility/testomniac_app

Web application for the Testomniac project. Built with React 19, Vite 6, and Tailwind CSS.

## Setup

```bash
bun install
cp .env.example .env   # Configure environment variables
```

### Environment Variables

| Variable                          | Description                          | Default                 |
| --------------------------------- | ------------------------------------ | ----------------------- |
| `VITE_API_URL`                    | Backend API URL                      | `http://localhost:8027` |
| `VITE_FIREBASE_API_KEY`           | Firebase API key                     | required                |
| `VITE_FIREBASE_AUTH_DOMAIN`       | Firebase auth domain                 | required                |
| `VITE_FIREBASE_PROJECT_ID`        | Firebase project ID                  | required                |
| `VITE_FIREBASE_STORAGE_BUCKET`    | Firebase Storage bucket              | optional                |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID | optional                |
| `VITE_FIREBASE_APP_ID`            | Firebase app ID                      | optional                |
| `VITE_FIREBASE_MEASUREMENT_ID`    | Firebase Analytics measurement ID    | optional                |
| `VITE_APP_NAME`                   | Application name                     | `Testomniac`            |
| `VITE_APP_DOMAIN`                 | Application domain                   | `localhost`             |
| `VITE_COMPANY_NAME`               | Company name for footer/SEO          | optional                |
| `VITE_SUPPORT_EMAIL`              | Support email for SEO config         | optional                |
| `VITE_TWITTER_HANDLE`             | Twitter/X handle for SEO (without @) | optional                |
| `VITE_DEV_MODE`                   | Enable test/dev mode                 | `false`                 |
| `VITE_SHOW_PERFORMANCE_MONITOR`   | Show performance monitor panel       | `false`                 |

## Running

```bash
bun run dev            # Start Vite dev server (port 5135)
bun run build          # Full prod build: typecheck + seo:fetch + generate assets + tsc + vite build
bun run preview        # Preview production build
```

## Features

- **i18n**: 15 languages with RTL support. Language-prefixed routes (`/:lang/*`).
- **Auth**: Firebase Auth with protected routes.
- **Theming**: Light/dark theme switching via ThemeContext.
- **Code splitting**: 46 lazy-loaded pages with React Suspense.
- **Shared UI**: Uses `@sudobility/building_blocks` for TopBar, LoginPage, SettingsPage.
- **Dashboard**: Entity-scoped dashboard with environment-based navigation.
- **Scanning**: Real-time scan progress via SSE with live counters and event log.
- **Test management**: Test surfaces, interactions, runs, bundles, scenarios, and schedules.
- **Visualization**: Site map and page state graphs via ReactFlow.
- **SEO**: SEO meta tags, structured data, and sitemap generation.
- **Analytics**: Integrated analytics and performance monitoring.

## Pages

- **Public**: Home, Login, Docs, Sitemap, Public Scan Progress
- **Dashboard**: Overview, Start Scan, Scan Progress
- **Environment**: Test Surfaces, Test Interactions, Test Runs, Surface Runs, Interaction Runs, Bundles, Pages, Page States, Findings/Issues, Scaffolds, Patterns, Personas, Scenarios, Schedules, Site Map Graph, Page Graph, Runner Settings
- **Entity Management**: Settings, Workspaces, Members, Invitations
- **Profile**: Account, API Keys, Workspaces, Members, Invitations

## Development

```bash
bun run dev            # Vite dev server (port 5135)
bun run build          # Full prod build: typecheck + seo:fetch + generate assets + tsc + vite build
bun run preview        # Preview production build
bun run typecheck      # TypeScript check
bun run lint           # ESLint
bun run lint:fix       # ESLint with auto-fix
bun run format         # Prettier
bun run format:check   # Prettier check
bun run verify         # typecheck + lint + format:check
bun run localize       # Batch localization via Whisperly API
```

## Related Packages

- **testomniac_types** -- Shared type definitions
- **testomniac_client** -- API client SDK with TanStack Query hooks
- **testomniac_lib** -- Business logic library (`useScanManager`, `useDashboardManager`, `useRunManager`, etc.)
- **testomniac_api** -- Backend server (default port 8027)

## License

BUSL-1.1
