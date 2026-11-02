'use client';

import { useState, type FormEvent } from 'react';
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

/**
 * No new backend: the report opens the person's own mail app with everything filled in.
 * Replace with a real endpoint when one exists (see implementation notes).
 */
export function ReportForm({ initialAddress }: { initialAddress: string }) {
  const [address, setAddress] = useState(initialAddress);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState('');
  const [good, setGood] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = `Site: ${address}\nProblem: ${reason}\n\n${details}`;
    window.location.href = `mailto:${BRAND.email}?subject=${encodeURIComponent('Report a site: ' + address)}&body=${encodeURIComponent(body)}`;
    setSent(true);
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
      <label className="akx-check">
        <input type="checkbox" required checked={good} onChange={(e) => setGood(e.target.checked)} />
        I am reporting in good faith.
      </label>
      <button className="ap-btn ap-btn-wide" type="submit">Send report</button>
      <p className="ap-note ap-status" role="status">
        {sent ? 'Your mail app should open with the report ready. Press send there. If nothing opened, write to ' + BRAND.email + '.' : ' '}
      </p>
    </form>
  );
}
