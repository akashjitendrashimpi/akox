import { createClient } from '@supabase/supabase-js';
import { contentTypeFor } from '@akox/core';

export const dynamic = 'force-dynamic';

const miss = (): Response => new Response('Site not found', { status: 404 });

function candidates(base: string, segs: string[], slash: boolean): string[] {
  const clean = segs.join('/');
  if (clean === '') return [`${base}index.html`];
  if (slash) return [`${base}${clean}/index.html`];
  if (/\.[A-Za-z0-9]+$/.test(segs[segs.length - 1] ?? '')) return [`${base}${clean}`];
  return [`${base}${clean}.html`, `${base}${clean}/index.html`];
}

export async function GET(req: Request, ctx: { params: Promise<{ username: string; path?: string[] }> }) {
  const { username, path = [] } = await ctx.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response('Not configured', { status: 500 });
  if (path.some((s) => s === '.' || s === '..' || s.includes('\\'))) return new Response('Bad request', { status: 400 });

  const name = username.toLowerCase();
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data: prof } = await sb.from('profiles').select('id').eq('username', name).maybeSingle();
  if (!prof) return miss();
  const { data: site } = await sb.from('portfolio_sites').select('version').eq('owner_id', prof.id).maybeSingle();
  if (!site) return miss();

  const base = `${prof.id}/${site.version}/`;
  for (const k of candidates(base, path, req.url.endsWith('/'))) {
    const type = contentTypeFor(k);
    if (!type) continue;
    const res = await fetch(`${url}/storage/v1/object/public/sites/${encodeURI(k)}`);
    if (!res.ok) continue;

    let body: BodyInit | null = res.body;
    if (type.startsWith('text/html')) {
      const html = await res.text();
      const tag = `<base href="/s/${name}/">`;
      body = /<head/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${tag}`) : tag + html;
    }
    return new Response(body, {
      headers: {
        'Content-Type': type,
        'X-Content-Type-Options': 'nosniff',
        // sandbox without allow-same-origin: the site cannot touch AKOX login data.
        'Content-Security-Policy': "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals; object-src 'none'",
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  }
  return miss();
}