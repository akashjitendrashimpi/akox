'use client';

import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="akx-doc" style={{ textAlign: 'center' }}>
      <h1>Something went wrong on our side.</h1>
      <p>Your work is safe. Try again.</p>
      <p>
        <button type="button" className="ap-btn" onClick={reset}>Try again</button>{' '}
        <Link className="ap-btn ap-btn-ghost" href="/">Go home</Link>
      </p>
    </main>
  );
}
