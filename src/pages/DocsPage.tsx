import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../components/layout/ScreenContainer';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'starter_types', label: 'starter_types' },
  { id: 'starter_api', label: 'starter_api' },
  { id: 'starter_client', label: 'starter_client' },
  { id: 'starter_lib', label: 'starter_lib' },
  { id: 'starter_app', label: 'starter_app' },
  { id: 'starter_app_rn', label: 'starter_app_rn' },
];

const DOCS_CONTENT: Record<string, { title: string; content: string }> = {
  overview: {
    title: 'Overview',
    content:
      'This starter project demonstrates the Sudobility architecture pattern. It consists of 6 interconnected packages that show how to build a full-stack application with shared types, a Hono backend, TanStack Query client hooks, Zustand business logic, a React web app, and a React Native mobile app.',
  },
  starter_types: {
    title: '@sudobility/testomniac_types',
    content:
      'Shared TypeScript type definitions used by both frontend and backend. Defines User, History, HistoryCreateRequest, HistoryUpdateRequest, and HistoryTotalResponse types. Also includes successResponse() and errorResponse() helper functions for consistent API responses.',
  },
  starter_api: {
    title: 'starter_api',
    content:
      'Hono-based REST API with PostgreSQL + Drizzle ORM. Provides CRUD endpoints for history records under /api/v1/users/:userId/histories (auth required) and a public /api/v1/histories/total endpoint. Uses Firebase Admin SDK for authentication via @sudobility/auth_service.',
  },
  starter_client: {
    title: '@sudobility/testomniac_client',
    content:
      'Frontend client library with a StarterClient class for HTTP requests and TanStack Query hooks (useHistories, useHistoriesTotal, useHistoryMutations) for automatic caching and cache invalidation. Uses the NetworkClient dependency injection pattern from @sudobility/types.',
  },
  starter_lib: {
    title: '@sudobility/testomniac_lib',
    content:
      "Business logic library with a Zustand store (useHistoriesStore) for offline cache and a manager hook (useHistoriesManager) that wraps the client hooks. Calculates the user's percentage contribution (userSum / total * 100) and provides a unified interface for CRUD operations.",
  },
  starter_app: {
    title: 'starter_app',
    content:
      'React 19 web application built with Vite and Tailwind CSS. Features i18n support for 16 languages, Firebase authentication, and pages for browsing histories, documentation, and settings. Uses @sudobility/building_blocks for the top bar, login, and settings components.',
  },
  starter_app_rn: {
    title: 'starter_app_rn',
    content:
      'React Native mobile application built with Expo. Features bottom tab navigation with Histories and Settings tabs, Firebase authentication via the JS SDK, and theme switching. Uses the same starter_client and starter_lib packages as the web app.',
  },
};

/**
 * Documentation page with a sidebar navigation showing information
 * about each package in the Starter project ecosystem.
 */
export default function DocsPage() {
  const { t } = useTranslation('common');
  const [activeSection, setActiveSection] = useState('overview');

  const doc = DOCS_CONTENT[activeSection] || DOCS_CONTENT.overview;

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-theme-text-primary mb-8">{t('docs.title')}</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <nav className="md:w-56 shrink-0" aria-label="Documentation sections">
            <ul className="space-y-1" role="tablist" aria-orientation="vertical">
              {SECTIONS.map(section => (
                <li key={section.id} role="presentation">
                  <button
                    role="tab"
                    aria-selected={activeSection === section.id}
                    aria-controls="docs-content"
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                        : 'text-theme-text-secondary hover:bg-theme-hover-bg'
                    }`}
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div id="docs-content" role="tabpanel" aria-label={doc.title} className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold text-theme-text-primary mb-4">{doc.title}</h2>
            <p className="text-theme-text-secondary leading-relaxed">{doc.content}</p>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}
