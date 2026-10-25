'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

export function LandingNav() {
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

  return (
    <header className={`lp-nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="lp-wrap lp-nav-in">
        <Link className="lp-logo" href="/">akox</Link>
        <nav className="lp-nav-links" aria-label="Primary">
          <a className="lp-link lp-hide-sm" href="#how">How it works</a>
          <Link className="lp-link lp-hide-sm" href="/explore">Explore</Link>
          {loggedIn ? (
            <Link className="lp-btn lp-btn-sm" href="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link className="lp-link" href="/login">Log in</Link>
              <Link className="lp-btn lp-btn-sm" href="/signup">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
