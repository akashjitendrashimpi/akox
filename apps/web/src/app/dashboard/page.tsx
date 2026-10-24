'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { AppBar } from '../../components/AppBar';

interface Me { username: string; name: string; bio: string; projects: number }

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<'loading' | 'out' | 'in'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setState('out'); return; }
    void (async () => {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) { setState('out'); return; }
      const { data: p } = await sb.from('profiles').select('username, display_name, bio').eq('id', user.id).maybeSingle();
      if (!p) { router.replace('/onboarding'); return; }
      const { count } = await sb.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', user.id);
      setMe({
        username: String(p.username),
        name: String(p.display_name || p.username),
        bio: String(p.bio ?? ''),
        projects: count ?? 0,
      });
      setState('in');
    })();
  }, [router]);

  function copy() {
    if (!me) return;
    void navigator.clipboard.writeText(`${window.location.origin}/u/${me.username}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const tasks = me ? [
    { done: true, label: 'Create your account' },
    { done: true, label: 'Choose your address' },
    { done: me.bio.trim().length > 0, label: 'Write a short bio' },
    { done: me.projects > 0, label: 'Add your first project' },
  ] : [];

  return (
    <>
      <AppBar />
      <main className="narrow">
        {state === 'loading' && <p className="lead">Loading...</p>}

        {state === 'out' && (
          <>
            <h1 className="small">You are not logged in</h1>
            <Link className="btn" href="/login">Go to login</Link>
          </>
        )}

        {state === 'in' && me && (
          <>
            <h1 className="small">Hi, {me.name}</h1>

            <section className="report">
              <h2>Your address</h2>
              <div className="address" style={{ marginTop: 8 }}>
                <span className="lock" />
                <span>{me.username}<span className="dim">.akox.in</span></span>
              </div>
              <p className="note">It goes live on the internet when we deploy AKOX. For now, your page is on this computer.</p>
              <div className="nav">
                <Link className="btn" href={'/u/' + me.username}>Open my page</Link>
                <button className="btn ghost" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
              </div>
            </section>

            <section className="report">
              <h2>Finish your portfolio</h2>
              <ul className="checks">
                {tasks.map((t) => (
                  <li key={t.label} className={t.done ? 'done' : ''}>
                    <span>{t.done ? 'Done' : 'To do'}</span> {t.label}
                  </li>
                ))}
              </ul>
              <div className="nav">
                <Link className="btn" href="/dashboard/edit">Edit my portfolio</Link>
                <Link className="btn ghost" href="/explore">Explore portfolios</Link>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}