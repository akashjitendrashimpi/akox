'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/auth';

const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getSupabase()?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setMsg('');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMsg(error.message === 'Invalid login credentials' ? 'Wrong email or password. New here? Create an account below.' : error.message);
    } else {
      router.replace('/dashboard');
    }
  }

  async function google() {
    const err = await signInWithGoogle();
    if (err) setMsg(err);
  }

  return (
    <>
      <header className="bar">
        <Link className="logo" href="/">akox</Link>
      </header>
      <main className="narrow">
        <h1 className="small">Welcome back</h1>
        <p className="lead">Log in to manage your portfolio.</p>
        {!ready && <p className="note bad" role="alert">Login is not connected yet. Check your .env.local file.</p>}

        <button type="button" className="btn ghost wide" disabled={!ready} onClick={() => void google()}>Continue with Google</button>
        <p className="or">or use your email</p>

        <form onSubmit={submit}>
          <label className="field" htmlFor="email">Email</label>
          <input id="email" className="text" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <label className="field" htmlFor="password">Password</label>
          <input id="password" className="text" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
          <button className="btn wide" disabled={!ready || busy}>{busy ? 'Please wait...' : 'Log in'}</button>
        </form>

        <p className={msg ? 'note bad' : 'note'} role="status">{msg || ' '}</p>
        <p className="note">New to AKOX? <Link className="link" href="/signup">Create an account</Link></p>
      </main>
    </>
  );
}