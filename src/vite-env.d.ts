/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;

  // API
  readonly VITE_API_URL: string;

  // Branding
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_DOMAIN: string;
  readonly VITE_COMPANY_NAME: string;
  readonly VITE_SUPPORT_EMAIL: string;

  // SEO
  readonly VITE_TWITTER_HANDLE: string;

  // Feature Flags
  readonly VITE_DEV_MODE: string;
  readonly VITE_SHOW_PERFORMANCE_MONITOR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
