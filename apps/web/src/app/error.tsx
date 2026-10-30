'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client error safely
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="ap-page" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
      <div className="ap-narrow ap-route" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p className="ap-mono" style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'var(--bad)' }}>
          !
        </p>
        <h1 className="ap-title" style={{ marginTop: 8, marginBottom: 12 }}>
          Something went wrong
        </h1>
        <p className="ap-lead" style={{ margin: '0 auto 28px' }}>
          An unexpected error occurred while loading this page. You can try refreshing or returning home.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="ap-btn" onClick={() => reset()}>
            Try again
          </button>
          <Link className="ap-btn ap-btn-ghost" href="/">
            Back to home
          </Link>
          <Link className="ap-btn ap-btn-ghost" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

