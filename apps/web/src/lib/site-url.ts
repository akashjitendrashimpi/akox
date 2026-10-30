/** Where a person's published portfolio lives. Locally and in production it is the same live address. */
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'akox.in';

/** Returns the fully qualified hostname for a portfolio, e.g. "akash.akox.in" */
export function siteHostname(username?: string): string {
  if (!username) return SITE_DOMAIN;
  return `${username.toLowerCase()}.${SITE_DOMAIN}`;
}

/** Returns the live URL for a portfolio */
export function siteUrl(username: string): string {
  return `https://${siteHostname(username)}/`;
}

/** Suffix for display, e.g. ".akox.in" */
export const SITE_SUFFIX = `.${SITE_DOMAIN}`;
