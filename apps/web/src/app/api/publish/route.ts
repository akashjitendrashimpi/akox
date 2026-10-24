import { BundleError, LIMITS, extractBundle, uploadBundle, type Bundle } from '@akox/core';
import { COOLDOWN_SECONDS, DAILY_LIMIT } from '../../../lib/limits';
import { serviceClient, userFrom } from '../../../lib/server-auth';
import { supabaseStore } from '../../../lib/storage';

export const runtime = 'nodejs';

const json = (body: object, status = 200): Response => Response.json(body, { status });

export async function POST(req: Request): Promise<Response> {
  const sb = serviceClient();
  if (!sb) return json({ error: 'Server is not set up: the secret key is missing.' }, 500);
  const user = await userFrom(req, sb);
  if (!user) return json({ error: 'Please log in again.' }, 401);

  const { data: profile } = await sb.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (!profile) return json({ error: 'Choose your address first.' }, 400);

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

  if (Number(req.headers.get('content-length') ?? 0) > LIMITS.maxZipBytes) {
    return json({ error: 'The zip is too large.' }, 413);
  }
  let bundle: Bundle;
  try {
    bundle = extractBundle(new Uint8Array(await req.arrayBuffer()));
  } catch (e) {
    return json({ error: e instanceof BundleError ? e.message : 'Could not read that zip.' }, 400);
  }

  const store = supabaseStore(sb);
  const version = Date.now().toString(36);
  const prefix = `${user.id}/${version}/`;
  try {
    await uploadBundle(bundle, prefix, store);
  } catch {
    return json({ error: 'Upload failed. Please try again.' }, 500);
  }

  const { data: old } = await sb.from('portfolio_sites').select('version, previous_version')
    .eq('owner_id', user.id).maybeSingle();
  const { error } = await sb.from('portfolio_sites').upsert({
    owner_id: user.id, version, previous_version: old?.version ?? null,
    file_count: bundle.files.length, total_bytes: bundle.totalBytes, updated_at: new Date().toISOString(),
  });
  if (error) {
    await store.deletePrefix(prefix).catch(() => undefined);
    return json({ error: 'Could not save your site. Please try again.' }, 500);
  }
  if (old?.previous_version) await store.deletePrefix(`${user.id}/${String(old.previous_version)}/`).catch(() => undefined);
  await sb.from('publish_log').insert({ owner_id: user.id });
  return json({ ok: true, left: DAILY_LIMIT - used - 1 });
}