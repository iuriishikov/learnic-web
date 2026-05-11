import { z } from 'zod';

import { SOCIAL_LINK_KINDS } from './types';

/**
 * Length caps mirror
 * `learnic/src/learnic/entities/user/constants.py`. Repeating them
 * here lets the form reject obvious garbage before a round-trip;
 * the backend still re-validates via the matching VO.
 */
export const WEBSITE_URL_MAX = 2_048;
export const PORTFOLIO_URL_MAX = 2_048;
export const PUBLIC_EMAIL_MAX = 320;
export const SOCIAL_LINK_URL_MAX = 2_048;
export const SOCIAL_LINKS_MAX = 32;

const httpsScheme = /^https?:\/\//i;

export const websiteUrlSchema = z
  .string()
  .max(WEBSITE_URL_MAX, 'websiteUrlTooLong')
  .refine((v) => v === '' || httpsScheme.test(v), 'websiteUrlScheme');

export const portfolioUrlSchema = z
  .string()
  .max(PORTFOLIO_URL_MAX, 'portfolioUrlTooLong')
  .refine((v) => v === '' || httpsScheme.test(v), 'portfolioUrlScheme');

export const publicEmailSchema = z
  .string()
  .max(PUBLIC_EMAIL_MAX, 'publicEmailTooLong')
  .refine((v) => v === '' || v.includes('@'), 'publicEmailInvalid');

export const socialLinkSchema = z.object({
  kind: z.enum(SOCIAL_LINK_KINDS),
  url: z
    .string()
    .max(SOCIAL_LINK_URL_MAX, 'socialUrlTooLong')
    .refine((v) => httpsScheme.test(v), 'socialUrlScheme'),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
