'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { checkSlug } from '@akox/core';
import { getSupabase } from '../../lib/supabase';
import { AuthFrame } from '../../components/app/AuthFrame';

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

  // Prefill the address the visitor typed on the landing page, if any.
  useEffect(() => {
    try {
      const wanted = localStorage.getItem('akox:address');
      if (wanted) setUsername((current) => current || wanted);
    } catch {
      /* storage can be blocked; nothing to prefill */
    }
  }, []);

  const problem = username ? checkSlug(username) : null;
  const hint =
    problem === 'FORMAT' ? 'Use 3 to 32 letters, numbers or hyphens.' :
    problem === 'RESERVED' ? 'That name is reserved. Try another.' : msg;
  const looksGood = Boolean(username) && !problem && !msg;

  async function save(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !userId || !username || problem) return;
    setBusy(true);
    const { error } = await sb.from('profiles').insert({ id: userId, username, display_name: fullName || username });
    setBusy(false);
    if (error) {
      setMsg(error.code === '23505' ? 'That name is taken. Try another.' : error.message);
    } else {
      try { localStorage.removeItem('akox:address'); } catch { /* ignore */ }
      router.replace('/dashboard');
    }
  }

  return (
    <AuthFrame
      title="Choose your address"
      lead={`${fullName ? `Welcome, ${fullName}. ` : ''}This will be the web address of your portfolio.`}
      address={username}
    >
      <form onSubmit={save}>
        <label className="ap-address" htmlFor="username">
          <span className="ap-lock" aria-hidden="true" />
          <input id="username" value={username} placeholder="yourname" maxLength={32} aria-label="Username"
            autoComplete="off" autoCapitalize="none" spellCheck={false} autoFocus
            onChange={(e) => { setUsername(e.target.value.toLowerCase()); setMsg(''); }} />
          <span className="ap-address-suffix" aria-hidden="true">.akox.in</span>
        </label>

        <p className={hint ? 'ap-note bad ap-status' : looksGood ? 'ap-note ok ap-status' : 'ap-note ap-status'} role="status">
          {hint || (looksGood ? 'This format works. We check that it is free when you save.' : ' ')}
        </p>

        <p className="ap-callout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span>You can not change it later, so pick carefully.</span>
        </p>

        <button className="ap-btn ap-btn-wide" aria-busy={busy} disabled={!userId || !username || Boolean(problem) || busy}>
          {busy ? 'Saving...' : 'Save my address'}
        </button>
      </form>
    </AuthFrame>
  );
}
