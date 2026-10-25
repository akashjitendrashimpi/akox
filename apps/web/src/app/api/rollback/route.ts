import { serviceClient, userFrom } from '../../../lib/server-auth';

export const runtime = 'nodejs';

const json = (body: object, status = 200): Response => Response.json(body, { status });

export async function POST(req: Request): Promise<Response> {
  const sb = serviceClient();
  if (!sb) return json({ error: 'Server is not set up: the secret key is missing.' }, 500);
  const user = await userFrom(req, sb);
  if (!user) return json({ error: 'Please log in again.' }, 401);

  const { data: s } = await sb.from('portfolio_sites')
    .select('version, previous_version, total_bytes, file_count, previous_bytes, previous_file_count')
    .eq('owner_id', user.id).maybeSingle();
  if (!s?.previous_version) return json({ error: 'There is no earlier version to go back to.' }, 400);
  const { error } = await sb.from('portfolio_sites').update({
    version: s.previous_version, previous_version: s.version,
    total_bytes: s.previous_bytes, previous_bytes: s.total_bytes,
    file_count: s.previous_file_count, previous_file_count: s.file_count,
    updated_at: new Date().toISOString(),
  }).eq('owner_id', user.id);
  return error ? json({ error: 'Could not switch versions.' }, 500) : json({ ok: true });
}