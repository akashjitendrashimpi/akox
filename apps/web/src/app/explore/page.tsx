import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { AppBar } from '../../components/AppBar';

export const revalidate = 0;

interface Person { id: string; username: string; display_name: string; bio: string }

export default async function ExplorePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let people: (Person & { titles: string[] })[] = [];

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
      people = ((profs ?? []) as Person[]).map((p) => ({ ...p, titles: byOwner.get(p.id) ?? [] }));
    }
  }

  return (
    <>
      <AppBar />
      <main className="wide">
        <h1 className="small">Explore portfolios</h1>
        <p className="lead">See what other students and freelancers are building.</p>
        {people.length === 0 && <p className="note">No portfolios here yet. Add a project to yours and you will be the first.</p>}
        <div className="grid">
          {people.map((p) => (
            <Link key={p.id} className="pcard" href={'/u/' + p.username}>
              <b>{p.display_name || p.username}</b>
              <span className="dim">{p.username}.akox.in</span>
              {p.bio && <p className="clamp">{p.bio}</p>}
              <span className="tag">{p.titles.length} {p.titles.length === 1 ? 'project' : 'projects'}: {p.titles[0]}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}