import Link from 'next/link';
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
        <main className="ap-wrap ap-page">
          <div className="ap-narrow">
            <h1 className="ap-title">Portfolio unavailable</h1>
            <p className="ap-lead">This portfolio has been suspended.</p>
          </div>
        </main>
      </>
    );
  }

  const { data: list } = await sb.from('projects').select('id, title, description, url').eq('owner_id', p.id).order('created_at');
  const projects = (list ?? []) as { id: string; title: string; description: string; url: string | null }[];

  return (
    <>
      <AppBar />
      <main className="ap-site-stage">
        <article className="ap-paper ap-site">
          <div className="ap-addr"><span className="ap-lock" /><span>{p.username}<span className="ap-url-dim">.akox.in</span></span></div>
          <h1 className="ap-site-name">{p.display_name || p.username}</h1>
          {p.bio && <p className="ap-site-bio">{p.bio}</p>}
          <h2 className="ap-site-h2">Projects</h2>
          {projects.length === 0 && <p className="ap-note">No projects yet.</p>}
          {projects.map((pr) => (
            <section className="ap-site-proj" key={pr.id}>
              <h3>{pr.title}</h3>
              {pr.description && <p>{pr.description}</p>}
              {pr.url && (
                <a className="ap-extlink" href={pr.url} target="_blank" rel="noopener noreferrer nofollow">
                  Visit project
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                  </svg>
                </a>
              )}
            </section>
          ))}
          <ReportButton ownerId={String(p.id)} />
        </article>
      </main>
      <footer className="ap-footer">Made with <Link href="/">AKOX</Link></footer>
    </>
  );
}
