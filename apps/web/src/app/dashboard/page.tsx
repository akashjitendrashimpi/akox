'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setLoaded(true); return; }
    void sb.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setLoaded(true);
    });
  }, []);

  async function signOut() {
    await getSupabase()?.auth.signOut();
    setEmail(null);
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
        {loaded && email && (
          <>
            <h1 className="small">Welcome</h1>
            <p className="lead">You are logged in as {email}.</p>
            <section className="report">
              <h2>Your portfolio</h2>
              <p>You have not published a portfolio yet.</p>
              <Link className="btn" href="/upload">Check a site to upload</Link>
            </section>
          </>
        )}
      </main>
    </>
  );
}
