/**
 * SEO configuration for Testomniac.
 *
 * Used by generate-seo-assets.mjs from @johnqh/workflows to produce
 * per-route localized index.html files, sitemap.xml, and robots.txt.
 */

import { config } from 'dotenv';
config();

const APP_NAME = process.env.VITE_APP_NAME || 'Testomniac';
const APP_DOMAIN = process.env.VITE_APP_DOMAIN || 'localhost';

export default {
  supportedLanguages: [
    'en', 'de', 'es', 'fr', 'it', 'ja', 'ko',
    'pt', 'ru', 'sv', 'th', 'uk', 'vi', 'zh', 'zh-hant',
  ],

  languageHreflangMap: {
    en: 'en',
    de: 'de',
    es: 'es',
    fr: 'fr',
    it: 'it',
    ja: 'ja',
    ko: 'ko',
    pt: 'pt',
    ru: 'ru',
    sv: 'sv',
    th: 'th',
    uk: 'uk',
    vi: 'vi',
    zh: 'zh-Hans',
    'zh-hant': 'zh-Hant',
  },

  primaryDomain: APP_DOMAIN,
  appName: APP_NAME,
  appDomain: APP_DOMAIN,
  robotsDisallowPaths: ['/*/dashboard/', '/*/login'],

  routes: [
    {
      key: 'home',
      path: '',
      namespace: 'common',
      priority: '1.0',
      changefreq: 'weekly',
      indexable: true,
      meta: locale => ({
        title: locale.common.seo.home.title,
        description: locale.common.seo.home.description,
        keywords: locale.common.seo.home.keywords || [],
      }),
    },
    {
      key: 'docs',
      path: '/docs',
      namespace: 'common',
      priority: '0.8',
      changefreq: 'monthly',
      indexable: true,
      meta: locale => ({
        title: locale.common.seo.docs.title,
        description: locale.common.seo.docs.description,
        keywords: [],
      }),
    },
    {
      key: 'dashboard',
      path: '/dashboard',
      namespace: 'common',
      priority: '0.1',
      changefreq: 'monthly',
      indexable: false,
      meta: () => ({
        title: `Dashboard - ${APP_NAME}`,
        description: '',
        keywords: [],
      }),
    },
    {
      key: 'settings',
      path: '/settings',
      namespace: 'common',
      priority: '0.1',
      changefreq: 'monthly',
      indexable: false,
      meta: locale => ({
        title: `${locale.common.breadcrumbs?.settings || 'Settings'} - ${APP_NAME}`,
        description: '',
        keywords: [],
      }),
    },
    {
      key: 'sitemap',
      path: '/sitemap',
      namespace: 'common',
      priority: '0.1',
      changefreq: 'monthly',
      indexable: false,
      meta: locale => ({
        title: locale.common.seo.sitemap.title,
        description: locale.common.seo.sitemap.description,
        keywords: [],
      }),
    },
    {
      key: 'login',
      path: '/login',
      namespace: 'common',
      priority: '0.1',
      changefreq: 'monthly',
      indexable: false,
      meta: locale => ({
        title: locale.common.seo.login.title,
        description: locale.common.seo.login.description,
        keywords: [],
      }),
    },
  ],
};
