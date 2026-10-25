'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { MobileMenu } from '../MobileMenu';

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
        <div className="ap-nav-l">
          <MobileMenu title="Menu">
            <Link className="ap-logo ap-drawer-logo" href="/">akox</Link>
            <nav className="ap-mm-links" aria-label="Menu">
              <a href="#how">How it works</a>
              <Link href="/explore">Explore</Link>
              {loggedIn ? <Link className="ap-btn" href="/dashboard">Dashboard</Link> : (
                <>
                  <Link href="/login">Log in</Link>
                  <Link className="ap-btn" href="/signup">Get started</Link>
                </>
              )}
            </nav>
          </MobileMenu>
          <Link className="lp-logo" href="/">akox</Link>
        </div>
        <nav className="lp-nav-links" aria-label="Primary">
          <a className="lp-link lp-hide-sm" href="#how">How it works</a>
          <Link className="lp-link lp-hide-sm" href="/explore">Explore</Link>
          {loggedIn ? (
            <Link className="lp-btn lp-btn-sm lp-hide-sm" href="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link className="lp-link lp-hide-sm" href="/login">Log in</Link>
              <Link className="lp-btn lp-btn-sm lp-hide-sm" href="/signup">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
