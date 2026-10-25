'use client';

import Link from 'next/link';
import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import { ClaimForm } from './ClaimForm';
import { Stack3D } from './Stack3D';

const HEADLINE = 'A website with your name on it.';

const SAMPLES: readonly string[] = ['akash', 'priya', 'rohan', 'ananya'];

/** Types sample names into the field until the visitor starts typing their own. */
function useTypedSample(active: boolean) {
  const [text, setText] = useState(SAMPLES[0] ?? '');

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let word = 0;
    let len = (SAMPLES[0] ?? '').length;
    let erasing = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const target = SAMPLES[word] ?? '';
      len += erasing ? -1 : 1;
      setText(target.slice(0, len));
      let delay = erasing ? 40 : 90;
      if (!erasing && len === target.length) {
        erasing = true;
        delay = 1800;
      } else if (erasing && len === 0) {
        erasing = false;
        word = (word + 1) % SAMPLES.length;
        delay = 300;
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 2200);
    return () => clearTimeout(timer);
  }, [active]);

  return text;
}

export function Hero() {
  const [name, setName] = useState('');
  const sample = useTypedSample(name === '');
  const handle = name || sample || 'yourname';
  const label = handle.charAt(0).toUpperCase() + handle.slice(1);

  return (
    <section className="lp-hero" aria-labelledby="hero-h">
      <div className="lp-wrap lp-hero-grid">
        <div className="lp-hero-copy">
          <h1 id="hero-h">
            {HEADLINE.split(' ').map((w, i) => (
              <Fragment key={i}>
                <span className="lp-w"><span style={{ '--w': i } as CSSProperties}>{w}</span></span>{' '}
              </Fragment>
            ))}
          </h1>
          <p className="lp-lead">
            A free portfolio website for every student and freelancer, at your own address.
          </p>
          <ClaimForm idPrefix="hero" value={name} onChange={setName} placeholder={sample} />
          <p className="lp-alt">
            <span>Free to use. Sign up with email or Google.</span>
            <Link className="lp-textlink" href="/explore">Explore portfolios</Link>
          </p>
        </div>
        {/* The 3D object sits first on small screens and beside the headline on wide ones. */}
        <Stack3D handle={handle} label={label} />
      </div>
    </section>
  );
}
