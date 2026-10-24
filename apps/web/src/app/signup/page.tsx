'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/auth';

const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
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
    if (name.trim().length < 2) return setMsg({ text: 'Please enter your name.', bad: true });
    if (password.length < 8) return setMsg({ text: 'Your password needs at least 8 characters.', bad: true });
    if (password !== again) return setMsg({ text: 'The two passwords do not match.', bad: true });

    setBusy(true);
    setMsg(null);
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);

    if (error) return setMsg({ text: error.message, bad: true });
    if (data.user && data.user.identities?.length === 0) {
      return setMsg({ text: 'An account with this email already exists. Please log in.', bad: true });
    }
    if (data.session) router.replace('/dashboard');
    else setMsg({ text: 'Almost done. Check your email and click the link to confirm your account.', bad: false });
  }

  async function google() {
    const err = await signInWithGoogle();
    if (err) setMsg({ text: err, bad: true });
  }

  return (
    <>
      <header className="bar">
        <Link className="logo" href="/">akox</Link>
      </header>
      <main className="narrow">
        <h1 className="small">Create your account</h1>
        <p className="lead">Free forever to start. Your portfolio goes live at yourname.akox.in.</p>
        {!ready && <p className="note bad" role="alert">Sign up is not connected yet. Check your .env.local file.</p>}

        <button type="button" className="btn ghost wide" disabled={!ready} onClick={() => void google()}>Sign up with Google</button>
        <p className="or">or use your email</p>

        <form onSubmit={submit}>
          <label className="field" htmlFor="name">Full name</label>
          <input id="name" className="text" required maxLength={60} autoComplete="name" value={name}
            onChange={(e) => setName(e.target.value)} />
          <label className="field" htmlFor="email">Email</label>
          <input id="email" className="text" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <label className="field" htmlFor="password">Password (8 or more characters)</label>
          <input id="password" className="text" type="password" required autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
          <label className="field" htmlFor="again">Confirm password</label>
          <input id="again" className="text" type="password" required autoComplete="new-password" value={again}
            onChange={(e) => setAgain(e.target.value)} />
          <button className="btn wide" disabled={!ready || busy}>{busy ? 'Creating...' : 'Create account'}</button>
        </form>

        <p className={msg?.bad ? 'note bad' : 'note'} role="status">{msg?.text ?? ' '}</p>
        <p className="note">Already have an account? <Link className="link" href="/login">Log in</Link></p>
      </main>
    </>
  );
}