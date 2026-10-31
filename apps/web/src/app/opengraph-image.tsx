import { ImageResponse } from 'next/og';
import { SHARE } from '../lib/brand';

export const alt = 'Akox. A website with your name on it. yourname.akox.in';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** 1200 x 630 share card. Keep text 80px inside the edges: chat apps crop. */
export default function OgImage() {
  const tri = (h: number) => (
    <svg width={h} height={h * 0.92} viewBox="0 0 12 11"><path d="M6 .4 11.6 10.6H.4Z" fill="#FFB020" /></svg>
  );
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#100E2A', color: '#EEEDFB', padding: '64px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
          akox{tri(34)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3, maxWidth: 940 }}>{SHARE.ogTitle}</div>
          <div style={{ fontSize: 44, color: '#A9A1FF', fontFamily: 'monospace' }}>yourname.akox.in</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: '#B0AED6' }}>
          <span>Free during early access</span>
          <span>Made in India</span>
        </div>
      </div>
    ),
    size,
  );
}
