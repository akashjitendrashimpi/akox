import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="ap-page" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
      <div className="ap-narrow ap-route" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p className="ap-mono" style={{ fontSize: '3.5rem', fontWeight: 800, margin: 0, color: 'var(--peri)' }}>
          404
        </p>
        <h1 className="ap-title" style={{ marginTop: 8, marginBottom: 12 }}>
          Page not found
        </h1>
        <p className="ap-lead" style={{ margin: '0 auto 32px' }}>
          The page or portfolio address you were looking for doesn&apos;t exist or has moved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="ap-btn" href="/">
            Go to homepage
          </Link>
          <Link className="ap-btn ap-btn-ghost" href="/explore">
            Explore portfolios
          </Link>
          <Link className="ap-btn ap-btn-ghost" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

