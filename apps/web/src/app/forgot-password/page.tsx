'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AuthFrame } from '../../components/app/AuthFrame';
import { Turnstile, captchaEnabled } from '../../components/Turnstile';
import { getSupabase } from '../../lib/supabase';

const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [widgetKey, setWidgetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase || busy) return;

    setBusy(true);
    setError('');
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: captcha || undefined,
    });
    setBusy(false);

    if (requestError) {
      // A bot-check token can be used only once: ask for a fresh one before the next try.
      setCaptcha('');
      setWidgetKey((k) => k + 1);
      // Do not reveal whether an email address belongs to an account.
      setError('We could not send the reset email right now. Please wait a moment and try again.');
      return;
    }
    setSent(true);
  }

  return (
    <AuthFrame
      title={sent ? 'Check your inbox' : 'Forgot your password?'}
      lead={sent
        ? 'If an account exists for that email, a secure password reset link is on its way.'
        : 'Enter the email address connected to your AKOX account. We’ll send you a secure link to choose a new password.'}
      corner={<>Remembered it? <Link className="ap-textlink" href="/login">Back to log in</Link></>}
    >
      {!ready && <p className="ap-note bad" role="alert">Password recovery is not connected yet. Check your Supabase environment settings.</p>}

      {sent ? (
        <div aria-live="polite">
          <p className="ap-note ok">Check your inbox and spam folder. The link will expire for your security.</p>
          <button type="button" className="ap-btn ap-btn-ghost ap-btn-wide" onClick={() => { setSent(false); setCaptcha(''); }}>
            Try another email
          </button>
          <p className="ap-note">No email after a few minutes? Check the address and try again.</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label className="ap-label" htmlFor="recovery-email">Email address</label>
          <input
            id="recovery-email"
            className="ap-input"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Turnstile key={widgetKey} onToken={setCaptcha} />
          <button className="ap-btn ap-btn-wide ap-submit" disabled={!ready || busy || (captchaEnabled && !captcha)} aria-busy={busy}>
            {busy ? 'Sending link…' : 'Send reset link'}
          </button>
          <p className={error ? 'ap-note bad ap-status' : 'ap-note ap-status'} role="status">{error || ' '}</p>
        </form>
      )}
    </AuthFrame>
  );
}
