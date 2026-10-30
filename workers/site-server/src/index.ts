import { isValidSlug, slugFromHost } from '@akox/core/slug';
import { contentTypeFor } from '@akox/core/mime';

export interface Env {
  /** e.g. "akox.in" */
  SITE_DOMAIN: string;
  /** e.g. "https://akox.in" */
  APP_ORIGIN: string;
  SUPABASE_URL: string;
  /** The PUBLIC (anon / publishable) key. Never the secret key. */
  SUPABASE_ANON_KEY: string;
}

type Pointer = { kind: 'ok'; id: string; version: string } | { kind: 'none' } | { kind: 'suspended' };

const POINTER_TTL = 30;
const EDGE_TTL = 'public, max-age=86400';
const CACHE_MAX_BYTES = 5 * 1024 * 1024;

/**
 * The sandbox directive gives every portfolio page an opaque origin, so its
 * JavaScript cannot read AKOX login data even though it lives on *.akox.in.
 */
function securityHeaders(env: Env): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Access-Control-Allow-Origin': '*',
    'Content-Security-Policy': [
      'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals',
      "default-src 'self' data: blob: https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
      `frame-ancestors 'self' ${env.APP_ORIGIN}`,
    ].join('; '),
  };
}

const browserCacheControl = (type: string): string =>
  type.startsWith('text/html')
    ? 'public, max-age=0, must-revalidate'
    : 'public, max-age=300, stale-while-revalidate=3600';

function page(env: Env, status: number, title: string, message: string): Response {
  const h = new Headers(securityHeaders(env));
  h.set('Content-Type', 'text/html; charset=utf-8');
  h.set('Cache-Control', 'no-store');
  const body = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#222"><main style="text-align:center;padding:24px"><h1 style="font-size:1.4rem">${title}</h1><p>${message}</p></main></body></html>`;
  return new Response(body, { status, headers: h });
}

/** Normal: slug.akox.in. Test mode on *.workers.dev: /slug/... */
function parseTarget(url: URL, env: Env): { slug: string; path: string; basePath: string } | null {
  const host = url.hostname.toLowerCase();
  const slug = slugFromHost(host, env.SITE_DOMAIN);
  if (slug) return { slug, path: url.pathname, basePath: '' };
  if (host.endsWith('.workers.dev')) {
    const m = /^\/([a-z0-9-]+)(\/.*)?$/.exec(url.pathname);
    const first = m?.[1];
    if (first && isValidSlug(first)) return { slug: first, path: m[2] ?? '/', basePath: `/${first}` };
  }
  return null;
}

/** Which live version belongs to this username? Asked of Supabase, cached for 30 seconds. */
async function lookup(slug: string, env: Env, ctx: ExecutionContext): Promise<Pointer> {
  const cache = caches.default;
  const key = new Request(`https://pointer.internal/${slug}`);
  const hit = await cache.match(key);
  if (hit) return (await hit.json()) as Pointer;

  const headers: Record<string, string> = { apikey: env.SUPABASE_ANON_KEY };
  if (!env.SUPABASE_ANON_KEY.startsWith('sb_')) headers.Authorization = `Bearer ${env.SUPABASE_ANON_KEY}`;
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?username=eq.${slug}&select=id,suspended,portfolio_sites(version)`,
    { headers },
  );
  if (!res.ok) throw new Error(`lookup failed: ${res.status}`);

  type Site = { version: string };
  const rows = (await res.json()) as { id: string; suspended: boolean; portfolio_sites: Site | Site[] | null }[];
  const row = rows[0];
  let pointer: Pointer = { kind: 'none' };
  if (row) {
    const site = Array.isArray(row.portfolio_sites) ? row.portfolio_sites[0] : row.portfolio_sites;
    if (row.suspended) pointer = { kind: 'suspended' };
    else if (site?.version) pointer = { kind: 'ok', id: row.id, version: site.version };
  }
  ctx.waitUntil(cache.put(key, Response.json(pointer, { headers: { 'Cache-Control': `public, max-age=${POINTER_TTL}` } })));
  return pointer;
}

/** URL path to candidate file paths inside the site, or null if malformed. */
function candidates(pathname: string): string[] | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (path.includes('\0') || path.includes('\\')) return null;
  const segs = path.split('/').filter(Boolean);
  if (segs.some((s) => s === '.' || s === '..' || s.startsWith('.') || s === 'Thumbs.db')) return null;
  const clean = segs.join('/');
  if (clean === '') return ['index.html'];
  if (path.endsWith('/')) return [`${clean}/index.html`];
  if (/\.[A-Za-z0-9]+$/.test(segs[segs.length - 1] ?? '')) return [clean];
  return [`${clean}.html`, `${clean}/index.html`];
}

async function serve(
  rel: string,
  p: { id: string; version: string },
  basePath: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  status = 200,
): Promise<Response | null> {
  // Supabase labels HTML as text/plain, so we always set the type ourselves from the file name.
  const type = contentTypeFor(rel);
  if (!type) return null;
  const objectPath = `${p.id}/${p.version}/${rel}`.split('/').map(encodeURIComponent).join('/');
  const upstream = `${env.SUPABASE_URL}/storage/v1/object/public/sites/${objectPath}`;

  const headers = new Headers(securityHeaders(env));
  headers.set('Content-Type', type);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', browserCacheControl(type));
  const isHead = request.method === 'HEAD';

  const range = status === 200 ? request.headers.get('Range') : null;
  if (range) {
    const up = await fetch(upstream, { headers: { Range: range } });
    if (!up.ok) return null;
    for (const name of ['Content-Range', 'Content-Length']) {
      const v = up.headers.get(name);
      if (v) headers.set(name, v);
    }
    return new Response(isHead ? null : up.body, { status: up.status, headers });
  }

  const cache = caches.default;
  const cacheKey = new Request(upstream);
  let source: Response | undefined = status === 200 ? await cache.match(cacheKey) : undefined;
  if (!source) {
    const up = await fetch(upstream);
    if (!up.ok || !up.body) return null;
    const size = Number(up.headers.get('Content-Length') ?? 0);
    if (status === 200 && size > 0 && size <= CACHE_MAX_BYTES) {
      const [toClient, toCache] = up.body.tee();
      ctx.waitUntil(cache.put(cacheKey, new Response(toCache, { headers: { 'Cache-Control': EDGE_TTL } })));
      source = new Response(toClient);
    } else {
      source = new Response(up.body);
    }
  }

  if (type.startsWith('text/html') && basePath && !isHead) {
    const html = await source.text();
    const tag = `<base href="${basePath}/">`;
    const out = /<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${tag}`) : tag + html;
    return new Response(out, { status, headers });
  }
  return new Response(isHead ? null : source.body, { status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } });
    }
    const target = parseTarget(new URL(request.url), env);
    if (!target) return page(env, 404, 'Not found', 'This address does not point to a portfolio.');

    let pointer: Pointer;
    try {
      pointer = await lookup(target.slug, env, ctx);
    } catch {
      return page(env, 503, 'Temporarily unavailable', 'Please try again in a minute.');
    }
    if (pointer.kind === 'suspended') return page(env, 403, 'Portfolio unavailable', 'This portfolio has been suspended.');
    if (pointer.kind === 'none') return page(env, 404, 'No portfolio here', 'Nobody has published at this address yet.');

    const rels = candidates(target.path);
    if (!rels) return page(env, 400, 'Bad request', 'That URL is not valid.');
    for (const rel of rels) {
      const res = await serve(rel, pointer, target.basePath, request, env, ctx);
      if (res) return res;
    }
    const custom404 = await serve('404.html', pointer, target.basePath, request, env, ctx, 404);
    return custom404 ?? page(env, 404, 'Page not found', 'This portfolio has no such page.');
  },
} satisfies ExportedHandler<Env>;