'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/auth';
import { AuthFrame } from '../../components/app/AuthFrame';
import { Turnstile, captchaEnabled } from '../../components/Turnstile';
import { PasswordInput } from '../../components/app/Fields';

const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [widgetKey, setWidgetKey] = useState(0);
  useEffect(() => { if (msg) { setCaptcha(''); setWidgetKey((k) => k + 1); } }, [msg]);

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
    const { error } = await sb.auth.signInWithPassword({ email, password, options: { captchaToken: captcha || undefined } });
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
    <AuthFrame title="Welcome back" lead="Log in to manage your portfolio."
      corner={<>New here? <Link className="ap-textlink" href="/signup">Create an account</Link></>}>
      {!ready && <p className="ap-note bad" role="alert">Login is not connected yet. Check your .env.local file.</p>}

      <button type="button" className="ap-btn ap-btn-ghost ap-btn-wide" disabled={!ready} onClick={() => void google()}>Continue with Google</button>
      <p className="ap-or">or use your email</p>

      <form onSubmit={submit}>
        <label className="ap-label" htmlFor="email">Email</label>
        <input id="email" className="ap-input" type="email" required autoComplete="email" autoFocus value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <label className="ap-label" htmlFor="password">Password</label>
        <PasswordInput id="password" required autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <p style={{ margin: '9px 0 2px', textAlign: 'right', fontSize: '.92rem' }}>
          <Link className="ap-textlink" href="/forgot-password">Forgot password?</Link>
        </p>
        <Turnstile key={widgetKey} onToken={setCaptcha} />
        <button className="ap-btn ap-btn-wide ap-submit" disabled={!ready || busy || (captchaEnabled && !captcha)} aria-busy={busy}>{busy ? 'Please wait...' : 'Log in'}</button>
      </form>

      <p className={msg ? 'ap-note bad ap-status' : 'ap-note ap-status'} role="status">{msg || ' '}</p>
    </AuthFrame>
  );
}
