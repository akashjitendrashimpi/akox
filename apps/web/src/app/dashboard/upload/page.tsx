'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type DragEvent } from 'react';
import { BundleError, extractBundle, limitsFor, type Bundle } from '@akox/core';
import { getSupabase } from '../../../lib/supabase';
import { DAILY_LIMIT } from '../../../lib/limits';
import { describeLimits, fmtBytes } from '../../../lib/plan';
import { asKind, confirmReplace, fmtWhen, kindLabel, type SiteKind } from '../../../lib/liveSite';
import { ArrowIcon, CheckIcon, ChevronLeftIcon, SuccessMark, UploadIcon } from '../../../components/app/Icons';
import { PageHeader } from '../../../components/app/PageHeader';
import { StorageMeter } from '../../../components/app/StorageMeter';
import { siteUrl } from '../../../lib/site-url';

type Result = { ok: true; bundle: Bundle; file: File } | { ok: false; message: string };
type View = 1 | 2 | 3;

const STEPS = ['Choose your zip', 'Review', 'Go live'] as const;

async function token(): Promise<string | null> {
  const res = await getSupabase()?.auth.getSession();
  return res?.data.session?.access_token ?? null;
}

export default function UploadPage() {
  const [view, setView] = useState<View>(1);
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
  const [kind, setKind] = useState<SiteKind | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
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
      sb.from('portfolio_sites').select('previous_version, total_bytes, kind, updated_at').eq('owner_id', user.id).maybeSingle(),
    ]);
    if (p) { setUsername(String(p.username)); setPlan(p.plan ? String(p.plan) : null); }
    setUsedBytes(Number(site?.total_bytes ?? 0));
    setLeft(Math.max(0, DAILY_LIMIT - (count ?? 0)));
    setHasPrev(Boolean(site?.previous_version));
    setKind(site ? asKind(site.kind) : null);
    setUpdatedAt(site?.updated_at ? String(site.updated_at) : null);
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
    if (await send('/api/publish', { headers: { 'Content-Type': 'application/zip' }, body: result.file })) { setLive(true); setView(3); }
  }

  async function goBack() {
    if (!window.confirm('Switch your site back to the previous version?')) return;
    if (await send('/api/rollback', {})) { setLive(true); setView(3); }
  }

  function startOver() {
    setResult(null); setLive(false); setError(''); setView(1);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setOver(false);
    void read(e.dataTransfer.files[0]);
  }

  const picked = result && result.ok ? result : null;

  return (
    <>
      <PageHeader title="Upload your site" lead="Zip the folder of your site and publish it at your address." />

      <ol className="ap-stepper" aria-label="Upload progress">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < view || (view === 3 && n === 3);
          return (
            <li key={label} className={done ? 'is-done' : n === view ? 'is-now' : ''} aria-current={n === view ? 'step' : undefined}>
              <span>{done ? <CheckIcon size={14} strokeWidth={3.5} /> : n}</span>
              {label}
            </li>
          );
        })}
      </ol>

      <div className="ap-wiz-grid">
        <section className="ap-panel ap-wiz" aria-label={STEPS[view - 1]}>
          <div className="ap-wiz-body ap-step" key={view}>
            {view === 1 && (
              <>
                <h2 className="ap-h2">Choose your zip</h2>
                <p className="ap-note" style={{ margin: '0 0 12px' }}>Zip the folder that holds your index.html and drop it here. We check it in your browser first, so nothing is sent until you press publish. You can replace your site up to {DAILY_LIMIT} times a day.</p>
                <p className="ap-limits" aria-live="polite">{loaded ? describeLimits(plan, limits) : 'Checking your plan limits...'}</p>
                {!signedIn && loaded && <p className="ap-note bad">You need to <Link className="ap-textlink" href="/login">log in</Link> to publish.</p>}

                <label
                  className={`ap-drop${over ? ' is-over' : ''}${busy ? ' is-busy' : ''}${picked ? ' is-picked' : ''}`}
                  htmlFor="zip"
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setOver(true)}
                  onDragLeave={() => setOver(false)}
                  onDrop={onDrop}
                >
                  {picked ? <CheckIcon size={30} className="ap-pop" /> : <UploadIcon size={34} />}
                  <span className="ap-drop-main">
                    {!loaded ? 'Loading your plan...' : busy ? 'Working...' : picked ? picked.file.name : 'Drop your .zip here, or click to pick one'}
                  </span>
                  {picked && !busy && (
                    <span className="ap-drop-sub">{picked.bundle.files.length} files, {fmtBytes(picked.bundle.totalBytes)}. Click to choose a different zip.</span>
                  )}
                  <input id="zip" type="file" accept=".zip,application/zip" disabled={!loaded} onChange={(e) => void read(e.target.files?.[0])} />
                </label>

                {result && !result.ok && (
                  <div className="ap-alert" role="alert"><b>This zip cannot be published</b><span>{result.message}</span></div>
                )}
              </>
            )}

            {view === 2 && picked && (
              <>
                <h2 className="ap-h2">Review and publish</h2>
                <p className="ap-note" style={{ margin: '0 0 14px' }}>Everything below goes live at <span className="ap-mono">{username || 'your address'}.akox.in</span>.</p>
                <dl className="ap-facts">
                  <div><dt>File</dt><dd>{picked.file.name}</dd></div>
                  <div><dt>Files</dt><dd>{picked.bundle.files.length}</dd></div>
                  <div><dt>Size</dt><dd>{fmtBytes(picked.bundle.totalBytes)} of {fmtBytes(limits.maxUnpackedBytes)}</dd></div>
                </dl>
                <ul className="ap-files">
                  {picked.bundle.files.slice(0, 6).map((f) => <li key={f.path}>{f.path}</li>)}
                  {picked.bundle.files.length > 6 && <li>and {picked.bundle.files.length - 6} more</li>}
                </ul>
                {!signedIn && <p className="ap-note bad">You need to <Link className="ap-textlink" href="/login">log in</Link> to publish.</p>}
                {error && <div className="ap-alert" role="alert"><b>Upload failed</b><span>{error}</span></div>}
              </>
            )}

            {view === 3 && (
              <div className="ap-celebrate" role="status">
                <h2 className="ap-h2 ap-live"><SuccessMark />Your site is live</h2>
                <p className="ap-live-url ap-mono">{username}.akox.in</p>
                <p className="ap-note">On this computer it opens at /s/{username}.</p>
                <div className="ap-actions">
                  <a className="ap-btn" href={siteUrl(username)} target="_blank" rel="noopener">Open my site</a>
                  <button type="button" className="ap-btn ap-btn-ghost" onClick={startOver}>Upload another version</button>
                </div>
              </div>
            )}
          </div>

          {view !== 3 && (
            <footer className="ap-wiz-foot">
              {view === 2 ? (
                <button type="button" className="ap-btn ap-btn-ghost" disabled={busy} onClick={() => { setView(1); setError(''); }}>
                  <ChevronLeftIcon size={18} />Back
                </button>
              ) : <span className="ap-wiz-hint">{picked ? 'Looks good. Continue to review.' : 'Choose a zip to continue.'}</span>}

              {view === 1 ? (
                <button type="button" className="ap-btn" disabled={!picked || busy} onClick={() => setView(2)}>
                  Next<ArrowIcon size={18} className="ap-nudge" />
                </button>
              ) : (
                <button type="button" className="ap-btn" aria-busy={busy} disabled={!signedIn || busy || left === 0} onClick={() => { if (confirmReplace(kind, 'zip')) void publish(); }}>
                  {left === 0 ? 'No uploads left today' : busy ? 'Publishing...' : 'Publish to ' + (username || 'my address')}
                </button>
              )}
            </footer>
          )}
        </section>

        <aside className="ap-wiz-aside" aria-label="Your limits">
          {signedIn && (
            <div className="ap-meter ap-panel">
              <p className="ap-note" style={{ margin: 0 }}>Uploads left today: {left} of {DAILY_LIMIT}</p>
              <div className="ap-slots" role="progressbar" aria-label="Uploads left today" aria-valuemin={0} aria-valuemax={DAILY_LIMIT} aria-valuenow={left}>
                {Array.from({ length: DAILY_LIMIT }, (_, k) => <i key={k} className={k < left ? 'is-on' : ''} />)}
              </div>
            </div>
          )}
          {signedIn && (
            <div className="ap-panel ap-livenow">
              <p className="ap-note" style={{ margin: 0 }}>{kind ? <>Live now: <b>{kindLabel(kind)}</b>{updatedAt ? `, updated ${fmtWhen(updatedAt)}` : ''}</> : 'Nothing is published yet.'}</p>
            </div>
          )}
          {signedIn && <StorageMeter used={usedBytes} plan={plan} />}
          {hasPrev && (
            <div className="ap-panel">
              <p className="ap-note" style={{ margin: '0 0 10px' }}>Made a mistake?</p>
              <button className="ap-btn ap-btn-ghost ap-btn-sm" disabled={busy} onClick={() => void goBack()}>Go back to the previous version</button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
