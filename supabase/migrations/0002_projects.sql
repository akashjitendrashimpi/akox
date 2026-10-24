-- AKOX migration 0002: projects shown on a public portfolio page
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  url         text check (url is null or url ~ '^https?://'),
  created_at  timestamptz not null default now()
);
create index projects_owner_idx on public.projects (owner_id, created_at);
alter table public.projects enable row level security;
create policy "projects are public" on public.projects for select using (true);
create policy "add own projects"    on public.projects for insert with check (owner_id = (select auth.uid()));
create policy "edit own projects"   on public.projects for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "delete own projects" on public.projects for delete using (owner_id = (select auth.uid()));