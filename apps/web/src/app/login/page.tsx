'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { getSupabase } from '../../lib/supabase';

const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    setMsg(error ? { text: error.message, bad: true } : { text: 'Check your email. We sent you a login link.', bad: false });
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
        <p className="lead">New here? Just enter your email. We will create your account.</p>

        {!ready && (
          <p className="note bad" role="alert">Login is not connected yet. Add your Supabase keys to .env.local, then restart.</p>
        )}

        <form onSubmit={sendLink}>
          <label className="field" htmlFor="email">Email</label>
          <input id="email" className="text" type="email" required value={email} placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)} />
          <button className="btn wide" disabled={!ready || busy}>{busy ? 'Sending...' : 'Email me a login link'}</button>
        </form>

        <p className="or">or</p>
        <button className="btn ghost wide" onClick={() => void google()} disabled={!ready}>Continue with Google</button>

        {msg && <p className={msg.bad ? 'note bad' : 'note'} role="status">{msg.text}</p>}
      </main>
    </>
  );
}
