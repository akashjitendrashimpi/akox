'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setLoaded(true); return; }
    void (async () => {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) { setLoaded(true); return; }
      setEmail(user.email ?? null);
      const { data: profile } = await sb.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (!profile) { router.replace('/onboarding'); return; }
      setUsername(String(profile.username));
      setLoaded(true);
    })();
  }, [router]);

  async function signOut() {
    await getSupabase()?.auth.signOut();
    setEmail(null);
    setUsername(null);
  }

  return (
    <>
      <header className="bar">
        <Link className="logo" href="/">akox</Link>
        {email && <button className="btn ghost" onClick={() => void signOut()}>Log out</button>}
      </header>
      <main className="narrow">
        {!loaded && <p className="lead">Loading...</p>}
        {loaded && !email && (
          <>
            <h1 className="small">You are not logged in</h1>
            <Link className="btn" href="/login">Go to login</Link>
          </>
        )}
        {loaded && email && username && (
          <>
            <h1 className="small">Welcome</h1>
            <div className="address">
              <span className="lock" />
              <span>{username}<span className="dim">.akox.in</span></span>
            </div>
            <p className="lead" style={{ marginTop: 18 }}>Logged in as {email}.</p>
            <section className="report">
              <h2>Your portfolio</h2>
              <p>You have not published a portfolio yet.</p>
              <div className="nav"><Link className="btn" href="/dashboard/edit">Edit my portfolio</Link><Link className="btn ghost" href={'/u/' + username}>View public page</Link></div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
