'use client';

import Link from 'next/link';
import { useEffect, useState, type DragEvent } from 'react';
import { BundleError, extractBundle, uploadBundle, type Bundle } from '@akox/core';
import { getSupabase } from '../../lib/supabase';
import { supabaseStore } from '../../lib/storage';
import { AppBar } from '../../components/AppBar';

type Result = { ok: true; bundle: Bundle; name: string } | { ok: false; message: string };

const mb = (n: number): string => (n / 1024 / 1024).toFixed(2) + ' MB';

export default function UploadPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void (async () => {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      const { data: p } = await sb.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (p) { setUid(user.id); setUsername(String(p.username)); }
    })();
  }, []);

  async function read(file: File | undefined) {
    if (!file) return;
    setBusy(true); setLive(false); setError('');
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      setResult({ ok: true, bundle: extractBundle(data), name: file.name });
    } catch (err) {
      setResult({ ok: false, message: err instanceof BundleError ? err.message : 'Could not read that file. Is it a .zip?' });
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    const sb = getSupabase();
    if (!sb || !uid || !result || !result.ok) return;
    setBusy(true); setError('');
    try {
      const store = supabaseStore(sb);
      const { data: old } = await sb.from('portfolio_sites').select('version').eq('owner_id', uid).maybeSingle();
      const version = Date.now().toString(36);
      await uploadBundle(result.bundle, `${uid}/${version}/`, store);
      const { error: dbErr } = await sb.from('portfolio_sites').upsert({
        owner_id: uid, version, file_count: result.bundle.files.length,
        total_bytes: result.bundle.totalBytes, updated_at: new Date().toISOString(),
      });
      if (dbErr) throw new Error(dbErr.message);
      if (old?.version) await store.deletePrefix(`${uid}/${String(old.version)}/`).catch(() => undefined);
      setLive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publishing failed.');
    } finally {
      setBusy(false);
    }
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
        <p className="lead">Zip your site folder (it needs an index.html at the top) and drop it here. Use relative links like css/style.css.</p>
        {!uid && <p className="note bad">You need to <Link className="link" href="/login">log in</Link> to publish.</p>}

        <label className="drop" htmlFor="zip" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          {busy ? 'Working...' : 'Drop a .zip here, or click to choose one'}
          <input id="zip" type="file" accept=".zip,application/zip" onChange={(e) => void read(e.target.files?.[0])} />
        </label>

        {result && !result.ok && <p className="note bad" role="alert">{result.message}</p>}

        {result && result.ok && (
          <section className="report">
            <h2>Looks good: {result.name}</h2>
            <p>{result.bundle.files.length} files, {mb(result.bundle.totalBytes)}</p>
            <ul>{result.bundle.files.slice(0, 8).map((f) => <li key={f.path}>{f.path}</li>)}</ul>
            <button className="btn" disabled={!uid || busy || live} onClick={() => void publish()}>
              {busy ? 'Publishing...' : live ? 'Published' : 'Publish to ' + (username || 'my address')}
            </button>
          </section>
        )}

        {error && <p className="note bad" role="alert">{error}</p>}
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