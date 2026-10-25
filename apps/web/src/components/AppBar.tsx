'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';

export function AppBar() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [loggedIn, setLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    void getSupabase()?.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function logOut() {
    await getSupabase()?.auth.signOut();
    setLoggedIn(false);
    router.replace('/login');
  }

  // The dashboard section includes editing and uploading, so those pages keep "Dashboard" lit.
  const onExplore = pathname.startsWith('/explore');
  const onDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/upload');

  return (
    <header className={`ap-nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="ap-wrap ap-nav-in">
        <Link className="ap-logo" href="/">akox</Link>
        <nav className="ap-links" aria-label="Primary">
          <Link className="ap-link" href="/explore" aria-current={onExplore ? 'page' : undefined}>Explore</Link>
          {loggedIn ? (
            <>
              <Link className="ap-link" href="/dashboard" aria-current={onDashboard ? 'page' : undefined}>Dashboard</Link>
              <button className="ap-btn ap-btn-ghost ap-btn-sm" onClick={() => void logOut()}>Log out</button>
            </>
          ) : (
            <>
              <Link className="ap-link" href="/login">Log in</Link>
              <Link className="ap-btn ap-btn-sm" href="/signup">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
