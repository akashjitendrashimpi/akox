'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/auth';
import { AuthFrame } from '../../components/app/AuthFrame';
import { Turnstile, captchaEnabled } from '../../components/Turnstile';
import { CheckEmail } from '../../components/app/CheckEmail';
import { PasswordInput } from '../../components/app/Fields';

const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [widgetKey, setWidgetKey] = useState(0);
  useEffect(() => { if (msg?.bad) { setCaptcha(''); setWidgetKey((k) => k + 1); } }, [msg]);
  const [wanted, setWanted] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    void getSupabase()?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router]);

  // The landing page sends visitors here as /signup?u=<name>. Remember it so onboarding can prefill the address.
  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get('u') ?? '';
      const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
      if (clean) {
        localStorage.setItem('akox:address', clean);
        setWanted(clean);
      }
    } catch {
      /* storage can be blocked; the address is only a convenience */
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    if (name.trim().length < 2) return setMsg({ text: 'Add your name, 2 or more characters.', bad: true });
    if (password.length < 8) return setMsg({ text: 'Use at least 8 characters for your password.', bad: true });
    if (password !== again) return setMsg({ text: 'The two passwords do not match. Try again.', bad: true });

    setBusy(true);
    setMsg(null);
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/dashboard`, captchaToken: captcha || undefined },
    });
    setBusy(false);

    if (error) return setMsg({ text: error.message, bad: true });
    if (data.user && data.user.identities?.length === 0) {
      return setMsg({ text: 'That email already has an account. Log in instead.', bad: true });
    }
    if (data.session) router.replace('/dashboard');
    else setSentTo(email.trim());
  }

  /** Sends the confirmation link again, with a fresh captcha token. Returns a readable error, or null. */
  async function resend(token: string): Promise<string | null> {
    const sb = getSupabase();
    if (!sb || !sentTo) return 'Cannot reach Akox. Check your connection and try again.';
    const { error } = await sb.auth.resend({ type: 'signup', email: sentTo, options: { emailRedirectTo: `${window.location.origin}/dashboard`, captchaToken: token || undefined } });
    return error ? 'We could not send it again yet. Wait a minute and try again.' : null;
  }

  async function google() {
    const err = await signInWithGoogle();
    if (err) setMsg({ text: err, bad: true });
  }

  const lead = wanted
    ? <>Free during early access. Next, you will confirm <span className="ap-mono">{wanted}.akox.in</span> as your address.</>
    : 'Free during early access. Your site goes live at yourname.akox.in.';

  return (
    <AuthFrame title={sentTo ? 'Almost there' : wanted ? `Claim ${wanted}.akox.in` : 'Claim your name'} lead={sentTo ? 'One more step and your name is yours.' : lead} address={wanted}
      corner={<>Have an account? <Link className="ap-textlink" href="/login">Log in</Link></>}>
      {!ready && <p className="ap-note bad" role="alert">Sign up is not connected yet. Check your .env.local file.</p>}

      {sentTo ? (
        <CheckEmail email={sentTo} address={wanted} onResend={resend} onChange={() => { setSentTo(null); setMsg(null); }} />
      ) : (
        <>
      <button type="button" className="ap-btn ap-btn-ghost ap-btn-wide" disabled={!ready} onClick={() => void google()}>Sign up with Google</button>
      <p className="ap-or">or use your email</p>

      <form onSubmit={submit}>
        <div className="ap-row2">
          <div className="ap-field">
            <label className="ap-label" htmlFor="name">Full name</label>
            <input id="name" className="ap-input" required maxLength={60} autoComplete="name" autoFocus value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="ap-field">
            <label className="ap-label" htmlFor="email">Email</label>
            <input id="email" className="ap-input" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="ap-row2">
          <div className="ap-field">
            <label className="ap-label" htmlFor="password">Password (8+ characters)</label>
            <PasswordInput id="password" required autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="ap-field">
            <label className="ap-label" htmlFor="again">Confirm password</label>
            <PasswordInput id="again" required autoComplete="new-password" value={again}
              onChange={(e) => setAgain(e.target.value)} />
          </div>
        </div>
        <Turnstile key={widgetKey} onToken={setCaptcha} />
        <button className="ap-btn ap-btn-wide ap-submit" disabled={!ready || busy || (captchaEnabled && !captcha)} aria-busy={busy}>{busy ? 'Working...' : 'Create my account'}</button>
      </form>
        </>
      )}

      <p className={msg?.bad ? 'ap-note bad ap-status' : 'ap-note ap-status'} role="status">{msg?.text ?? ' '}</p>
    </AuthFrame>
  );
}
