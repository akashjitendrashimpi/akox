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
    if (!sb || !me) { setMsg('Please log in to report a portfolio.'); return; }
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
    <div style={{ marginTop: 32 }}>
      {!open && <button className="btn ghost" onClick={() => setOpen(true)}>Report this portfolio</button>}
      {open && (
        <form onSubmit={send}>
          <label className="field" htmlFor="why">What is wrong with it?</label>
          <textarea id="why" className="text" required minLength={3} maxLength={500} value={reason}
            onChange={(e) => setReason(e.target.value)} />
          <div className="nav">
            <button className="btn">Send report</button>
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
      <p className="note" role="status">{msg || ' '} {msg.startsWith('Please log in') && <Link className="link" href="/login">Log in</Link>}</p>
    </div>
  );
}