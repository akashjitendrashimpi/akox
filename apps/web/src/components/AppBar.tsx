'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';

export function AppBar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    void getSupabase()?.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
  }, []);

  async function logOut() {
    await getSupabase()?.auth.signOut();
    setLoggedIn(false);
    router.replace('/login');
  }

  return (
    <header className="bar">
      <Link className="logo" href="/">akox</Link>
      <nav className="nav">
        <Link className="navlink" href="/dashboard">Dashboard</Link>
        <Link className="navlink" href="/explore">Explore</Link>
        {loggedIn
          ? <button className="btn ghost" onClick={() => void logOut()}>Log out</button>
          : <Link className="btn" href="/login">Log in</Link>}
      </nav>
    </header>
  );
}