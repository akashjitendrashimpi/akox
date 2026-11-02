'use client';

import { useEffect, useRef, useState } from 'react';
import { Turnstile, captchaEnabled } from '../Turnstile';

const COOLDOWN = 30;

/** Where the "Open ..." button goes. Unknown providers get no button, only the tips, so we never send people to the wrong place. */
function inboxFor(email: string): { name: string; href: string } | null {
  const d = email.split('@')[1]?.toLowerCase() ?? '';
  if (d === 'gmail.com' || d === 'googlemail.com') return { name: 'Gmail', href: 'https://mail.google.com/' };
  if (/^(outlook|hotmail|live|msn)\./.test(d)) return { name: 'Outlook', href: 'https://outlook.live.com/mail/' };
  if (/^yahoo\./.test(d) || d === 'ymail.com') return { name: 'Yahoo Mail', href: 'https://mail.yahoo.com/' };
  if (d === 'icloud.com' || d === 'me.com') return { name: 'iCloud Mail', href: 'https://www.icloud.com/mail' };
  return null;
}

function Envelope() {
  return (
    <svg className="ap-mail-art" viewBox="0 0 160 124" fill="none" aria-hidden="true" focusable="false">
      <circle className="ap-mail-ring r1" cx="80" cy="66" r="52" />
      <circle className="ap-mail-ring r2" cx="80" cy="66" r="52" />
      <g className="ap-mail-letter">
        <rect x="36" y="20" width="88" height="66" rx="6" />
        <path d="M48 36h64M48 48h64M48 60h40" />
      </g>
      <rect className="ap-mail-body" x="16" y="46" width="128" height="72" rx="10" />
      <path className="ap-mail-front" d="M16 56 80 98l64-42v50a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10Z" />
      <path className="ap-mail-flap" d="M16 56a10 10 0 0 1 10-10h108a10 10 0 0 1 10 10L80 98Z" />
      <g className="ap-mail-badge">
        <circle cx="134" cy="30" r="16" />
        <path d="m126 30 6 6 10-12" />
      </g>
    </svg>
  );
}

type Props = {
  email: string;
  /** The address they asked for on the landing page, if any. */
  address?: string;
  /** Sends the link again. Returns an error message, or null when it worked. */
  onResend: (captchaToken: string) => Promise<string | null>;
  /** Back to the form, to fix a wrong email. */
  onChange: () => void;
};

/** Shown after sign-up instead of a one-line note. Moves focus here and announces itself to screen readers. */
export function CheckEmail({ email, address, onResend, onChange }: Props) {
  const head = useRef<HTMLHeadingElement>(null);
  const [wait, setWait] = useState(COOLDOWN);
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const [tokenKey, setTokenKey] = useState(0);
  const inbox = inboxFor(email);

  useEffect(() => { head.current?.focus(); }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  async function resend() {
    setBusy(true); setNote(null);
    const err = await onResend(token);
    setBusy(false);
    setToken('');
    setTokenKey((k) => k + 1);
    if (err) setNote({ text: err, bad: true });
    else { setNote({ text: 'Sent again. Give it a minute.', bad: false }); setWait(COOLDOWN); }
  }

  return (
    <section className="ap-mail" aria-labelledby="mail-h">
      <Envelope />
      <h2 id="mail-h" tabIndex={-1} ref={head}>Check your inbox</h2>
      <p className="ap-mail-to">We sent a link to <b>{email}</b>.</p>
      <p className="ap-mail-why">Tap it to confirm your email{address ? <> and claim <span className="ap-mono">{address}.akox.in</span></> : ''}. It takes five seconds.</p>

      {inbox && (
        <a className="ap-btn ap-btn-wide" href={inbox.href} target="_blank" rel="noopener noreferrer">Open {inbox.name}</a>
      )}

      <ul className="ap-mail-tips">
        <li>Not there? Look in <b>Spam</b> or <b>Promotions</b>.</li>
        <li>The link works on this phone or on any other device.</li>
      </ul>

      <Turnstile key={tokenKey} onToken={setToken} />

      <div className="ap-mail-actions">
        <button type="button" className="ap-btn ap-btn-ghost" disabled={wait > 0 || busy || (captchaEnabled && !token)} aria-busy={busy} onClick={() => void resend()}>
          {busy ? 'Sending...' : wait > 0 ? `Send again in ${wait}s` : 'Send it again'}
        </button>
        <button type="button" className="ap-textlink ap-mail-wrong" onClick={onChange}>Wrong email? Change it</button>
      </div>
      <p className={note?.bad ? 'ap-note bad ap-status' : 'ap-note ap-status'} role="status">{note?.text ?? ' '}</p>
    </section>
  );
}
