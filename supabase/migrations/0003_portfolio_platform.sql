-- Migration 0003: Core portfolio platform tables, rate limits, settings, reports, and strict RLS policies

-- 1. Ensure profiles has plan and suspended columns
alter table public.profiles
  add column if not exists plan text not null default 'free' check (plan in ('free', 'pro', 'builder')),
  add column if not exists suspended boolean not null default false;

-- 2. Portfolio sites: one active version per user
create table if not exists public.portfolio_sites (
  owner_id            uuid primary key references public.profiles(id) on delete cascade,
  version             text not null,
  previous_version    text,
  file_count          integer not null default 0,
  total_bytes         bigint  not null default 0,
  previous_file_count integer not null default 0,
  previous_bytes      bigint  not null default 0,
  kind                text not null default 'zip' check (kind in ('zip', 'template')),
  previous_kind       text check (previous_kind in ('zip', 'template')),
  updated_at          timestamptz not null default now()
);

alter table public.portfolio_sites enable row level security;

-- Public can view active portfolios if user is not suspended
create policy "portfolio_sites_public_read" on public.portfolio_sites
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = owner_id and not p.suspended
    )
  );

-- Only service role can insert/update/delete portfolio_sites
revoke all on public.portfolio_sites from anon, authenticated;
grant select on public.portfolio_sites to anon, authenticated;

-- 3. Publish log: records deploys for rate limiting and audit trails
create table if not exists public.publish_log (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists publish_log_owner_created_idx on public.publish_log (owner_id, created_at desc);

alter table public.publish_log enable row level security;

-- Users can read their own publish log for count and quota display
create policy "publish_log_own_read" on public.publish_log
  for select using (owner_id = (select auth.uid()));

-- Only service role inserts publish logs
revoke insert, update, delete on public.publish_log from anon, authenticated;
grant select on public.publish_log to authenticated;

-- 4. Site settings: template configuration and saved drafts
create table if not exists public.site_settings (
  owner_id      uuid primary key references public.profiles(id) on delete cascade,
  template_id   text not null,
  template_data jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Owner can read and write their own site settings
create policy "site_settings_own_read" on public.site_settings
  for select using (owner_id = (select auth.uid()));

create policy "site_settings_own_write" on public.site_settings
  for all using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- 5. Site reports: abuse and content violation reports
create table if not exists public.site_reports (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null check (char_length(reason) between 1 and 500),
  created_at  timestamptz not null default now()
);

create index if not exists site_reports_owner_idx on public.site_reports (owner_id, created_at desc);

alter table public.site_reports enable row level security;

-- Authenticated users can file reports
create policy "site_reports_insert" on public.site_reports
  for insert with check (reporter_id = (select auth.uid()));

-- Only service role can read reports
revoke select, update, delete on public.site_reports from anon, authenticated;
grant insert on public.site_reports to authenticated;

