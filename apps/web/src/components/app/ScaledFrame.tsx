'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Shows a generated page inside a locked iframe, scaled to fit its box.
 * `sandbox=""` turns off scripts, forms, popups and same-origin access. A CSP meta tag inside the page adds a second wall:
 * only https images and the page's own inline style can load. Referrers are not sent.
 * (The iframe `csp` attribute is deliberately not used: it is Chrome-only and some versions leave srcdoc frames blank.)
 */
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; style-src 'unsafe-inline'">`;
const locked = (html: string): string => (html ? html.replace('<head>', `<head>${CSP_META}`) : html);

export function ScaledFrame({ html, width, title, decorative = false }: { html: string; width: number; title: string; decorative?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => { if (e) setSize({ w: e.contentRect.width, h: e.contentRect.height }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = size.w > 0 ? Math.min(1, size.w / width) : 1;
  const ready = size.w > 0 && size.h > 0;

  return (
    <div className="ap-sframe" ref={box}>
      {ready && (
        <div className="ap-sframe-in" style={{ width: width * scale, height: size.h }}>
          <iframe
            title={title}
            srcDoc={locked(html)}
            sandbox=""
            referrerPolicy="no-referrer"
            tabIndex={decorative ? -1 : undefined}
            aria-hidden={decorative || undefined}
            style={{ width, height: size.h / scale, transform: `scale(${scale})` }}
          />
        </div>
      )}
    </div>
  );
}
