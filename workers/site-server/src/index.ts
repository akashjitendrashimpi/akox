import { slugFromHost } from '@akox/core/slug';
import { siteRouteKey, type SiteRoute } from '@akox/core/types';

export interface Env {
  SITES_BUCKET: R2Bucket;
  SITES_KV: KVNamespace;
  /** e.g. "akox.in" */
  SITE_DOMAIN: string;
  /** e.g. "https://akox.in" */
  APP_ORIGIN: string;
}

const CACHE_MAX_BYTES = 5 * 1024 * 1024;
const EDGE_TTL = 'public, max-age=86400';

/**
 * The real isolation between user sites and the AKOX app is the separate
 * registrable domain. This CSP is defense in depth: it cannot stop user
 * code from running (that is the product), but it blocks plugins, base-tag
 * tricks and cross-site form posts (the classic fake-login phishing move).
 */
function securityHeaders(env: Env): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy': [
      "default-src 'self' data: blob: https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      `frame-ancestors 'self' ${env.APP_ORIGIN}`,
    ].join('; '),
  };
}

/**
 * Objects at one URL change when the owner redeploys, so browsers must
 * revalidate HTML; other assets get a short cache. (The edge cache below is
 * keyed by version prefix, so a redeploy invalidates it automatically.)
 */
function browserCacheControl(contentType: string): string {
  return contentType.startsWith('text/html')
    ? 'public, max-age=0, must-revalidate'
    : 'public, max-age=300, stale-while-revalidate=3600';
}

function buildHeaders(obj: R2Object, env: Env): Headers {
  const h = new Headers(securityHeaders(env));
  obj.writeHttpMetadata(h);
  h.set('ETag', obj.httpEtag);
  h.set('Accept-Ranges', 'bytes');
  h.set('Cache-Control', browserCacheControl(h.get('Content-Type') ?? ''));
  return h;
}

function resolveRange(r: R2Range, size: number): { start: number; end: number } {
  if ('suffix' in r) {
    const len = Math.min(r.suffix, size);
    return { start: size - len, end: size - 1 };
  }
  const start = r.offset ?? 0;
  const length = r.length ?? size - start;
  return { start, end: Math.min(start + length, size) - 1 };
}

/** Map a URL path to candidate object keys, or null if the path is malformed. */
function candidateKeys(prefix: string, pathname: string): string[] | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (path.includes('\0') || path.includes('\\')) return null;
  const segs = path.split('/').filter(Boolean);
  if (segs.some((s) => s === '.' || s === '..')) return null;

  const clean = segs.join('/');
  if (clean === '') return [prefix + 'index.html'];
  if (path.endsWith('/')) return [`${prefix}${clean}/index.html`];
  if (/\.[A-Za-z0-9]+$/.test(segs[segs.length - 1] ?? '')) return [prefix + clean];
  return [`${prefix}${clean}.html`, `${prefix}${clean}/index.html`];
}

interface ServeOptions {
  status?: number;
  allowRange?: boolean;
}

async function serveKey(
  key: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  opts: ServeOptions = {},
): Promise<Response | null> {
  const status = opts.status ?? 200;
  const rangeHeader = opts.allowRange === false ? null : request.headers.get('Range');

  if (request.method === 'HEAD') {
    const head = await env.SITES_BUCKET.head(key);
    if (!head) return null;
    const h = buildHeaders(head, env);
    h.set('Content-Length', String(head.size));
    return new Response(null, { status, headers: h });
  }

  const cacheable = status === 200 && !rangeHeader;
  const cache = caches.default;
  const cacheKey = new Request(`https://edge-cache.internal/${encodeURI(key)}`);

  if (cacheable) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const h = new Headers(hit.headers);
      for (const [k, v] of Object.entries(securityHeaders(env))) h.set(k, v);
      h.set('Cache-Control', browserCacheControl(h.get('Content-Type') ?? ''));
      return new Response(hit.body, { status: hit.status, headers: h });
    }
  }

  const obj = await env.SITES_BUCKET.get(key, rangeHeader ? { range: request.headers } : undefined);
  if (!obj) return null;

  const headers = buildHeaders(obj, env);

  if (obj.range) {
    const { start, end } = resolveRange(obj.range, obj.size);
    headers.set('Content-Range', `bytes ${start}-${end}/${obj.size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(obj.body, { status: 206, headers });
  }

  headers.set('Content-Length', String(obj.size));

  if (cacheable && obj.size <= CACHE_MAX_BYTES) {
    const [toClient, toCache] = obj.body.tee();
    const edge = new Headers(headers);
    edge.set('Cache-Control', EDGE_TTL);
    ctx.waitUntil(cache.put(cacheKey, new Response(toCache, { status: 200, headers: edge })));
    return new Response(toClient, { status, headers });
  }
  return new Response(obj.body, { status, headers });
}

function page(env: Env, status: number, title: string, message: string): Response {
  const h = new Headers(securityHeaders(env));
  h.set('Content-Type', 'text/html; charset=utf-8');
  h.set('Cache-Control', 'no-store');
  const body = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#222"><main style="text-align:center;padding:24px"><h1 style="font-size:1.4rem">${title}</h1><p>${message}</p></main></body></html>`;
  return new Response(body, { status, headers: h });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const url = new URL(request.url);
    const slug = slugFromHost(url.hostname, env.SITE_DOMAIN);
    if (!slug) return page(env, 404, 'Not found', 'This address does not point to a portfolio.');

    // KV is read at the edge and cached for 60s: a publish goes live within about a minute worldwide.
    const route = await env.SITES_KV.get<SiteRoute>(siteRouteKey(slug), { type: 'json', cacheTtl: 60 });
    if (!route) return page(env, 404, 'No portfolio here', 'Nobody has published at this address yet.');
    if (route.status === 'suspended') {
      return page(env, 403, 'Portfolio unavailable', 'This portfolio has been suspended.');
    }

    const keys = candidateKeys(route.prefix, url.pathname);
    if (!keys) return page(env, 400, 'Bad request', 'That URL is not valid.');

    for (const key of keys) {
      const res = await serveKey(key, request, env, ctx);
      if (res) return res;
    }

    const custom404 = await serveKey(route.prefix + '404.html', request, env, ctx, {
      status: 404,
      allowRange: false,
    });
    return custom404 ?? page(env, 404, 'Page not found', 'This portfolio has no such page.');
  },
} satisfies ExportedHandler<Env>;
