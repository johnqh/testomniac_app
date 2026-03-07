# @sudobility/testomniac_app

Web application for the Testomniac AI-powered automated UI testing platform. Built with React 19, Vite 6, and Tailwind CSS.

## Setup

```bash
bun install
cp .env.example .env   # Configure VITE_API_URL, Firebase keys
```

## Features

- History management with CRUD operations
- 16-language i18n with RTL support and language-prefixed routes
- Firebase authentication
- Light/dark theme switching
- Lazy-loaded pages with React Suspense

## Development

```bash
bun run dev          # Vite dev server
bun run build        # TypeScript check + Vite build
bun run preview      # Preview production build
bun run typecheck    # TypeScript check
bun run verify       # All checks (typecheck + lint + format)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8022` | Backend API URL |
| `VITE_FIREBASE_API_KEY` | -- | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | -- | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | -- | Firebase project ID |
| `VITE_APP_NAME` | Testomniac | Application name |

## Related Packages

- `testomniac_types` -- Shared type definitions
- `testomniac_client` -- API client SDK
- `testomniac_lib` -- Business logic with Zustand stores
- `testomniac_api` -- Backend API server
- `testomniac_app_rn` -- React Native sibling app
- `testomniac_extension` -- Chrome extension

## License

BUSL-1.1
