import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { AppBar } from '../../components/AppBar';
import { ExploreView, type Person } from '../../components/app/ExploreView';

export const revalidate = 0;

type Profile = Omit<Person, 'titles'>;

export default async function ExplorePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let people: Person[] = [];

  if (url && key) {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data: projs } = await sb.from('projects').select('owner_id, title').order('created_at', { ascending: false }).limit(200);
    const byOwner = new Map<string, string[]>();
    for (const p of (projs ?? []) as { owner_id: string; title: string }[]) {
      const list = byOwner.get(p.owner_id) ?? [];
      list.push(p.title);
      byOwner.set(p.owner_id, list);
    }
    const ids = [...byOwner.keys()].slice(0, 48);
    if (ids.length > 0) {
      const { data: profs } = await sb.from('profiles').select('id, username, display_name, bio').in('id', ids).eq('suspended', false);
      const byId = new Map(((profs ?? []) as Profile[]).map((p) => [p.id, p] as const));
      // Keep the order of the projects query, so the people with the newest work come first.
      people = ids.flatMap((id) => {
        const p = byId.get(id);
        return p ? [{ ...p, display_name: p.display_name ?? '', bio: p.bio ?? '', titles: byOwner.get(id) ?? [] }] : [];
      });
    }
  }

  return (
    <>
      <AppBar />
      <main className="ap-wrap ap-page">
        <h1 className="ap-title">Explore portfolios</h1>
        <p className="ap-lead">See what other students and freelancers are building.</p>

        {people.length === 0 ? (
          <div className="ap-panel ap-empty">
            <p className="ap-note" style={{ marginTop: 0 }}>No portfolios here yet. Add a project to yours and you will be the first.</p>
            <Link className="ap-btn" href="/dashboard/edit">Add a project</Link>
          </div>
        ) : (
          <ExploreView people={people} />
        )}
      </main>
    </>
  );
}
