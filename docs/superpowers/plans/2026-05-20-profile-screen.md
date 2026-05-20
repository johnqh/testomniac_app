# Profile Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Profile menu item in the user dropdown that links to a new top-level profile screen (`/:lang/profile`) with master-detail layout containing Account, Workspaces, Members, Invitations, and API Keys sections.

**Architecture:** New top-level route `/:lang/profile` with `MasterDetailLayout` (280px sidebar + Outlet). ProfileSidebar provides navigation between sub-pages. Entity-scoped pages (Members, Invitations, API Keys) include an entity selector. API Keys use custom hooks with direct network calls since no client hooks exist yet.

**Tech Stack:** React 19, React Router v7, TanStack Query, Tailwind CSS 3, Firebase Auth, `@sudobility/components` (MasterDetailLayout), `@sudobility/entity_client` (useCurrentEntity, useEntities, EntitySelector), `@sudobility/entity_pages` (EntityListPage, MembersManagementPage, InvitationsPage), `@sudobility/auth-components` (useAuthStatus)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/pages/ProfilePage.tsx` | MasterDetailLayout shell with ProfileSidebar + Outlet |
| Create | `src/components/profile/ProfileSidebar.tsx` | Sidebar navigation for profile sub-pages |
| Create | `src/pages/profile/AccountPage.tsx` | Display Firebase user info (name, email, avatar) |
| Create | `src/pages/profile/ProfileWorkspacesPage.tsx` | Thin wrapper around EntityListPage |
| Create | `src/pages/profile/ProfileMembersPage.tsx` | Entity selector + MembersManagementPage |
| Create | `src/pages/profile/ProfileInvitationsPage.tsx` | Wrapper around InvitationsPage |
| Create | `src/pages/profile/ApiKeysPage.tsx` | Entity selector + API key list + create/delete |
| Create | `src/hooks/useEntityApiKeys.ts` | TanStack Query hooks for entity API key CRUD |
| Modify | `src/App.tsx` | Add `/:lang/profile/*` routes |
| Modify | `src/components/layout/TopBar.tsx` | Add "Profile" to `authenticatedMenuItems` |

---

### Task 1: Add Profile route to TopBar dropdown

**Files:**
- Modify: `src/components/layout/TopBar.tsx`

- [ ] **Step 1: Import AuthMenuItem type and UserIcon**

In `src/components/layout/TopBar.tsx`, add the `AuthMenuItem` import and a `UserCircleIcon` import:

```typescript
import {
  type MenuItemConfig,
  type AuthMenuItem,
  type AuthActionProps,
  type TopBarConfig,
} from '@sudobility/building_blocks';
```

Add a `UserCircleIcon` import from heroicons (already used in this project):

```typescript
import { DocumentTextIcon, RectangleGroupIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';
```

- [ ] **Step 2: Build authenticatedMenuItems array**

Replace the `authenticatedMenuItems: [],` in the return object with a computed array. Add a `useMemo` that builds the items when the user is authenticated:

```typescript
const authenticatedMenuItems: AuthMenuItem[] = useMemo(
  () =>
    isAuthenticated
      ? [
          {
            id: 'profile',
            label: t('nav.profile', 'Profile'),
            icon: <UserCircleIcon className="w-4 h-4" />,
            onClick: () => navigate('/profile'),
          },
        ]
      : [],
  [isAuthenticated, t, navigate]
);
```

Update the return to use this variable:

```typescript
authenticatedMenuItems,
```

- [ ] **Step 3: Verify the app compiles**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors (the route doesn't exist yet, but navigation is just a string).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/TopBar.tsx
git commit -m "feat: add Profile menu item to user dropdown"
```

---

### Task 2: Create ProfileSidebar component

**Files:**
- Create: `src/components/profile/ProfileSidebar.tsx`

- [ ] **Step 1: Create the sidebar component**

Create `src/components/profile/ProfileSidebar.tsx`:

```tsx
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';

interface MenuItem {
  label: string;
  path: string;
  icon: React.FC;
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const AccountIcon = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" />
  </svg>
);

const WorkspacesIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

const MembersIcon = () => (
  <svg {...iconProps}>
    <circle cx="6" cy="5" r="2.5" />
    <circle cx="11" cy="6" r="2" />
    <path d="M1 14c0-2 2-4 5-4s5 2 5 4" />
    <path d="M11 14c0-1.5 1-3 3-3" />
  </svg>
);

const InvitationsIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="4" width="12" height="8" rx="1" />
    <path d="M2 5l6 4 6-4" />
  </svg>
);

const ApiKeysIcon = () => (
  <svg {...iconProps}>
    <path d="M10 5a3 3 0 1 1-1.5 5.6L6 13H4.5v1.5H3V13H2v-1.5l4.4-4.4A3 3 0 0 1 10 5z" />
    <circle cx="10.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const MENU_ITEMS: MenuItem[] = [
  { label: 'Account', path: 'account', icon: AccountIcon },
  { label: 'Workspaces', path: 'workspaces', icon: WorkspacesIcon },
  { label: 'Members', path: 'members', icon: MembersIcon },
  { label: 'Invitations', path: 'invitations', icon: InvitationsIcon },
  { label: 'API Keys', path: 'api-keys', icon: ApiKeysIcon },
];

export function ProfileSidebar() {
  const { navigate } = useLocalizedNavigate();
  const location = useLocation();

  const currentPath = useMemo(() => {
    const langPrefix = location.pathname.match(/^\/[a-z]{2}(-[a-z]+)?\//)?.[0] || '/';
    return location.pathname.slice(langPrefix.length - 1);
  }, [location.pathname]);

  const isActive = (menuPath: string) => {
    const full = `/profile/${menuPath}`;
    return currentPath === full || currentPath.startsWith(full + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {MENU_ITEMS.map(item => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(`/profile/${item.path}`)}
              className={[
                'group relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-all duration-150',
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-900 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
              <span
                className={[
                  'flex-shrink-0 transition-colors duration-150',
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                ].join(' ')}
              >
                <Icon />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ProfileSidebar.tsx
git commit -m "feat: create ProfileSidebar component"
```

---

### Task 3: Create ProfilePage layout shell

**Files:**
- Create: `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Create the ProfilePage with MasterDetailLayout**

Create `src/pages/ProfilePage.tsx`:

```tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MasterDetailLayout } from '@sudobility/components';
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { useSetPageConfig } from '../hooks/usePageConfig';

export default function ProfilePage() {
  const [mobileView, setMobileView] = useState<'navigation' | 'content'>('content');

  useSetPageConfig({ scrollable: false, contentPadding: 'none', maxWidth: '7xl' });

  return (
    <MasterDetailLayout
      masterWidth={280}
      mobileView={mobileView}
      onBackToNavigation={() => setMobileView('navigation')}
      masterContent={<ProfileSidebar />}
      detailContent={
        <div className="min-h-[400px] overflow-y-auto">
          <Outlet />
        </div>
      }
    />
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProfilePage.tsx
git commit -m "feat: create ProfilePage layout with MasterDetailLayout"
```

---

### Task 4: Create AccountPage

**Files:**
- Create: `src/pages/profile/AccountPage.tsx`

- [ ] **Step 1: Create the AccountPage component**

Create `src/pages/profile/AccountPage.tsx`:

```tsx
import { useEffect } from 'react';
import { useAuthStatus } from '@sudobility/auth-components';
import SEOHead from '@/components/SEOHead';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';

export default function AccountPage() {
  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/account', 'Account');
  }, []);

  const { user } = useAuthStatus();

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?';

  return (
    <>
      <SEOHead title="Account" description="" noIndex />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Account</h1>

        <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Avatar'}
              className="w-16 h-16 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-lg font-semibold">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {user.displayName && (
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                {user.displayName}
              </p>
            )}
            {user.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {user.providerId === 'google.com' ? 'Google account' : 'Email account'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/profile/AccountPage.tsx
git commit -m "feat: create AccountPage with user info display"
```

---

### Task 5: Create ProfileWorkspacesPage

**Files:**
- Create: `src/pages/profile/ProfileWorkspacesPage.tsx`

- [ ] **Step 1: Create the ProfileWorkspacesPage**

Create `src/pages/profile/ProfileWorkspacesPage.tsx`:

```tsx
import { useEffect } from 'react';
import { EntityListPage } from '@sudobility/entity_pages';
import SEOHead from '@/components/SEOHead';
import { useEntityClient } from '../../config/entityClient';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import type { EntityWithRole } from '@sudobility/entity_client';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';

const LAST_ENTITY_KEY = 'testomniac_last_entity';

export default function ProfileWorkspacesPage() {
  const { navigate } = useLocalizedNavigate();
  const entityClient = useEntityClient();

  useSetPageConfig({ scrollable: false, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/workspaces', 'Profile Workspaces');
  }, []);

  const handleSelectEntity = (entity: EntityWithRole) => {
    analyticsService.trackButtonClick('select_workspace', { entity_slug: entity.entitySlug });
    localStorage.setItem(LAST_ENTITY_KEY, entity.entitySlug);
    navigate(`/dashboard/${entity.entitySlug}`);
  };

  return (
    <>
      <SEOHead title="Workspaces" description="" noIndex />
      <EntityListPage client={entityClient} onSelectEntity={handleSelectEntity} />
    </>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/profile/ProfileWorkspacesPage.tsx
git commit -m "feat: create ProfileWorkspacesPage"
```

---

### Task 6: Create ProfileMembersPage

**Files:**
- Create: `src/pages/profile/ProfileMembersPage.tsx`

- [ ] **Step 1: Create the ProfileMembersPage with entity selector**

Create `src/pages/profile/ProfileMembersPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { MembersManagementPage } from '@sudobility/entity_pages';
import { EntitySelector } from '@sudobility/entity-components';
import { useAuthStatus } from '@sudobility/auth-components';
import { useCurrentEntity } from '@sudobility/entity_client';
import type { EntityWithRole } from '@sudobility/entity_client';
import SEOHead from '@/components/SEOHead';
import { useEntityClient } from '../../config/entityClient';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';
import { variants } from '@sudobility/design';

export default function ProfileMembersPage() {
  const entityClient = useEntityClient();
  const { currentEntity, entities, isLoading } = useCurrentEntity();
  const { user } = useAuthStatus();
  const [selectedEntity, setSelectedEntity] = useState<EntityWithRole | null>(null);

  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/members', 'Profile Members');
  }, []);

  useEffect(() => {
    if (!selectedEntity && currentEntity) {
      setSelectedEntity(currentEntity);
    }
  }, [selectedEntity, currentEntity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={variants.loading.spinner.default()} />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Members" description="" noIndex />
      <div className="px-4 py-4">
        <div className="mb-4 max-w-xs">
          <EntitySelector
            entities={entities}
            currentEntity={selectedEntity}
            onSelect={setSelectedEntity}
            isLoading={isLoading}
          />
        </div>
        {selectedEntity && user?.uid ? (
          <MembersManagementPage
            client={entityClient}
            entity={selectedEntity}
            currentUserId={user.uid}
          />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a workspace to manage members.
          </p>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/profile/ProfileMembersPage.tsx
git commit -m "feat: create ProfileMembersPage with entity selector"
```

---

### Task 7: Create ProfileInvitationsPage

**Files:**
- Create: `src/pages/profile/ProfileInvitationsPage.tsx`

- [ ] **Step 1: Create the ProfileInvitationsPage**

Create `src/pages/profile/ProfileInvitationsPage.tsx`:

```tsx
import { useEffect } from 'react';
import { InvitationsPage as InvitationsPageComponent } from '@sudobility/entity_pages';
import SEOHead from '@/components/SEOHead';
import { useEntityClient } from '../../config/entityClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';

export default function ProfileInvitationsPage() {
  const entityClient = useEntityClient();
  const queryClient = useQueryClient();

  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/invitations', 'Profile Invitations');
  }, []);

  const handleInvitationAccepted = () => {
    analyticsService.trackEvent('invitation_accepted');
    queryClient.invalidateQueries({ queryKey: ['entities'] });
  };

  return (
    <>
      <SEOHead title="Invitations" description="" noIndex />
      <InvitationsPageComponent
        client={entityClient}
        onInvitationAccepted={handleInvitationAccepted}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/profile/ProfileInvitationsPage.tsx
git commit -m "feat: create ProfileInvitationsPage"
```

---

### Task 8: Create useEntityApiKeys hook

**Files:**
- Create: `src/hooks/useEntityApiKeys.ts`

- [ ] **Step 1: Create the custom hooks for API key CRUD**

Create `src/hooks/useEntityApiKeys.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NetworkClient, BaseResponse } from '@sudobility/types';
import type { ApiKeyResponse } from '@sudobility/testomniac_types';

export interface EntityApiKeyResponse extends ApiKeyResponse {
  entitySlug: string;
  associatedPersonalEntityId: string | null;
}

export interface CreateEntityApiKeyRequest {
  title: string;
  associatedPersonalEntityId?: string | null;
}

interface UseEntityApiKeysConfig {
  networkClient: NetworkClient;
  baseUrl: string;
  entitySlug: string;
  token: string;
  enabled?: boolean;
}

const API_KEY_QUERY_KEY = 'entity-api-keys';

export function useEntityApiKeys(config: UseEntityApiKeysConfig) {
  const { networkClient, baseUrl, entitySlug, token, enabled = true } = config;

  const query = useQuery<BaseResponse<EntityApiKeyResponse[]>>({
    queryKey: [API_KEY_QUERY_KEY, entitySlug],
    queryFn: async () => {
      const res = await networkClient.get<BaseResponse<EntityApiKeyResponse[]>>(
        `${baseUrl}/api/v1/entities/${entitySlug}/api-keys`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data as BaseResponse<EntityApiKeyResponse[]>;
    },
    enabled: enabled && !!entitySlug && !!token,
  });

  return {
    apiKeys: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useCreateEntityApiKey(config: Omit<UseEntityApiKeysConfig, 'enabled'>) {
  const { networkClient, baseUrl, entitySlug, token } = config;
  const queryClient = useQueryClient();

  const mutation = useMutation<
    BaseResponse<EntityApiKeyResponse>,
    Error,
    CreateEntityApiKeyRequest
  >({
    mutationFn: async (data) => {
      const res = await networkClient.post<BaseResponse<EntityApiKeyResponse>>(
        `${baseUrl}/api/v1/entities/${entitySlug}/api-keys`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data as BaseResponse<EntityApiKeyResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_KEY_QUERY_KEY, entitySlug] });
    },
  });

  return {
    createApiKey: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

export function useDeleteEntityApiKey(config: Omit<UseEntityApiKeysConfig, 'enabled'>) {
  const { networkClient, baseUrl, entitySlug, token } = config;
  const queryClient = useQueryClient();

  const mutation = useMutation<BaseResponse<null>, Error, number>({
    mutationFn: async (apiKeyId) => {
      const res = await networkClient.delete<BaseResponse<null>>(
        `${baseUrl}/api/v1/entities/${entitySlug}/api-keys/${apiKeyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data as BaseResponse<null>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_KEY_QUERY_KEY, entitySlug] });
    },
  });

  return {
    deleteApiKey: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEntityApiKeys.ts
git commit -m "feat: create useEntityApiKeys hooks for API key CRUD"
```

---

### Task 9: Create ApiKeysPage

**Files:**
- Create: `src/pages/profile/ApiKeysPage.tsx`

- [ ] **Step 1: Create the ApiKeysPage with full CRUD UI**

Create `src/pages/profile/ApiKeysPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { EntitySelector } from '@sudobility/entity-components';
import { useAuthStatus } from '@sudobility/auth-components';
import { useCurrentEntity } from '@sudobility/entity_client';
import type { EntityWithRole } from '@sudobility/entity_client';
import { EntityType } from '@sudobility/types';
import { useApi } from '@sudobility/building_blocks/firebase';
import { variants } from '@sudobility/design';
import SEOHead from '@/components/SEOHead';
import { useSetPageConfig } from '../../hooks/usePageConfig';
import { analyticsService } from '../../config/analytics';
import { CONSTANTS } from '../../config/constants';
import {
  useEntityApiKeys,
  useCreateEntityApiKey,
  useDeleteEntityApiKey,
  type EntityApiKeyResponse,
} from '../../hooks/useEntityApiKeys';

export default function ApiKeysPage() {
  const { networkClient, token } = useApi();
  const { currentEntity, entities, isLoading: entitiesLoading } = useCurrentEntity();
  const { user } = useAuthStatus();
  const [selectedEntity, setSelectedEntity] = useState<EntityWithRole | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [associatePersonal, setAssociatePersonal] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useSetPageConfig({ scrollable: true, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/profile/api-keys', 'API Keys');
  }, []);

  useEffect(() => {
    if (!selectedEntity && currentEntity) {
      setSelectedEntity(currentEntity);
    }
  }, [selectedEntity, currentEntity]);

  const hookConfig = {
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    entitySlug: selectedEntity?.entitySlug ?? '',
    token: token ?? '',
  };

  const { apiKeys, isLoading: keysLoading, error: fetchError } = useEntityApiKeys({
    ...hookConfig,
    enabled: !!selectedEntity && !!token,
  });
  const { createApiKey, isCreating } = useCreateEntityApiKey(hookConfig);
  const { deleteApiKey } = useDeleteEntityApiKey(hookConfig);

  // Find user's personal entity
  const personalEntity = entities.find(e => e.entityType === EntityType.PERSONAL);

  // Filter: show keys that are not associated with a personal entity, or associated with the user's personal entity
  const visibleKeys = apiKeys.filter(
    key =>
      key.associatedPersonalEntityId === null ||
      (personalEntity && key.associatedPersonalEntityId === personalEntity.id)
  );

  const error = mutationError || fetchError;

  function openForm() {
    setTitle('');
    setAssociatePersonal(false);
    setMutationError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setTitle('');
    setAssociatePersonal(false);
    setMutationError(null);
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setMutationError(null);
    try {
      await createApiKey({
        title: title.trim(),
        associatedPersonalEntityId:
          associatePersonal && personalEntity ? personalEntity.id : null,
      });
      cancelForm();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setMutationError(null);
    try {
      await deleteApiKey(id);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setDeletingId(null);
    }
  }

  if (entitiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={variants.loading.spinner.default()} />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="API Keys" description="" noIndex />
      <div className="px-4 py-4">
        <div className="mb-4 max-w-xs">
          <EntitySelector
            entities={entities}
            currentEntity={selectedEntity}
            onSelect={(entity) => {
              setSelectedEntity(entity);
              setShowForm(false);
            }}
            isLoading={entitiesLoading}
          />
        </div>

        {selectedEntity && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">API Keys</h2>
              {!showForm && (
                <button
                  type="button"
                  onClick={openForm}
                  className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Create Key
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>
            )}

            {/* Create Form */}
            {showForm && (
              <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  New API Key
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. CI Pipeline Key"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {personalEntity && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={associatePersonal}
                        onChange={e => setAssociatePersonal(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Associate with my personal account
                      </span>
                    </label>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isCreating || !title.trim()}
                      className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors"
                    >
                      {isCreating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Keys List */}
            {keysLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading API keys...</p>
            ) : visibleKeys.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No API keys for this workspace.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleKeys.map(key => (
                  <ApiKeyRow
                    key={key.id}
                    apiKey={key}
                    isPersonal={
                      personalEntity
                        ? key.associatedPersonalEntityId === personalEntity.id
                        : false
                    }
                    onDelete={() => handleDelete(key.id)}
                    isDeleting={deletingId === key.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedEntity && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a workspace to manage API keys.
          </p>
        )}
      </div>
    </>
  );
}

function ApiKeyRow({
  apiKey,
  isPersonal,
  onDelete,
  isDeleting,
}: {
  apiKey: EntityApiKeyResponse;
  isPersonal: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const maskedKey = apiKey.apiKey
    ? `${apiKey.apiKey.slice(0, 8)}${'*'.repeat(24)}`
    : '********';

  const createdAt = apiKey.createdAt
    ? new Date(apiKey.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {apiKey.title}
          </span>
          {isPersonal && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
              Personal
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">{maskedKey}</p>
        {createdAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Created {createdAt}</p>
        )}
      </div>
      <div className="ml-3 shrink-0">
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="px-2.5 py-1 text-xs rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/profile/ApiKeysPage.tsx
git commit -m "feat: create ApiKeysPage with entity selector and CRUD"
```

---

### Task 10: Wire up routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy imports for profile pages**

In `src/App.tsx`, add these lazy imports after the existing lazy imports (around line 56):

```typescript
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AccountPage = lazy(() => import('./pages/profile/AccountPage'));
const ProfileWorkspacesPage = lazy(() => import('./pages/profile/ProfileWorkspacesPage'));
const ProfileMembersPage = lazy(() => import('./pages/profile/ProfileMembersPage'));
const ProfileInvitationsPage = lazy(() => import('./pages/profile/ProfileInvitationsPage'));
const ApiKeysPage = lazy(() => import('./pages/profile/ApiKeysPage'));
```

- [ ] **Step 2: Add profile routes**

In the route tree, after the `<Route path="login" ...>` line (around line 237), add the profile routes:

```tsx
<Route
  path="profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
>
  <Route index element={<Navigate to="account" replace />} />
  <Route path="account" element={<AccountPage />} />
  <Route path="workspaces" element={<ProfileWorkspacesPage />} />
  <Route path="members" element={<ProfileMembersPage />} />
  <Route path="invitations" element={<ProfileInvitationsPage />} />
  <Route path="api-keys" element={<ApiKeysPage />} />
</Route>
```

- [ ] **Step 3: Verify the full app compiles**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run typecheck`
Expected: No type errors.

- [ ] **Step 4: Verify the dev server starts**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up profile routes in App.tsx"
```

---

### Task 11: Final verification

- [ ] **Step 1: Run full verification suite**

Run: `cd /Users/johnhuang/projects/testomniac_app && bun run verify`
Expected: typecheck + lint + format:check all pass.

- [ ] **Step 2: Fix any lint/format issues**

If lint or format issues are found, run:
```bash
cd /Users/johnhuang/projects/testomniac_app && bun run format
cd /Users/johnhuang/projects/testomniac_app && bun run lint --fix
```

Then re-run `bun run verify` to confirm.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve lint and format issues for profile feature"
```
