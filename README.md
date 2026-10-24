# AKOX

Free portfolio platform: no-code builder + custom-code (self-written or AI-generated, simple or 3D) portfolios + a public GitHub-style gallery.

This repo is the **foundation layer**: the parts that are hardest to change later. UI comes on top.

```
akox/
  packages/core/            pure TypeScript: zip validation, slugs, publish pipeline (tested)
  workers/site-server/      Cloudflare Worker: serves every portfolio from R2
  supabase/migrations/      Postgres schema + row level security
```

## How a deploy works

```
browser ──zip──▶ R2  incoming/<id>.zip           (presigned upload, never through the app server)
app API ◀── "publish" ── reads zip ── extractBundle()      validate + unpack   [core/bundle.ts]
        └─ uploadBundle() ─▶ R2  sites/<siteId>/<versionId>/...   immutable    [core/publish.ts]
        └─ insert site_versions(status=ready)
        └─ flip sites.active_version_id  +  KV put site:<slug> = { prefix, status }
visitor ──▶ <slug>.akox.in ─▶ Worker ─ KV(slug→prefix) ─ R2(prefix+path) ─▶ response
```

Why it is built this way (each choice keeps it upgradeable):

- **Immutable versions + pointer flip.** A deploy is invisible until the pointer changes, so a failed upload never breaks a live site. Rollback = flip the pointer back. Version history and previews come for free.
- **Storage behind a 2-method interface** (`ObjectStore`). Swap R2 for S3 without touching anything else.
- **Pure core package.** No I/O, so validation is unit tested and reusable by the API, a CLI, or a future `akox deploy` command.
- **Static only.** No user code runs on your servers. Hosting cost per site is storage plus CDN, which is why a free tier is affordable.
- **Edge cache keyed by version prefix.** Redeploys invalidate automatically; no purge calls.
- **Separate domain for user sites.** This is the most important security rule. If portfolios and the app share a domain, user JavaScript can read app cookies.

## Setup

```bash
npm install
npm test            # 17 tests: zip safety, slugs, publish rollback
npm run typecheck
```

Cloudflare: create an R2 bucket `akox-sites` and a KV namespace, put the KV id in `workers/site-server/wrangler.toml`, replace the placeholder domains (`akox.in`, `akox.in`) with ones you own, then `npm run deploy -w @akox/site-server`.
Supabase: run `supabase/migrations/0001_init.sql` in the SQL editor.

## Known limits (deliberate, in priority order to fix)

1. **No app/API yet.** The presigned-upload and publish routes (Next.js) are the next piece.
2. **No SPA fallback.** React/Vite portfolios with client-side routes need a per-site `spa` flag in `SiteRoute`.
3. **View counts are not recorded.** Do not write to Postgres per view; use Workers Analytics Engine and batch.
4. **No custom domains.** Add a `domain:<host>` KV key mapping to a slug, plus Cloudflare for SaaS.
5. **No malware/phishing scan.** Add Safe Browsing checks on publish, rate limits, and a report review queue (the `reports` table exists).
6. **Worker and SQL are typechecked/reviewed but not yet run against real Cloudflare/Supabase.** Run them once before trusting them.
