// 3-32 chars, lowercase letters/digits/hyphens, no leading/trailing hyphen.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'www', 'app', 'api', 'admin', 'dashboard', 'akox', 'static', 'assets', 'cdn',
  'mail', 'email', 'smtp', 'ftp', 'ns1', 'ns2', 'docs', 'blog', 'help',
  'support', 'login', 'logout', 'signin', 'signup', 'register', 'auth',
  'account', 'settings', 'explore', 'discover', 'search', 'status', 'about',
  'pricing', 'terms', 'privacy', 'security', 'abuse', 'report', 'billing',
  'root', 'null', 'undefined',
]);

export type SlugProblem = 'FORMAT' | 'RESERVED';

export function checkSlug(input: string): SlugProblem | null {
  // "--" is rejected so nobody can register punycode lookalikes (xn--...).
  if (!SLUG_RE.test(input) || input.includes('--')) return 'FORMAT';
  if (RESERVED_SLUGS.has(input)) return 'RESERVED';
  return null;
}

export const isValidSlug = (input: string): boolean => checkSlug(input) === null;

/** "akash.akox.in" + "akox.in" -> "akash". Returns null if not a valid portfolio host. */
export function slugFromHost(hostname: string, siteDomain: string): string | null {
  const host = hostname.toLowerCase();
  const suffix = '.' + siteDomain.toLowerCase();
  if (!host.endsWith(suffix)) return null;
  const label = host.slice(0, -suffix.length);
  return isValidSlug(label) ? label : null;
}
