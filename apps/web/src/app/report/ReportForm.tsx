'use client';

import { useState, type FormEvent } from 'react';
import { Turnstile, captchaEnabled } from '../../components/Turnstile';
import { BRAND } from '../../lib/brand';

const REASONS = [
  'Scam or fake login page',
  'Pretends to be someone',
  'Harassment or hate',
  'Sexual content or child safety',
  'My work was copied',
  'Malware',
  'Private information',
  'Something else',
] as const;

/** Sends the report to our server, which stores it, checks for bots, and emails us. */
export function ReportForm({ initialAddress }: { initialAddress: string }) {
  const [address, setAddress] = useState(initialAddress);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [good, setGood] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [widgetKey, setWidgetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ reference: string; emailed: boolean } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, reason, details, email, captchaToken: captcha }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; reference?: string; emailed?: boolean };
      if (!res.ok || !body.reference) throw new Error(body.error ?? 'Could not send your report.');
      setDone({ reference: body.reference, emailed: Boolean(body.emailed) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your report.');
      // A bot-check token works once, so ask for a fresh one before the next try.
      setCaptcha('');
      setWidgetKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  const fallback = `mailto:${BRAND.email}?subject=${encodeURIComponent('Report a site: ' + address)}&body=${encodeURIComponent(`Site: ${address}\nProblem: ${reason}\n\n${details}`)}`;

  if (done) {
    return (
      <div className="akx-help" role="status" aria-live="polite">
        <p><b>Report received.</b> Your reference is <b>{done.reference}</b>. Keep it if you write to us about this report.</p>
        {done.emailed && <p>We sent a confirmation to {email}.</p>}
      </div>
    );
  }

  return (
    <form className="akx-form" onSubmit={submit}>
      <div className="ap-field">
        <label className="ap-label" htmlFor="rp-site">Site address</label>
        <input id="rp-site" className="ap-input" required maxLength={120} placeholder="name.akox.in" autoCapitalize="none" spellCheck={false}
          value={address} onChange={(e) => setAddress(e.target.value.trim())} />
      </div>
      <fieldset>
        <legend>What is wrong?</legend>
        {REASONS.map((r) => (
          <label key={r} className="akx-opt">
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />{r}
          </label>
        ))}
      </fieldset>
      <div className="ap-field">
        <label className="ap-label" htmlFor="rp-details">Details</label>
        <textarea id="rp-details" className="ap-input" required minLength={10} maxLength={1000} rows={5}
          value={details} onChange={(e) => setDetails(e.target.value)} />
        <p className="ap-note" style={{ margin: '6px 0 0' }}>{details.length} of 1000 characters. Say what you saw and where.</p>
      </div>
      <div className="ap-field">
        <label className="ap-label" htmlFor="rp-email">Your email (optional)</label>
        <input id="rp-email" className="ap-input" type="email" maxLength={254} autoComplete="email" placeholder="So we can confirm and reply"
          value={email} onChange={(e) => setEmail(e.target.value.trim())} />
      </div>
      <label className="akx-check">
        <input type="checkbox" required checked={good} onChange={(e) => setGood(e.target.checked)} />
        I am reporting in good faith.
      </label>
      <Turnstile key={widgetKey} onToken={setCaptcha} />
      <button className="ap-btn ap-btn-wide" type="submit" disabled={busy || (captchaEnabled && !captcha)} aria-busy={busy}>
        {busy ? 'Sending…' : 'Send report'}
      </button>
      <p className={error ? 'ap-note bad ap-status' : 'ap-note ap-status'} role="status">
        {error ? <>{error} <a href={fallback}>Email us instead</a>.</> : ' '}
      </p>
    </form>
  );
}
