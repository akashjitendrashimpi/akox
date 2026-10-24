'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { getSupabase } from '../../lib/supabase';

const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function auth(mode: 'in' | 'up') {
    const sb = getSupabase();
    if (!sb) return;
    if (!email || password.length < 8) {
      setMsg({ text: 'Enter your email and a password of at least 8 characters.', bad: true });
      return;
    }
    setBusy(true);
    const res = mode === 'in'
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password });
    setBusy(false);
    if (res.error) { setMsg({ text: res.error.message, bad: true }); return; }
    if (res.data.session) router.replace('/dashboard');
    else setMsg({ text: 'Check your email to confirm your account.', bad: false });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void auth('in');
  }

  async function google() {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setMsg({ text: error.message, bad: true });
  }

  return (
    <>
      <header className="bar">
        <Link className="logo" href="/">akox</Link>
      </header>
      <main className="narrow">
        <h1 className="small">Log in or sign up</h1>
        <p className="lead">New here? Choose Create account. It takes a few seconds.</p>

        {!ready && (
          <p className="note bad" role="alert">Login is not connected yet. Add your Supabase keys to .env.local, then restart.</p>
        )}

        <form onSubmit={onSubmit}>
          <label className="field" htmlFor="email">Email</label>
          <input id="email" className="text" type="email" required value={email} placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)} />
          <label className="field" htmlFor="password">Password</label>
          <input id="password" className="text" type="password" minLength={8} value={password} placeholder="At least 8 characters"
            onChange={(e) => setPassword(e.target.value)} />
          <button className="btn wide" disabled={!ready || busy}>{busy ? 'Please wait...' : 'Log in'}</button>
        </form>
        <p className="or">or</p>
        <button type="button" className="btn ghost wide" disabled={!ready || busy} onClick={() => void auth('up')}>Create account</button>
        <p className="or">or</p>
        <button type="button" className="btn ghost wide" disabled={!ready} onClick={() => void google()}>Continue with Google</button>

        {msg && <p className={msg.bad ? 'note bad' : 'note'} role="status">{msg.text}</p>}
      </main>
    </>
  );
}