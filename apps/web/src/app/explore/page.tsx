import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { BackLink } from '../../components/BackLink';
import { ExploreView, type Person, type Project } from '../../components/app/ExploreView';

export const revalidate = 0;

type Profile = Omit<Person, 'titles' | 'projects'>;

export default async function ExplorePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let people: Person[] = [];

  if (url && key) {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data: projs } = await sb.from('projects').select('owner_id, title, description, url, created_at').order('created_at', { ascending: false }).limit(200);
    // Everyone with a published site belongs here, with or without projects.
    const { data: sites } = await sb.from('portfolio_sites').select('owner_id, kind, updated_at').order('updated_at', { ascending: false }).limit(200);
    const kindOf = new Map((sites ?? []).map((s) => [String(s.owner_id), String(s.kind)] as const));
    const latest = new Map<string, number>();
    const bump = (id: string, iso: string | null) => {
      const t = iso ? Date.parse(iso) : 0;
      if ((Number.isNaN(t) ? 0 : t) > (latest.get(id) ?? -1)) latest.set(id, Number.isNaN(t) ? 0 : t);
    };
    for (const s of sites ?? []) bump(String(s.owner_id), s.updated_at as string | null);
    const byOwner = new Map<string, Project[]>();
    for (const p of (projs ?? []) as { owner_id: string; title: string; description: string | null; url: string | null; created_at: string | null }[]) {
      const list = byOwner.get(p.owner_id) ?? [];
      list.push({ title: p.title, description: p.description ?? '', url: p.url && /^https?:\/\//i.test(p.url) ? p.url : null });
      byOwner.set(p.owner_id, list);
      bump(p.owner_id, p.created_at);
    }
    // Newest activity first, whether that was a project or a published site.
    const ids = [...latest.keys()].sort((a, b) => (latest.get(b) ?? 0) - (latest.get(a) ?? 0)).slice(0, 48);
    if (ids.length > 0) {
      const { data: profs } = await sb.from('profiles').select('id, username, display_name, bio').in('id', ids).eq('suspended', false);
      const byId = new Map(((profs ?? []) as Profile[]).map((p) => [p.id, p] as const));
      // Keep the order of the projects query, so the people with the newest work come first.
      people = ids.flatMap((id) => {
        const p = byId.get(id);
        return p ? [{ ...p, display_name: p.display_name ?? '', bio: p.bio ?? '', titles: (byOwner.get(id) ?? []).map((x) => x.title), projects: byOwner.get(id) ?? [], kind: kindOf.get(id) ?? null }] : [];
      });
    }
  }

  return (
    <>
      <BackLink fallback="/dashboard" />
      <header className="ap-ph">
        <div className="ap-ph-text">
          <h1 className="ap-ph-title">Explore</h1>
          <p className="ap-ph-lead">{people.length} {people.length === 1 ? 'person has' : 'people have'} shared a site here so far. Open one and see how they did it.</p>
        </div>
      </header>

      {people.length === 0 ? (
        <div className="ap-panel ap-empty">
          <p className="ap-note" style={{ marginTop: 0 }}>Nobody has shared a site here yet. Add a project and yours will be the first.</p>
          <Link className="ap-btn" href="/dashboard/edit">Add a project</Link>
        </div>
      ) : (
        <ExploreView people={people} />
      )}
    </>
  );
}
