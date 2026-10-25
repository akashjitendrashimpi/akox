'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type DragEvent } from 'react';
import { BundleError, extractBundle, limitsFor, type Bundle } from '@akox/core';
import { getSupabase } from '../../lib/supabase';
import { DAILY_LIMIT } from '../../lib/limits';
import { AppBar } from '../../components/AppBar';
import { CheckIcon, SuccessMark } from '../../components/app/Icons';
import { StorageMeter } from '../../components/app/StorageMeter';
import { describeLimits } from '../../lib/plan';

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
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  // The plan decides the limits. Until it has loaded, uploads wait, so a paid user is never checked against free limits.
  const [plan, setPlan] = useState<string | null>(null);
  const [usedBytes, setUsedBytes] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const limits = limitsFor(plan);

  const refresh = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) { setLoaded(true); return; }
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) { setLoaded(true); return; }
    setSignedIn(true);
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [{ data: p }, { count }, { data: site }] = await Promise.all([
      sb.from('profiles').select('username, plan').eq('id', user.id).maybeSingle(),
      sb.from('publish_log').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).gte('created_at', since),
      sb.from('portfolio_sites').select('previous_version, total_bytes').eq('owner_id', user.id).maybeSingle(),
    ]);
    if (p) { setUsername(String(p.username)); setPlan(p.plan ? String(p.plan) : null); }
    setUsedBytes(Number(site?.total_bytes ?? 0));
    setLeft(Math.max(0, DAILY_LIMIT - (count ?? 0)));
    setHasPrev(Boolean(site?.previous_version));
    setLoaded(true);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function read(file: File | undefined) {
    if (!file || !loaded) return;
    setBusy(true); setLive(false); setError('');
    try {
      const bundle = extractBundle(new Uint8Array(await file.arrayBuffer()), limits);
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
    setOver(false);
    void read(e.dataTransfer.files[0]);
  }

  // Where the visitor is in the flow: 1 choose a zip, 2 review it, 3 live.
  const step = live ? 3 : result && result.ok ? 2 : 1;

  return (
    <>
      <AppBar />
      <main className="ap-wrap ap-page">
        <div className="ap-narrow">
          <h1 className="ap-title">Upload your site</h1>
          <p className="ap-lead">Your portfolio is one site. Zip the folder (it needs an index.html at the top) and drop it here. You can replace it up to {DAILY_LIMIT} times a day.</p>
          <p className="ap-limits" aria-live="polite">{loaded ? describeLimits(plan, limits) : 'Checking your plan limits...'}</p>
          <ol className="ap-stepper" aria-label="Upload progress">
            {['Choose your zip', 'Review', 'Go live'].map((label, i) => (
              <li key={label} className={i + 1 < step || step === 3 && i === 2 ? 'is-done' : i + 1 === step ? 'is-now' : ''}
                aria-current={i + 1 === step ? 'step' : undefined}>
                <span>{i + 1 < step || (step === 3 && i === 2) ? <CheckIcon size={14} strokeWidth={3.5} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          {!signedIn && <p className="ap-note bad">You need to <Link className="ap-textlink" href="/login">log in</Link> to publish.</p>}
          {signedIn && (
            <div className="ap-meter">
              <p className="ap-note" style={{ margin: 0 }}>Uploads left today: {left} of {DAILY_LIMIT}</p>
              <div className="ap-progress" role="progressbar" aria-label="Uploads left today" aria-valuemin={0} aria-valuemax={DAILY_LIMIT} aria-valuenow={left}>
                <i style={{ width: `${(left / DAILY_LIMIT) * 100}%` }} />
              </div>
            </div>
          )}
          {signedIn && <StorageMeter used={usedBytes} plan={plan} />}

          <label
            className={`ap-drop${over ? ' is-over' : ''}${busy ? ' is-busy' : ''}`}
            htmlFor="zip"
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setOver(true)}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V4m0 0L7 9m5-5 5 5M4 20h16" />
            </svg>
            <span className="ap-drop-main">{!loaded ? 'Loading your plan...' : busy ? 'Working...' : 'Drop a .zip here, or click to choose one'}</span>
            <input id="zip" type="file" accept=".zip,application/zip" disabled={!loaded} onChange={(e) => void read(e.target.files?.[0])} />
          </label>

          {result && !result.ok && (
            <div className="ap-alert" role="alert"><b>This zip cannot be published</b><span>{result.message}</span></div>
          )}

          {result && result.ok && (
            <section className="ap-panel" style={{ marginTop: 16 }}>
              <h2 className="ap-h2">Looks good: {result.file.name}</h2>
              <p className="ap-note" style={{ margin: 0 }}>{result.bundle.files.length} files, {mb(result.bundle.totalBytes)}</p>
              <ul className="ap-files">
                {result.bundle.files.slice(0, 8).map((f) => <li key={f.path}>{f.path}</li>)}
                {result.bundle.files.length > 8 && <li>and {result.bundle.files.length - 8} more</li>}
              </ul>
              <button className="ap-btn" aria-busy={busy} disabled={!signedIn || busy || left === 0} onClick={() => void publish()}>
                {left === 0 ? 'No uploads left today' : busy ? 'Publishing...' : 'Publish to ' + (username || 'my address')}
              </button>
            </section>
          )}

          {error && <div className="ap-alert" role="alert"><b>Upload failed</b><span>{error}</span></div>}

          {hasPrev && (
            <p className="ap-note" style={{ marginTop: 20 }}>Made a mistake? <button className="ap-btn ap-btn-ghost ap-btn-sm" disabled={busy} onClick={() => void goBack()}>Go back to the previous version</button></p>
          )}

          {live && (
            <section className="ap-panel ap-celebrate" style={{ marginTop: 16 }} role="status">
              <h2 className="ap-h2 ap-live"><SuccessMark />Your site is live</h2>
              <p className="ap-note">On this computer it opens at /s/{username}.</p>
              <a className="ap-btn" href={'/s/' + username + '/'} target="_blank" rel="noopener">Open my site</a>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
