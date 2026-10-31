'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { GearIcon } from './app/Icons';
import { MobileMenu } from './MobileMenu';
import { Logo } from './brand/Logo';

/** Top bar for public pages (Explore, public portfolios). The signed-in app lives in the dashboard shell. */
export function AppBar() {
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

  const onExplore = pathname.startsWith('/explore');

  return (
    <header className={`ap-nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="ap-wrap ap-nav-in">
        {/* Signed-in people land on their dashboard; visitors land on the home page. */}
        <div className="ap-nav-l">
          <MobileMenu title="Menu">
            <Link className="ap-logo ap-drawer-logo" href={loggedIn ? '/dashboard' : '/'}><Logo /></Link>
            <nav className="ap-mm-links" aria-label="Menu">
              {loggedIn ? (
                <>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/explore" aria-current={onExplore ? 'page' : undefined}>Explore</Link>
                  <Link href="/dashboard/settings">Settings</Link>
                </>
              ) : (
                <>
                  <Link href="/explore" aria-current={onExplore ? 'page' : undefined}>Explore</Link>
                  <Link href="/login">Log in</Link>
                  <Link className="ap-btn" href="/signup">Get started</Link>
                </>
              )}
            </nav>
          </MobileMenu>
          <Link className="ap-logo" href={loggedIn ? '/dashboard' : '/'}><Logo /></Link>
        </div>
        <nav className="ap-links ap-hide-sm" aria-label="Primary">
          {loggedIn ? (
            <>
              <Link className="ap-link" href="/dashboard">Dashboard</Link>
              <Link className="ap-link" href="/explore" aria-current={onExplore ? 'page' : undefined}>Explore</Link>
              <Link className="ap-iconlink" href="/dashboard/settings" aria-label="Settings"><GearIcon size={20} /></Link>
            </>
          ) : (
            <>
              <Link className="ap-link" href="/explore" aria-current={onExplore ? 'page' : undefined}>Explore</Link>
              <Link className="ap-link" href="/login">Log in</Link>
              <Link className="ap-btn ap-btn-sm" href="/signup">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
