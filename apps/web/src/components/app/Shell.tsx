'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { getSupabase } from '../../lib/supabase';
import { planLabel } from '../../lib/plan';
import { AppBar } from '../AppBar';
import { MobileMenu } from '../MobileMenu';
import { CompassIcon, ExternalIcon, GearIcon, GridIcon, LayoutIcon, PencilIcon, UploadIcon } from './Icons';
import { Logo } from '../brand/Logo';

export interface ShellUser {
  id: string;
  email: string;
  username: string;
  name: string;
  plan: string | null;
}

interface ShellState { status: 'loading' | 'out' | 'in'; user: ShellUser | null }

const ShellContext = createContext<ShellState>({ status: 'loading', user: null });

/** Who is signed in, loaded once by the shell so pages inside it do not each ask again. */
export function useShellUser(): ShellState {
  return useContext(ShellContext);
}

interface NavItem {
  href: string;
  label: string;
  short: string;
  Icon: ComponentType<{ size?: number }>;
  /** Only highlight on this exact path (the dashboard home would otherwise match every page below it). */
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', short: 'Home', Icon: GridIcon, exact: true },
  { href: '/dashboard/edit', label: 'Edit portfolio', short: 'Edit', Icon: PencilIcon },
  { href: '/dashboard/templates', label: 'Site builder', short: 'Build', Icon: LayoutIcon },
  { href: '/dashboard/upload', label: 'Upload site', short: 'Upload', Icon: UploadIcon },
  { href: '/explore', label: 'Explore', short: 'Explore', Icon: CompassIcon },
  { href: '/dashboard/settings', label: 'Settings', short: 'Settings', Icon: GearIcon },
];

/** `pub` is for pages anyone can open (Explore): visitors get the plain top bar, signed-in people get the same sidebar as the dashboard. */
export function DashboardShell({ children, pub = false }: { children: ReactNode; pub?: boolean }) {
  const pathname = usePathname() ?? '';
  const [state, setState] = useState<ShellState>({ status: 'loading', user: null });

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setState({ status: 'out', user: null }); return; }
    void (async () => {
      const { data } = await sb.auth.getSession();
      const u = data.session?.user;
      if (!u) { setState({ status: 'out', user: null }); return; }
      const { data: p } = await sb.from('profiles').select('username, display_name, plan').eq('id', u.id).maybeSingle();
      setState({
        status: 'in',
        user: {
          id: u.id,
          email: u.email ?? '',
          username: String(p?.username ?? ''),
          name: String(p?.display_name || p?.username || u.user_metadata?.full_name || ''),
          plan: p?.plan ? String(p.plan) : null,
        },
      });
    })();
  }, []);

  const value = useMemo(() => state, [state]);

  // Signed-out visitors get the plain page with the public top bar, not an empty sidebar.
  if (state.status === 'out' || (pub && state.status === 'loading')) {
    return (
      <ShellContext.Provider value={value}>
        {state.status === 'out' ? <AppBar /> : <div className="ap-nav"><div className="ap-wrap ap-nav-in"><Link className="ap-logo" href="/"><Logo /></Link></div></div>}
        <main className="ap-wrap ap-page">{children}</main>
      </ShellContext.Provider>
    );
  }

  const isActive = (n: NavItem) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));
  const { user } = state;
  const initial = (user?.name || user?.username || '?').charAt(0);

  const sideNav = (
    <>
      <nav aria-label="Dashboard">
        <ul className="ap-navlist">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link className="ap-navitem" href={n.href} aria-current={isActive(n) ? 'page' : undefined}>
                <n.Icon size={20} />
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ap-side-foot">
        {user?.username && (
          <Link className="ap-side-page" href={'/u/' + user.username}>
            View my page <ExternalIcon size={16} />
          </Link>
        )}
        <Link className="ap-userchip" href="/dashboard/settings" aria-label="Account settings">
          <span className="ap-avatar-sm" aria-hidden="true">{initial}</span>
          <span className="ap-userchip-text">
            <b>{user?.name || (state.status === 'loading' ? ' ' : 'Your account')}</b>
            <span>{user ? planLabel(user.plan) + ' plan' : ' '}</span>
          </span>
        </Link>
      </div>
    </>
  );

  return (
    <ShellContext.Provider value={value}>
      <div className="ap-shell">
        <aside className="ap-side">
          <Link className="ap-logo ap-side-logo" href="/dashboard"><Logo /></Link>
          {sideNav}
        </aside>

        <header className="ap-topm">
          <div className="ap-nav-l">
            <MobileMenu title="Menu">
              <Link className="ap-logo ap-drawer-logo" href="/dashboard"><Logo /></Link>
              {sideNav}
            </MobileMenu>
            <Link className="ap-logo" href="/dashboard"><Logo /></Link>
          </div>
          <Link className="ap-avatar-sm" href="/dashboard/settings" aria-label="Account settings">{initial}</Link>
        </header>

        <div className="ap-shell-main">
          <div className="ap-shell-in">{children}</div>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
