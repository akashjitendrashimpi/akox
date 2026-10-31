/** One place for the brand's words and facts. Change them here, not in components. */
export const BRAND = {
  name: 'Akox',
  domain: 'akox.in',
  url: 'https://akox.in',
  headline: 'A website with your name on it.',
  tagline: 'Your name. Your address.',
  status: 'Free during early access',
  /** Placeholder until a real mailbox exists. Set NEXT_PUBLIC_CONTACT_EMAIL to override. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@akox.in',
  /** Operator details for the legal pages. Fill in before launch. */
  operator: process.env.NEXT_PUBLIC_OPERATOR || '[legal entity, city, India]',
  grievanceOfficer: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER || '[name, email, address]',
} as const;

/**
 * The legal pages are plain-language drafts. While this is false each one shows a visible
 * "draft, pending legal review" notice. Set it to true only after a lawyer has signed off.
 */
export const LEGAL_REVIEWED = false;

export const LEGAL_UPDATED = '30 October 2026';

export const SHARE = {
  title: 'Akox: a website with your name on it',
  description: 'Get yourname.akox.in. Fill a short form or upload your own site, AI-made code included. Made in India. Free during early access.',
  ogTitle: 'A website with your name on it.',
  ogDescription: 'Your name, your address. Fill a short form or upload your own site. Free during early access.',
} as const;
