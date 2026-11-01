import { createHash, randomBytes } from 'node:crypto';
import { isValidSlug } from '@akox/core';
import { serviceClient } from '../../../lib/server-auth';

export const runtime = 'nodejs';

const REASONS: readonly string[] = [
  'Scam or fake login page',
  'Pretends to be someone',
  'Harassment or hate',
  'Sexual content or child safety',
  'My work was copied',
  'Malware',
  'Private information',
  'Something else',
];
const PER_HOUR = 5;
const DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'akox.in';
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

const json = (body: object, status = 200): Response => Response.json(body, { status });

function clientIp(req: Request): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/** "name.akox.in", "https://name.akox.in/x" or "akox.in/u/name" give "name"; anything else gives null. */
function usernameFrom(address: string): string | null {
  const bare = address.toLowerCase().replace(/^https?:\/\//, '');
  const host = bare.split(/[/?#]/)[0] ?? '';
  const suffix = `.${DOMAIN}`;
  if (host.endsWith(suffix)) {
    const label = host.slice(0, -suffix.length);
    return isValidSlug(label) ? label : null;
  }
  const m = new RegExp(`^(?:www\\.)?${DOMAIN.replace(/\./g, '\\.')}/u/([a-z0-9-]+)`).exec(bare);
  return m?.[1] && isValidSlug(m[1]) ? m[1] : null;
}

async function captchaOk(token: unknown, ip: string): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true; // no bot check configured (local development)
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || typeof token !== 'string' || token === '') return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip !== 'unknown') form.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

function newReference(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  return 'R-' + Array.from(randomBytes(6), (b) => alphabet[b % 32]).join('');
}

/** Best effort. Returns true only if the mail service accepted the message. */
async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `Reports <noreply@${DOMAIN}>`, to, subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<Response> {
  const sb = serviceClient();
  if (!sb) return json({ error: 'Server is not set up: the secret key is missing.' }, 500);
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !process.env.TURNSTILE_SECRET_KEY) {
    return json({ error: 'Server is not set up: TURNSTILE_SECRET_KEY is missing.' }, 500);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (typeof raw !== 'object' || raw === null) return json({ error: 'Invalid request.' }, 400);
  const b = raw as Record<string, unknown>;
  const address = typeof b.address === 'string' ? b.address.trim() : '';
  const reason = typeof b.reason === 'string' ? b.reason : '';
  const details = typeof b.details === 'string' ? b.details.trim() : '';
  const email = typeof b.email === 'string' ? b.email.trim() : '';

  if (address.length < 3 || address.length > 120) return json({ error: 'Please enter the address of the site.' }, 400);
  if (!REASONS.includes(reason)) return json({ error: 'Please choose what is wrong.' }, 400);
  if (details.length < 10 || details.length > 1000) return json({ error: 'Details must be 10 to 1000 characters.' }, 400);
  if (email && (email.length > 254 || !EMAIL_RE.test(email))) return json({ error: 'That email address does not look right.' }, 400);

  const ip = clientIp(req);
  if (!(await captchaOk(b.captchaToken, ip))) return json({ error: 'The bot check failed. Please try again.' }, 400);

  // Only a salted hash of the address is stored, and only to limit abuse.
  const salt = process.env.REPORT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const ipHash = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await sb.from('abuse_reports').select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash).gte('created_at', since);
  if ((count ?? 0) >= PER_HOUR) return json({ error: 'Too many reports from this connection. Please try again later.' }, 429);

  const reference = newReference();
  const { error } = await sb.from('abuse_reports').insert({
    reference, site_address: address, username: usernameFrom(address), reason, details,
    reporter_email: email || null, ip_hash: ipHash,
  });
  if (error) return json({ error: 'Could not save your report. Please email us instead.' }, 500);

  const notifyTo = process.env.REPORT_NOTIFY_EMAIL;
  const [, emailed] = await Promise.all([
    notifyTo
      ? sendMail(notifyTo, `[REPORT ${reference}] ${reason}`,
          `Reference: ${reference}\nSite: ${address}\nReason: ${reason}\nReporter email: ${email || '(none)'}\n\n${details}\n\nReview it in Supabase: abuse_reports.`)
      : Promise.resolve(false),
    email
      ? sendMail(email, `We received your report ${reference}`,
          `Thank you. We received your report (reference ${reference}) about ${address}.\nWe review every report and will act under our rules. Keep this reference if you write to us about it.`)
      : Promise.resolve(false),
  ]);
  return json({ ok: true, reference, emailed: Boolean(email) && emailed });
}
