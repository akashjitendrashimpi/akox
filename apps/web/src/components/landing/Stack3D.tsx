'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { SITE_SUFFIX } from '../../lib/site-url';

const TILES = ['t1', 't2', 't3'] as const;
/** Particle positions: left %, top %, depth (cqw), size (em). Fixed, so server and browser render the same thing. */
const SPARKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [6, 58, -18, 0.5], [90, 14, -8, 0.4], [78, 82, 6, 0.55], [30, 8, 10, 0.35],
  [96, 52, -20, 0.3], [14, 88, -4, 0.4], [58, 2, -24, 0.3],
];

/**
 * A small CSS-3D object: three cards stacked in depth. The front card is a live preview of the address
 * being typed. The stack follows the mouse, and drifts on its own when nobody is moving it.
 * No WebGL and no extra packages, so it stays light. Decorative, so hidden from screen readers.
 */
export function Stack3D({ handle, label }: { handle: string; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let lastMove = -Infinity;
    let raf = 0;
    let visible = true;

    const clamp = (n: number) => Math.max(-1, Math.min(1, n));
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = root.getBoundingClientRect();
      tx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)) * 16;
      ty = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)) * -10;
      lastMove = performance.now();
    };

    const frame = (t: number) => {
      const idle = t - lastMove > 2500;
      const gx = idle ? Math.sin(t / 2600) * 10 : tx;
      const gy = idle ? Math.cos(t / 3300) * 4 : ty;
      cx += (gx - cx) * 0.06;
      cy += (gy - cy) * 0.06;
      scene.style.setProperty('--ry', cx.toFixed(2));
      scene.style.setProperty('--rx', cy.toFixed(2));
      raf = requestAnimationFrame(frame);
    };

    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible && !document.hidden) start(); else stop();
    });
    io.observe(root);
    const onVis = () => { if (document.hidden) stop(); else if (visible) start(); };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    start();
    return () => {
      stop();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className="lp-3d" ref={rootRef} aria-hidden="true">
      <div className="lp-floor" />
      <div className="lp-shadow" />
      <div className="lp-3d-scene" ref={sceneRef}>
        {/* Orbit rings and floating particles give the stack a space to sit in. */}
        <div className="lp-orbit lp-o1" />
        <div className="lp-orbit lp-o2" />
        {SPARKS.map((sp, k) => (
          <i key={k} className="lp-spark" style={{ '--x': sp[0], '--y': sp[1], '--z': sp[2], '--s': sp[3], '--d': `${-k * 1.3}s` } as CSSProperties} />
        ))}

        {/* Back: a gallery */}
        <div className="lp-layer lp-l-back">
          <div className="lp-bob" style={{ '--d': '0s' } as CSSProperties}>
            <div className="lp-gal"><i /><i /><i /><i /><i /><i /></div>
          </div>
        </div>

        {/* Middle: code */}
        <div className="lp-layer lp-l-mid">
          <div className="lp-bob" style={{ '--d': '-1.6s' } as CSSProperties}>
            <div className="lp-code">
              <span className="lp-dots"><i /><i /><i /></span>
              <p><b className="k">const</b> site = {'{'}</p>
              <p>&nbsp;&nbsp;name: <b className="s">&quot;{handle}&quot;</b>,</p>
              <p>&nbsp;&nbsp;live: <b className="k">true</b>,</p>
              <p>{'}'}</p>
            </div>
          </div>
        </div>

        {/* Front: the live preview */}
        <div className="lp-layer lp-l-front">
          <div className="lp-bob" style={{ '--d': '-3.2s' } as CSSProperties}>
            <div className="lp-card">
              <div className="lp-chrome">
                <span className="lp-dots"><i /><i /><i /></span>
                <span className="lp-url">
                  <span className="lp-lock" />
                  <span className="lp-url-text">{handle}<span className="lp-url-dim">{SITE_SUFFIX}</span></span>
                </span>
              </div>
              <div className="lp-site">
                <div className="lp-id">
                  <div className="lp-avatar lp-build" style={{ '--i': 0 } as CSSProperties}>{handle.charAt(0)}</div>
                  <p className="lp-site-name lp-build" style={{ '--i': 1 } as CSSProperties}>
                    {/* Each letter is keyed by position and character, so only newly typed letters play the entrance. */}
                    {[...label].map((c, k) => <span key={`${k}${c}`} className="lp-ch">{c}</span>)}
                  </p>
                  <div className="lp-build" style={{ '--i': 2 } as CSSProperties}>
                    <span className="lp-sk" style={{ width: '88%' }} />
                    <span className="lp-sk" style={{ width: '62%' }} />
                  </div>
                </div>
                <div className="lp-tiles">
                  {TILES.map((t, i) => (
                    <div key={t} className={`lp-tile lp-build ${t}`} style={{ '--i': i + 3 } as CSSProperties} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating badge, closest to the viewer */}
        <div className="lp-layer lp-l-badge">
          <div className="lp-bob" style={{ '--d': '-2s' } as CSSProperties}>
            <span className="lp-live"><i />Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
