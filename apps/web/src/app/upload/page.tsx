'use client';

import Link from 'next/link';
import { useState, type DragEvent } from 'react';
import { BundleError, checkSlug, extractBundle, type Bundle } from '@akox/core';

type Result = { ok: true; bundle: Bundle; name: string } | { ok: false; message: string };

const mb = (n: number): string => (n / 1024 / 1024).toFixed(2) + ' MB';

export default function UploadPage() {
  const [slug, setSlug] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const problem = slug ? checkSlug(slug) : null;
  const slugNote =
    problem === 'FORMAT' ? 'Use 3 to 32 letters, numbers or hyphens.' :
    problem === 'RESERVED' ? 'That name is reserved. Try another.' : '';

  async function read(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      setResult({ ok: true, bundle: extractBundle(data), name: file.name });
    } catch (err) {
      setResult({ ok: false, message: err instanceof BundleError ? err.message : 'Could not read that file. Is it a .zip?' });
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
      <header className="bar">
        <Link className="logo" href="/">akox</Link>
      </header>
      <main className="narrow">
        <h1 className="small">Check your site</h1>
        <p className="lead">Zip your site folder and drop it here. The check runs in your browser, so nothing is uploaded yet.</p>

        <label className="field" htmlFor="slug">Your address</label>
        <div className="address">
          <input id="slug" value={slug} placeholder="yourname" maxLength={32}
            onChange={(e) => setSlug(e.target.value.toLowerCase())} />
          <span className="dim">.akox.in</span>
        </div>
        <p className={problem ? 'note bad' : 'note'}>{slugNote || ' '}</p>

        <label className="drop" htmlFor="zip" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          {busy ? 'Checking...' : 'Drop a .zip here, or click to choose one'}
          <input id="zip" type="file" accept=".zip,application/zip" onChange={(e) => void read(e.target.files?.[0])} />
        </label>

        {result && !result.ok && <p className="note bad" role="alert">{result.message}</p>}

        {result && result.ok && (
          <section className="report">
            <h2>Looks good: {result.name}</h2>
            <p>{result.bundle.files.length} files, {mb(result.bundle.totalBytes)}</p>
            <ul>
              {result.bundle.files.slice(0, 10).map((f) => <li key={f.path}>{f.path}</li>)}
            </ul>
            {result.bundle.files.length > 10 && <p className="dim">and {result.bundle.files.length - 10} more</p>}
          </section>
        )}

        <button className="btn" disabled>Publish (needs login, coming next)</button>
      </main>
    </>
  );
}
