'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cleanHandle } from './ClaimForm';

const Frames = dynamic(() => import('./ShowcaseFrames'), { ssr: false });

const STATIC = [
  { id: 'clean', name: 'Clean', note: 'Light and simple' },
  { id: 'midnight', name: 'Midnight', note: 'Dark, soft violet' },
  { id: 'studio', name: 'Studio', note: 'Warm and bold' },
] as const;

/**
 * "See your name on it." Shows the real templates with the visitor's name, never made-up people.
 * The preview code loads only when this section scrolls into view, and not at all on slow or data-saving connections.
 */
export function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lite = document.documentElement.hasAttribute('data-lite');
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (lite || saver || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setLive(true); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <label className="lp-showname" htmlFor="show-name">
        <span className="lp-sr">Your name, to preview the templates</span>
        <input id="show-name" type="text" value={name} maxLength={40} placeholder="Type your name"
          autoComplete="off" autoCapitalize="words" spellCheck={false}
          onChange={(e) => setName(e.target.value.slice(0, 40))} />
      </label>
      {live ? <Frames name={name.trim()} /> : (
        <ul className="lp-tpls lp-tpls-static" role="list">
          {STATIC.map((t) => (
            <li key={t.id}>
              <div className={`lp-tpl-thumb lp-t-${t.id}`} aria-hidden="true"><i /><i /><i /></div>
              <b>{t.name}</b>
              <span>{t.note}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="lp-claim-more">
        <Link className="lp-btn" href={`/signup${cleanHandle(name) ? `?u=${cleanHandle(name)}` : ''}`}>Claim my name</Link>
      </p>
    </div>
  );
}
