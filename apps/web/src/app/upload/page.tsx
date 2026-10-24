'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type DragEvent } from 'react';
import { BundleError, extractBundle, type Bundle } from '@akox/core';
import { getSupabase } from '../../lib/supabase';
import { DAILY_LIMIT } from '../../lib/limits';
import { AppBar } from '../../components/AppBar';

type Result = { ok: true; bundle: Bundle; file: File } | { ok: false; message: string };

const mb = (n: number): string => (n / 1024 / 1024).toFixed(2) + ' MB';

async function token(): Promise<string | null> {
  const res = await getSupabase()?.auth.getSession();
  return res?.data.session?.access_token ?? null;
}

export default function UploadPage() {
  const [username, setUsername] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [left, setLeft] = useState(DAILY_LIMIT);
  const [hasPrev, setHasPrev] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) return;
    setSignedIn(true);
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [{ data: p }, { count }, { data: site }] = await Promise.all([
      sb.from('profiles').select('username').eq('id', user.id).maybeSingle(),
      sb.from('publish_log').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).gte('created_at', since),
      sb.from('portfolio_sites').select('previous_version').eq('owner_id', user.id).maybeSingle(),
    ]);
    if (p) setUsername(String(p.username));
    setLeft(Math.max(0, DAILY_LIMIT - (count ?? 0)));
    setHasPrev(Boolean(site?.previous_version));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function read(file: File | undefined) {
    if (!file) return;
    setBusy(true); setLive(false); setError('');
    try {
      const bundle = extractBundle(new Uint8Array(await file.arrayBuffer()));
      setResult({ ok: true, bundle, file });
    } catch (err) {
      setResult({ ok: false, message: err instanceof BundleError ? err.message : 'Could not read that file. Is it a .zip?' });
    } finally {
      setBusy(false);
    }
  }

  async function send(path: string, init: RequestInit): Promise<boolean> {
    const t = await token();
    if (!t) { setError('Please log in again.'); return false; }
    setBusy(true); setError('');
    const res = await fetch(path, { ...init, method: 'POST', headers: { ...init.headers, Authorization: `Bearer ${t}` } });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) { setError(body.error ?? 'Something went wrong.'); return false; }
    await refresh();
    return true;
  }

  async function publish() {
    if (!result || !result.ok) return;
    if (await send('/api/publish', { headers: { 'Content-Type': 'application/zip' }, body: result.file })) setLive(true);
  }

  async function goBack() {
    if (!window.confirm('Switch your site back to the previous version?')) return;
    if (await send('/api/rollback', {})) setLive(true);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    void read(e.dataTransfer.files[0]);
  }

  return (
    <>
      <AppBar />
      <main className="narrow">
        <h1 className="small">Upload your site</h1>
        <p className="lead">Your portfolio is one site. Zip the folder (it needs an index.html at the top) and drop it here. You can replace it up to {DAILY_LIMIT} times a day.</p>
        {!signedIn && <p className="note bad">You need to <Link className="link" href="/login">log in</Link> to publish.</p>}
        {signedIn && <p className="note">Uploads left today: {left} of {DAILY_LIMIT}</p>}

        <label className="drop" htmlFor="zip" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          {busy ? 'Working...' : 'Drop a .zip here, or click to choose one'}
          <input id="zip" type="file" accept=".zip,application/zip" onChange={(e) => void read(e.target.files?.[0])} />
        </label>

        {result && !result.ok && <p className="note bad" role="alert">{result.message}</p>}

        {result && result.ok && (
          <section className="report">
            <h2>Looks good: {result.file.name}</h2>
            <p>{result.bundle.files.length} files, {mb(result.bundle.totalBytes)}</p>
            <ul>{result.bundle.files.slice(0, 8).map((f) => <li key={f.path}>{f.path}</li>)}</ul>
            <button className="btn" disabled={!signedIn || busy || left === 0} onClick={() => void publish()}>
              {left === 0 ? 'No uploads left today' : busy ? 'Publishing...' : 'Publish to ' + (username || 'my address')}
            </button>
          </section>
        )}

        {error && <p className="note bad" role="alert">{error}</p>}

        {hasPrev && (
          <p className="note">Made a mistake? <button className="btn ghost" disabled={busy} onClick={() => void goBack()}>Go back to the previous version</button></p>
        )}

        {live && (
          <section className="report">
            <h2>Your site is live</h2>
            <p>On this computer it opens at /s/{username}.</p>
            <a className="btn" href={'/s/' + username + '/'} target="_blank" rel="noopener">Open my site</a>
          </section>
        )}
      </main>
    </>
  );
}