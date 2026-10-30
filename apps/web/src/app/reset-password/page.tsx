'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { AuthFrame } from '../../components/app/AuthFrame';
import { PasswordInput } from '../../components/app/Fields';
import { getSupabase } from '../../lib/supabase';

const RECOVERY_MARKER = 'akox:password-recovery';
const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type RecoveryState = 'checking' | 'ready' | 'invalid' | 'updated';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setRecoveryState('invalid');
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        try { window.sessionStorage.setItem(RECOVERY_MARKER, '1'); } catch { /* session storage is optional */ }
        setRecoveryState('ready');
      }
    });

    // Supabase exchanges the one-time recovery code from the URL for a session.
    // The session-scoped marker allows a refresh of this page without accepting an ordinary login session.
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      let marker = false;
      try { marker = window.sessionStorage.getItem(RECOVERY_MARKER) === '1'; } catch { /* storage may be blocked */ }
      if (!sessionError && data.session && marker) setRecoveryState('ready');
      else setRecoveryState('invalid');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase || busy || recoveryState !== 'ready') return;
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError('This reset link may have expired or already been used. Request a new one and try again.');
      return;
    }

    try { window.sessionStorage.removeItem(RECOVERY_MARKER); } catch { /* storage is optional */ }
    setPassword('');
    setConfirmPassword('');
    setRecoveryState('updated');
  }

  const title = recoveryState === 'updated'
    ? 'Password updated'
    : recoveryState === 'invalid'
      ? 'Reset link unavailable'
      : recoveryState === 'checking'
        ? 'Checking your reset link…'
        : 'Choose a new password';

  const lead = recoveryState === 'updated'
    ? 'Your AKOX password has been changed. You can now sign in with your new password.'
    : recoveryState === 'invalid'
      ? 'This link is invalid, expired, or has already been used. Request a fresh reset link to continue.'
      : recoveryState === 'checking'
        ? 'Please wait while we securely verify your link.'
        : 'Use at least 8 characters. Choose a password you do not use on other websites.';

  return (
    <AuthFrame title={title} lead={lead}
      corner={<>Remembered it? <Link className="ap-textlink" href="/login">Log in</Link></>}>
      {!ready && <p className="ap-note bad" role="alert">Password recovery is not connected yet. Check your Supabase environment settings.</p>}

      {recoveryState === 'checking' && <p className="ap-note" role="status">Verifying your secure recovery session…</p>}

      {recoveryState === 'invalid' && (
        <div>
          <p className="ap-note bad" role="alert">For your security, password changes are only allowed from a valid recovery link.</p>
          <Link className="ap-btn ap-btn-wide" href="/forgot-password" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            Request a new link
          </Link>
        </div>
      )}

      {recoveryState === 'ready' && (
        <form onSubmit={submit}>
          <label className="ap-label" htmlFor="new-password">New password</label>
          <PasswordInput id="new-password" required minLength={8} autoComplete="new-password" value={password}
            onChange={(event) => setPassword(event.target.value)} />
          <label className="ap-label" htmlFor="confirm-new-password">Confirm new password</label>
          <PasswordInput id="confirm-new-password" required minLength={8} autoComplete="new-password" value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)} />
          <p className="ap-note">At least 8 characters. Avoid reusing an old password.</p>
          <button className="ap-btn ap-btn-wide ap-submit" disabled={!ready || busy || !password || !confirmPassword} aria-busy={busy}>
            {busy ? 'Updating password…' : 'Update password'}
          </button>
          <p className={error ? 'ap-note bad ap-status' : 'ap-note ap-status'} role="status">{error || ' '}</p>
        </form>
      )}

      {recoveryState === 'updated' && (
        <div aria-live="polite">
          <p className="ap-note ok">Your password is ready to use.</p>
          <button type="button" className="ap-btn ap-btn-wide" onClick={() => router.replace('/login')}>
            Continue to log in
          </button>
        </div>
      )}
    </AuthFrame>
  );
}
