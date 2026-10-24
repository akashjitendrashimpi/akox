import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { AppBar } from '../../../components/AppBar';
import { ReportButton } from '../../../components/ReportButton';

export const revalidate = 0;

export default async function PublicPortfolio({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) notFound();
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: p } = await sb.from('profiles').select('id, username, display_name, bio, suspended').eq('username', username.toLowerCase()).maybeSingle();
  if (!p) notFound();

  if (p.suspended) {
    return (
      <>
        <AppBar />
        <main className="narrow">
          <h1 className="small">Portfolio unavailable</h1>
          <p className="lead">This portfolio has been suspended.</p>
        </main>
      </>
    );
  }

  const { data: list } = await sb.from('projects').select('id, title, description, url').eq('owner_id', p.id).order('created_at');
  const projects = (list ?? []) as { id: string; title: string; description: string; url: string | null }[];

  return (
    <>
      <AppBar />
      <main className="narrow">
        <div className="address"><span className="lock" /><span>{p.username}<span className="dim">.akox.in</span></span></div>
        <h1 className="small">{p.display_name || p.username}</h1>
        {p.bio && <p className="lead">{p.bio}</p>}
        <h2>Projects</h2>
        {projects.length === 0 && <p className="note">No projects yet.</p>}
        {projects.map((pr) => (
          <section className="report" key={pr.id}>
            <b>{pr.title}</b>
            {pr.description && <p>{pr.description}</p>}
            {pr.url && <a className="link" href={pr.url} target="_blank" rel="noopener noreferrer nofollow">Visit project</a>}
          </section>
        ))}
        <ReportButton ownerId={String(p.id)} />
      </main>
      <footer>Made with AKOX</footer>
    </>
  );
}