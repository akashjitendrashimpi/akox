'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSupabase } from '../lib/supabase';

const PUBLIC_ENTRY_PAGES = ['/', '/login', '/signup'];

/** Logged-in people never need the landing, login or signup pages: send them to the dashboard. */
export function AuthRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!PUBLIC_ENTRY_PAGES.includes(pathname)) return;
    void getSupabase()?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [pathname, router]);

  return null;
}