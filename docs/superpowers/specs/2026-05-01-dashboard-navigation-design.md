# Dashboard Navigation Redesign

## Goal

Replace the complex tree-based dashboard sidebar with a flat menu structure. Users navigate via project/app selectors at the top, then access app-specific pages from a simple menu below.

## Navigation Flow

1. User logs in → selects entity
2. Sidebar shows two dropdowns at top: Project, then App
3. If only one project exists, auto-select it. If only one app exists, auto-select it.
4. Both dropdowns always include a "Create New..." option at the bottom.
5. Once an app is selected, flat menu appears below the dropdowns.

## Sidebar Layout

```
┌─────────────────────────┐
│ [Project dropdown    ▼] │  ← Select from @sudobility/components
│ [App dropdown        ▼] │  ← Select from @sudobility/components
├─────────────────────────┤
│  Bundles                 │
│  Suites                  │
│  Test Cases              │
│  Runs                    │
│  Issues                  │
│  Schedules               │
│  Settings                │
└─────────────────────────┘
```

- Menu items only shown when an app is selected
- Active item highlighted
- Changing app navigates to that app's first menu item (Bundles)

## Routes

All under `/:lang/dashboard/:entitySlug/apps/:appId/`:

| Menu Item  | Route              | Page Component      |
|------------|--------------------|---------------------|
| Bundles    | `bundles`          | BundlesPage (new)   |
| Suites     | `test-suites`      | TestSuitesListPage  |
| Test Cases | `test-cases`       | TestCasesPage       |
| Runs       | `runs`             | TestRunsListPage    |
| Issues     | `issues`           | FindingsListPage (updated with filter) |
| Schedules  | `schedules`        | SchedulesPage (new) |
| Settings   | `settings`         | AppSettingsPage     |

## Dropdown Behavior

**Project dropdown:**
- Options: all projects in the entity + "Create New..."
- Auto-selects if only one project exists
- On "Create New..." → navigate to project creation flow

**App dropdown:**
- Options: all apps in selected project + "Create New..."
- Auto-selects if only one app exists under selected project
- On "Create New..." → navigate to app creation flow
- Disabled/hidden until a project is selected

## Component

Uses `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` from `@sudobility/components` (Radix-based).

## New Pages

1. **BundlesPage** — lists test suite bundles for the app
2. **SchedulesPage** — CRUD for test schedules (list, add, modify, remove)

## Updated Pages

- **FindingsListPage** — add All/Errors Only toggle filter

## Removed

- Old tree-based DashboardSidebar navigation (projects → apps → sub-pages tree)
- "Start New Scan" button (replaced by discovery runs from Runs page or Schedules)
