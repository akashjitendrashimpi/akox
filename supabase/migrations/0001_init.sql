-- AKOX schema v1 (Supabase / Postgres)
-- Design rules:
--   * users can only write what they must; everything else is service-role only
--   * counters are denormalised and maintained by triggers (reads stay cheap)
--   * every deploy is an immutable row in site_versions; sites points at the live one

create type public.site_kind     as enum ('code', 'builder');
create type public.site_status   as enum ('active', 'suspended');
create type public.version_status as enum ('processing', 'ready', 'failed');

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique
               check (username ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$' and username !~ '--'),
  display_name text not null default '' check (char_length(display_name) <= 60),
  bio          text not null default '' check (char_length(bio) <= 500),
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.sites (
  id                uuid primary key default gen_random_uuid(),
  -- one portfolio per person for now (also cheap abuse control).
  -- Drop this unique constraint when multi-site plans exist.
  owner_id          uuid not null unique references public.profiles(id) on delete cascade,
  slug              text not null unique
                    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$' and slug !~ '--'),
  title             text not null check (char_length(title) between 1 and 80),
  description       text not null default '' check (char_length(description) <= 300),
  kind              public.site_kind   not null default 'code',
  status            public.site_status not null default 'active',
  is_public         boolean not null default true,
  tags              text[] not null default '{}' check (cardinality(tags) <= 8),
  cover_url         text,
  active_version_id uuid,
  view_count        bigint  not null default 0,
  like_count        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  search            tsvector generated always as (
                      to_tsvector('simple'::regconfig, coalesce(title, '') || ' ' || coalesce(description, ''))
                    ) stored
);

create table public.site_versions (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites(id) on delete cascade,
  number         integer not null,
  storage_prefix text not null,                 -- e.g. sites/<site_id>/<version_id>/
  file_count     integer not null default 0,
  total_bytes    bigint  not null default 0,
  status         public.version_status not null default 'processing',
  error          text,
  created_at     timestamptz not null default now(),
  unique (site_id, number)
);

alter table public.sites
  add constraint sites_active_version_fk
  foreign key (active_version_id) references public.site_versions(id) on delete set null;

create table public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  site_id    uuid not null references public.sites(id)    on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, site_id)
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null check (char_length(reason) between 1 and 500),
  status      text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at  timestamptz not null default now()
);

-- Explore page: newest public portfolios, tag filter, text search.
create index sites_explore_idx on public.sites (created_at desc) where is_public and status = 'active';
create index sites_popular_idx on public.sites (like_count desc) where is_public and status = 'active';
create index sites_tags_idx    on public.sites using gin (tags);
create index sites_search_idx  on public.sites using gin (search);
create index site_versions_site_idx on public.site_versions (site_id, number desc);
create index likes_site_idx    on public.likes (site_id);
create index reports_open_idx  on public.reports (created_at) where status = 'open';

-- Triggers -------------------------------------------------------------------
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger sites_touch
  before update of title, description, tags, cover_url, is_public, active_version_id
  on public.sites for each row execute function public.touch_updated_at();

create function public.bump_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.sites set like_count = like_count + 1 where id = new.site_id;
  elsif tg_op = 'DELETE' then
    update public.sites set like_count = greatest(like_count - 1, 0) where id = old.site_id;
  end if;
  return null;
end $$;

create trigger likes_count
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

-- Row level security ---------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.sites         enable row level security;
alter table public.site_versions enable row level security;
alter table public.likes         enable row level security;
alter table public.reports       enable row level security;

create policy "profiles are public"   on public.profiles for select using (true);
create policy "create own profile"    on public.profiles for insert with check (id = (select auth.uid()));
create policy "edit own profile"      on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "public or own portfolios" on public.sites for select
  using ((is_public and status = 'active') or owner_id = (select auth.uid()));
create policy "create own site" on public.sites for insert
  with check (owner_id = (select auth.uid()));
create policy "edit own site" on public.sites for update
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "delete own site" on public.sites for delete
  using (owner_id = (select auth.uid()));

-- Users may only touch descriptive columns. status, counters, slug changes and
-- active_version_id are written by the server (service role) only.
revoke insert, update on public.sites from anon, authenticated;
grant insert (owner_id, slug, title, description, kind, tags, cover_url, is_public)
  on public.sites to authenticated;
grant update (title, description, tags, cover_url, is_public)
  on public.sites to authenticated;

create policy "owners see their versions" on public.site_versions for select
  using (exists (select 1 from public.sites s
                 where s.id = site_id and s.owner_id = (select auth.uid())));
-- no insert/update policies on site_versions: only the publish pipeline (service role) writes.

create policy "see own likes"   on public.likes for select using (user_id = (select auth.uid()));
create policy "like as self"    on public.likes for insert with check (user_id = (select auth.uid()));
create policy "unlike as self"  on public.likes for delete using (user_id = (select auth.uid()));

create policy "file a report" on public.reports for insert
  with check (reporter_id = (select auth.uid()));
-- no select policy on reports: moderators use the service role.
