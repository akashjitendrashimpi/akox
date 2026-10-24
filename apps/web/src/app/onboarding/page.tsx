'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { checkSlug } from '@akox/core';
import { getSupabase } from '../../lib/supabase';

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) { router.replace('/login'); return; }
      setUserId(user.id);
      setFullName(String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''));
    });
  }, [router]);

  const problem = username ? checkSlug(username) : null;
  const hint =
    problem === 'FORMAT' ? 'Use 3 to 32 letters, numbers or hyphens.' :
    problem === 'RESERVED' ? 'That name is reserved. Try another.' : msg;

  async function save(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !userId || !username || problem) return;
    setBusy(true);
    const { error } = await sb.from('profiles').insert({ id: userId, username, display_name: fullName || username });
    setBusy(false);
    if (error) setMsg(error.code === '23505' ? 'That name is taken. Try another.' : error.message);
    else router.replace('/dashboard');
  }

  return (
    <>
      <header className="bar">
        <Link className="logo" href="/">akox</Link>
      </header>
      <main className="narrow">
        <h1 className="small">Choose your address</h1>
        <p className="lead">{fullName ? `Welcome, ${fullName}. ` : ''}This will be the web address of your portfolio. You can not change it later, so pick carefully.</p>
        <form onSubmit={save}>
          <div className="address">
            <input value={username} placeholder="yourname" maxLength={32} aria-label="Username"
              onChange={(e) => { setUsername(e.target.value.toLowerCase()); setMsg(''); }} />
            <span className="dim">.akox.in</span>
          </div>
          <p className={hint ? 'note bad' : 'note'} role="status">{hint || ' '}</p>
          <button className="btn" disabled={!userId || !username || Boolean(problem) || busy}>
            {busy ? 'Saving...' : 'Save my address'}
          </button>
        </form>
      </main>
    </>
  );
}