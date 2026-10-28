'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getSupabase } from '../../../lib/supabase';
import { planLabel } from '../../../lib/plan';
import { LogoutIcon } from '../../../components/app/Icons';
import { PageHeader } from '../../../components/app/PageHeader';
import { useShellUser } from '../../../components/app/Shell';
import { ThemeSwitch } from '../../../components/app/ThemeSwitch';

export default function SettingsPage() {
  const router = useRouter();
  const { status, user } = useShellUser();
  const [busy, setBusy] = useState(false);

  async function logOut() {
    setBusy(true);
    // A draft holds the person's email and bio. Do not leave it behind on a shared computer.
    try { if (user) localStorage.removeItem('akox:site-draft:' + user.id); } catch { /* storage blocked */ }
    await getSupabase()?.auth.signOut();
    router.replace('/login');
  }

  return (
    <>
      <PageHeader title="Settings" lead="Choose how AKOX looks and manage your account." />
      <div className="ap-settings">
        <section className="ap-panel ap-rise" style={{ '--i': 0 } as React.CSSProperties} aria-labelledby="set-look">
          <h2 className="ap-h2" id="set-look">Appearance</h2>
          <p className="ap-note" style={{ margin: '0 0 14px' }}>Your choice is saved on this device.</p>
          <ThemeSwitch />
        </section>

        <section className="ap-panel ap-rise" style={{ '--i': 1 } as React.CSSProperties} aria-labelledby="set-acc">
          <h2 className="ap-h2" id="set-acc">Account</h2>
          {status === 'in' && user ? (
            <dl className="ap-facts">
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              <div><dt>Address</dt><dd>{user.username}.akox.in</dd></div>
              <div><dt>Plan</dt><dd>{planLabel(user.plan)}</dd></div>
            </dl>
          ) : (
            <p className="ap-note">{status === 'loading' ? 'Loading...' : 'You are not logged in.'}</p>
          )}
          <div className="ap-actions">
            <Link className="ap-btn ap-btn-ghost" href="/dashboard/edit">Edit profile</Link>
            <button type="button" className="ap-btn ap-btn-dangersolid" aria-busy={busy} disabled={busy} onClick={() => void logOut()}>
              <LogoutIcon size={18} />{busy ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
