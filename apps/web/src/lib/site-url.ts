/** Where a person's published portfolio lives. Locally and in production it is the same live address. */
const DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'akox.in';

export const siteUrl = (username: string): string => `https://${username}.${DOMAIN}/`;
