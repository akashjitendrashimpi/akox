import type { SupabaseClient } from '@supabase/supabase-js';
import { limitsFor, uploadBundle, type Bundle, type Limits } from '@akox/core';
import { COOLDOWN_SECONDS, DAILY_LIMIT } from './limits';
import { serviceClient, userFrom } from './server-auth';
import { supabaseStore } from './storage';
import { checkRateLimit, getClientIp } from './rate-limit';

/** Origin verification for CSRF mitigation on state-modifying endpoints */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const host = req.headers.get('host')?.toLowerCase();
    if (host && originHost === host) return true;
    const allowedDomain = (process.env.NEXT_PUBLIC_SITE_DOMAIN || 'akox.in').toLowerCase();
    if (originHost === allowedDomain || originHost.endsWith(`.${allowedDomain}`)) return true;
    if (originHost.startsWith('localhost') || originHost.startsWith('127.0.0.1')) return true;
  } catch {
    return false;
  }
  return false;
}

/** What produced the live site: an uploaded zip (custom website) or a template. */
export type PublishKind = 'zip' | 'template';

/** Thrown by a route when the person's input is the problem. The message is shown to them. */
export class PublishInputError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const json = (body: object, status = 200): Response => Response.json(body, { status });

/**
 * The one place that decides who may publish, how often, and how a new version goes live.
 * One person has exactly one live site. Whatever is published last (template or zip) replaces it,
 * and the previous one stays available for one-click rollback.
 */
export async function runPublish(
  req: Request,
  kind: PublishKind,
  makeBundle: (limits: Limits) => Promise<Bundle>,
  /** Runs after the site is live. A failure here never undoes the publish. */
  onPublished?: (done: { userId: string; sb: SupabaseClient }) => Promise<void>,
): Promise<Response> {
  if (!validateOrigin(req)) {
    return json({ error: 'Cross-origin request rejected for security.' }, 403);
  }

  const clientIp = getClientIp(req);
  const rate = checkRateLimit(`publish:${clientIp}`, 30, 60_000);
  if (!rate.ok) {
    return json({ error: 'Too many requests. Please wait a moment.' }, 429);
  }

  const sb = serviceClient();
  if (!sb) return json({ error: 'Server is not set up: the secret key is missing.' }, 500);
  const user = await userFrom(req, sb);
  if (!user) return json({ error: 'Please log in again.' }, 401);

  const { data: profile } = await sb.from('profiles').select('id, plan').eq('id', user.id).maybeSingle();
  if (!profile) return json({ error: 'Choose your address first.' }, 400);
  const limits = limitsFor(String(profile.plan ?? 'free'));

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await sb.from('publish_log').select('created_at')
    .eq('owner_id', user.id).gte('created_at', since).order('created_at', { ascending: false });
  const used = recent?.length ?? 0;
  if (used >= DAILY_LIMIT) {
    return json({ error: `Daily limit reached: ${DAILY_LIMIT} uploads per 24 hours. Try again later.` }, 429);
  }
  const last = recent?.[0]?.created_at;
  if (last && Date.now() - new Date(String(last)).getTime() < COOLDOWN_SECONDS * 1000) {
    return json({ error: 'Please wait a minute between uploads.' }, 429);
  }

  let bundle: Bundle;
  try {
    bundle = await makeBundle(limits);
  } catch (e) {
    if (e instanceof PublishInputError) return json({ error: e.message }, e.status);
    return json({ error: 'Could not read your upload.' }, 400);
  }

  const store = supabaseStore(sb);
  const version = Date.now().toString(36);
  const prefix = `${user.id}/${version}/`;
  try {
    await uploadBundle(bundle, prefix, store);
  } catch {
    return json({ error: 'Upload failed. Please try again.' }, 500);
  }

  const { data: old } = await sb.from('portfolio_sites')
    .select('version, previous_version, total_bytes, file_count, kind').eq('owner_id', user.id).maybeSingle();
  const { error } = await sb.from('portfolio_sites').upsert({
    owner_id: user.id, version, previous_version: old?.version ?? null,
    file_count: bundle.files.length, total_bytes: bundle.totalBytes,
    previous_bytes: Number(old?.total_bytes ?? 0), previous_file_count: Number(old?.file_count ?? 0),
    kind, previous_kind: old?.kind ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    await store.deletePrefix(prefix).catch(() => undefined);
    return json({ error: 'Could not save your site. Please try again.' }, 500);
  }
  if (old?.previous_version) {
    await store.deletePrefix(`${user.id}/${String(old.previous_version)}/`).catch(() => undefined);
  }
  await sb.from('publish_log').insert({ owner_id: user.id });
  if (onPublished) await onPublished({ userId: user.id, sb }).catch(() => undefined);
  return json({ ok: true, left: DAILY_LIMIT - used - 1, kind });
}
