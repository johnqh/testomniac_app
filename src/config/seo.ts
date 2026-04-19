import type { SEOConfig } from '@sudobility/seo_lib';
import { CONSTANTS } from './constants';

export const seoConfig: SEOConfig = {
  appName: CONSTANTS.APP_NAME,
  baseUrl: `https://${CONSTANTS.APP_DOMAIN}`,
  defaultDescription: `${CONSTANTS.APP_NAME} by ${CONSTANTS.COMPANY_NAME}`,
  defaultOgImage: `https://${CONSTANTS.APP_DOMAIN}/og-image.png`,
  defaultTwitterSite: CONSTANTS.TWITTER_HANDLE ? `@${CONSTANTS.TWITTER_HANDLE}` : undefined,
};
