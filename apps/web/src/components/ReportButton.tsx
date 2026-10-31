'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { getSupabase } from '../lib/supabase';

export function ReportButton({ ownerId }: { ownerId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');

  async function send(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    const res = await sb?.auth.getSession();
    const me = res?.data.session?.user;
    if (!sb || !me) { setMsg('Log in to report this site, or use the Report a site page.'); return; }
    const { error } = await sb.from('site_reports').insert({ owner_id: ownerId, reporter_id: me.id, reason: reason.trim() });
    if (error) {
      setMsg(error.code === '23505' ? 'You already reported this portfolio.' : error.message);
    } else {
      setMsg('Thank you. We will review it.');
      setOpen(false);
      setReason('');
    }
  }

  return (
    <div className="ap-report">
      {!open && <button className="ap-btn ap-btn-ghost ap-btn-sm" onClick={() => setOpen(true)}>Report this portfolio</button>}
      {open && (
        <form onSubmit={send}>
          <label className="ap-label" htmlFor="why">What is wrong with it?</label>
          <textarea id="why" className="ap-input" required minLength={3} maxLength={500} value={reason}
            onChange={(e) => setReason(e.target.value)} />
          <div className="ap-actions" style={{ marginTop: 16 }}>
            <button className="ap-btn ap-btn-sm">Send report</button>
            <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
      <p className="ap-note ap-status" role="status">{msg || ' '} {msg.startsWith('Please log in') && <Link className="ap-textlink" href="/login">Log in</Link>}</p>
    </div>
  );
}
