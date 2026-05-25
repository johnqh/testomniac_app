import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MasterDetailLayout } from '@sudobility/components';
import { ui } from '@sudobility/design';
import SEOHead from '@/components/SEOHead';
import { useSetPageConfig } from '../hooks/usePageConfig';
import { analyticsService } from '../config/analytics';

const SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'discovery-runs', label: 'Discovery Runs' },
  { id: 'pages-and-states', label: 'Pages & Page States' },
  { id: 'test-surfaces', label: 'Test Surfaces & Interactions' },
  { id: 'scaffolds-patterns', label: 'Scaffolds & Patterns' },
  { id: 'personas-scenarios', label: 'Personas & Scenarios' },
  { id: 'findings-issues', label: 'Findings & Issues' },
  { id: 'bundles-schedules', label: 'Test Bundles & Schedules' },
  { id: 'settings-credentials', label: 'Settings & Credentials' },
  { id: 'api-integrations', label: 'API & Integrations' },
];

const DOCS_CONTENT: Record<string, { title: string; paragraphs: string[] }> = {
  'getting-started': {
    title: 'Getting Started',
    paragraphs: [
      'Testomniac is an AI-powered web application testing platform that automatically discovers pages, generates test cases, detects issues, and provides comprehensive test coverage for your web applications. Instead of manually writing and maintaining test suites, Testomniac crawls your site, understands its structure, and produces actionable test interactions that cover rendering, user interactions, form submissions, navigation flows, and end-to-end scenarios.',
      'To get started, create an account and set up your first workspace from the dashboard. Each workspace can contain multiple discovery runs targeting different URLs or environments. Once you have a workspace, navigate to the scan page, enter your target URL, and Testomniac will begin a discovery run that crawls your application, captures page states, and generates tests automatically.',
      'The dashboard provides a centralized view of all your discovery runs, pages, test surfaces, findings, and more. Use the sidebar navigation to explore different aspects of your test results. Each run produces a comprehensive analysis of your application that you can review, filter, and act on.',
    ],
  },
  'discovery-runs': {
    title: 'Discovery Runs',
    paragraphs: [
      'A discovery run is the core operation in Testomniac. To start one, navigate to the scan page and enter the URL of the web application you want to test. Testomniac will crawl your site starting from that URL, following links and discovering pages across your application. During the crawl, it captures screenshots, records HTML snapshots, identifies interactive elements, and maps the overall site structure.',
      'As the run progresses, you can monitor it in real time on the scan progress page. The progress panel shows live counters for discovered pages, generated test interactions, detected scaffolds, and identified issues. An event log streams real-time updates so you can see exactly what Testomniac is doing at each step. The run proceeds through distinct phases including crawling, element extraction, scaffold detection, pattern recognition, and test generation.',
      'Once a run completes, all results are available from the run details page. You can view discovered pages, generated test surfaces and interactions, detected scaffolds and patterns, AI-generated personas, and any findings or issues. Each run is self-contained and provides a complete snapshot of your application at the time it was scanned. You can compare runs over time to track how your application evolves.',
    ],
  },
  'pages-and-states': {
    title: 'Pages & Page States',
    paragraphs: [
      'Testomniac discovers pages by crawling your application and following navigation paths. Each discovered page is catalogued with its URL, title, and metadata. Pages can be viewed in a list format for quick browsing or as an interactive graph visualization on the map page, which shows how pages are connected through links and navigation flows.',
      'Every page can have multiple page states representing different viewport configurations such as desktop and mobile. Each page state captures a screenshot, an HTML snapshot, and a detailed element inventory listing all interactive and visible elements on the page. This multi-state approach ensures that responsive design issues are caught and that tests cover both desktop and mobile experiences.',
      'From the page detail view, you can inspect individual page states, review the captured screenshots side by side, and drill into the element inventory to see exactly what Testomniac detected. The element inventory includes buttons, links, form fields, images, headings, and other semantic elements. This data feeds into test generation and scaffold detection, forming the foundation for all downstream analysis.',
    ],
  },
  'test-surfaces': {
    title: 'Test Surfaces & Interactions',
    paragraphs: [
      'Test surfaces are logical groupings of related test interactions. They organize tests by the area of your application they cover, making it easy to understand test coverage at a glance. For example, a login page might have a test surface containing interactions for valid login, invalid credentials, empty form submission, and password reset navigation.',
      'Test interactions are individual test cases generated by Testomniac. Each interaction defines a sequence of steps and expected outcomes. Interactions are categorized by type: render tests verify that page elements appear correctly, interaction tests exercise buttons and clickable elements, form tests validate input fields and form submissions, navigation tests check link destinations and routing, and end-to-end tests cover multi-step user flows across pages.',
      'You can filter test interactions by type, priority level, and target device (desktop or mobile). Each interaction includes detailed steps describing the actions to perform and the assertions to check. From the test interaction detail page, you can review the full test specification, see which page and elements it targets, and track its execution results across test runs.',
    ],
  },
  'scaffolds-patterns': {
    title: 'Scaffolds & Patterns',
    paragraphs: [
      "Scaffolds are reusable UI components that Testomniac detects across multiple pages of your application. Common scaffolds include navigation bars, footers, sidebars, breadcrumbs, headers, and other structural elements that appear consistently throughout your site. Identifying scaffolds helps Testomniac avoid generating redundant tests and provides insight into your application's component architecture.",
      'Patterns are recurring UI design conventions detected within your pages, such as card layouts, data tables, form groups, modal dialogs, dropdown menus, tab panels, and accordion sections. Pattern detection helps Testomniac understand the semantic purpose of page regions and generate more meaningful test interactions that align with how users actually interact with these common interface elements.',
      'Both scaffolds and patterns are accessible from the dashboard sidebar. The scaffolds page lists all detected components with the pages where they appear, while the patterns page shows design conventions and their frequency across your application. Together, they give you a structural map of your UI that complements the page-level view.',
    ],
  },
  'personas-scenarios': {
    title: 'Personas & Scenarios',
    paragraphs: [
      "Personas are AI-generated user profiles that represent different types of users who might interact with your application. Testomniac analyzes your application's pages, forms, and interaction patterns to create realistic personas with distinct characteristics, goals, and behaviors. Each persona can have associated use cases and input values that define how that user type would fill out forms and navigate your application.",
      'Test scenarios define multi-step test sequences that simulate real user journeys through your application. Scenarios are built on top of personas and chain together multiple test interactions into coherent workflows. For example, a scenario might simulate a new user signing up, completing onboarding, creating their first project, and inviting a team member, all using input values appropriate to the assigned persona.',
      'By combining personas with scenarios, Testomniac generates tests that go beyond isolated element checks and validate the complete user experience. This approach catches issues that only surface during realistic usage patterns, such as state management bugs, navigation dead ends, or form validation gaps that appear when fields are filled in a particular order.',
    ],
  },
  'findings-issues': {
    title: 'Findings & Issues',
    paragraphs: [
      'Testomniac automatically detects errors, warnings, and potential problems during discovery runs and test execution. Findings are categorized by expertise area, such as accessibility, performance, usability, security, and functionality. Each finding includes a description of the issue, the affected page or element, and a priority level indicating its severity.',
      'Priority levels range from crash (application-breaking errors) through critical (severe functional problems), major (significant issues affecting user experience), and minor (small defects or inconsistencies), down to suggestion (improvement recommendations). This prioritization helps you focus on the most impactful issues first and plan your remediation efforts effectively.',
      'The findings list page provides filtering by priority, expertise area, and associated page. You can drill into individual findings to see detailed context including screenshots, element references, and reproduction steps. Findings are linked back to the pages and test interactions where they were detected, making it straightforward to trace an issue to its source and verify that your fix resolves it.',
    ],
  },
  'bundles-schedules': {
    title: 'Test Bundles & Schedules',
    paragraphs: [
      'Test bundles let you group test surfaces and their interactions into organized collections for targeted execution. Instead of running all tests every time, you can create bundles that focus on specific areas of your application, such as a checkout flow bundle, an authentication bundle, or a content management bundle. This makes test execution faster and results easier to review.',
      'From the bundle detail page, you can see which test surfaces are included, review the total number of interactions, and trigger a test run for just that bundle. Bundles can be updated as your application evolves, adding new test surfaces from recent discovery runs or removing obsolete ones.',
      'Schedules allow you to configure recurring test runs with a defined frequency. You can schedule bundles or full test suites to run daily, weekly, or at custom intervals. Scheduled runs execute automatically and produce results that you can review from the test runs page. This ensures continuous test coverage without manual intervention and helps catch regressions as soon as they are introduced.',
    ],
  },
  'settings-credentials': {
    title: 'Settings & Credentials',
    paragraphs: [
      'Workspace settings let you configure your testing environment, manage team members, and control access through invitations. From the settings page, you can update workspace details, configure default test parameters, and manage environment-level settings that apply to all runs within the workspace.',
      'For applications that require authentication, Testomniac supports test credentials that allow discovery runs to access protected pages. You can configure credentials for multiple authentication providers including email and password, Google, Apple, Microsoft, and other OAuth providers. Credentials are stored securely and used during crawling to log in and discover pages behind authentication walls.',
      'Team collaboration is managed through the members and invitations pages. Workspace owners can invite team members by email, assign roles, and manage permissions. All team members share access to discovery runs, test results, and findings within the workspace, enabling collaborative testing workflows across your organization.',
    ],
  },
  'api-integrations': {
    title: 'API & Integrations',
    paragraphs: [
      'Testomniac exposes a REST API that provides programmatic access to all platform features. You can use the API to trigger discovery runs, retrieve test results, query findings, and manage workspaces without using the web interface. The API follows RESTful conventions with JSON request and response bodies, and requires authentication via your account credentials.',
      'Test results from Testomniac can be integrated into your CI/CD pipelines to enforce quality gates before deployments. By calling the API from your build scripts or pipeline configurations, you can automatically run tests against staging environments and fail the build if critical issues are detected. This shifts testing left in your development workflow and prevents regressions from reaching production.',
      'The API client SDK (@sudobility/testomniac_client) provides typed functions and TanStack Query hooks for interacting with the Testomniac API from JavaScript and TypeScript applications. The SDK handles authentication, request formatting, response parsing, and cache management, making it straightforward to build custom dashboards, reporting tools, or automation scripts on top of the Testomniac platform.',
    ],
  },
};

/**
 * Documentation page with sidebar navigation covering the core features
 * and concepts of the Testomniac AI-powered web testing platform.
 */
export default function DocsPage() {
  const { t } = useTranslation('common');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileView, setMobileView] = useState<'navigation' | 'content'>('navigation');

  useSetPageConfig({ scrollable: false, contentPadding: 'sm', maxWidth: '7xl' });

  useEffect(() => {
    analyticsService.trackPageView('/docs', 'Docs');
  }, []);

  const doc = DOCS_CONTENT[activeSection] || DOCS_CONTENT['getting-started'];

  const masterContent = (
    <ul className="space-y-1" role="tablist" aria-orientation="vertical">
      {SECTIONS.map(section => (
        <li key={section.id} role="presentation">
          <button
            role="tab"
            aria-selected={activeSection === section.id}
            aria-controls="docs-content"
            onClick={() => {
              analyticsService.trackButtonClick('docs_section', { section: section.id });
              setActiveSection(section.id);
              setMobileView('content');
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm ${ui.transition.default} ${
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
  );

  const detailContent = (
    <div id="docs-content" role="tabpanel" aria-label={doc.title}>
      <h2 className="text-2xl font-semibold text-theme-text-primary mb-6">{doc.title}</h2>
      <div className="space-y-4">
        {doc.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-theme-text-secondary leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full min-w-0 overflow-x-hidden flex-1 flex flex-col min-h-0">
      <SEOHead title={t('seo.docs.title')} description={t('seo.docs.description')} />
      <MasterDetailLayout
        masterTitle={t('docs.title')}
        masterContent={masterContent}
        detailContent={detailContent}
        detailTitle={doc.title}
        mobileView={mobileView}
        onBackToNavigation={() => setMobileView('navigation')}
        masterWidth={220}
        stickyMaster
      />
    </div>
  );
}
