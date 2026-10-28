'use client';

import { useEffect, useMemo, useState } from 'react';
import { directImage } from '../../lib/siteBuilder';

type State = 'idle' | 'checking' | 'ok' | 'bad';

/**
 * Under a picture-link field: tries the link as an image and says what happened, so a page link
 * (like a Google Images result) is caught before publishing. It only advises; publishing is not blocked by it.
 */
export function ImageHint({ url, invalid, onUse }: { url: string; invalid: boolean; onUse: (next: string) => void }) {
  const [state, setState] = useState<State>('idle');
  const direct = useMemo(() => directImage(url), [url]);

  useEffect(() => {
    setState('idle');
    const u = url.trim();
    if (!u || invalid || !/^https:\/\//i.test(u)) return;
    setState('checking');
    let live = true;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const done = (next: State) => { if (live) { live = false; setState(next); } };
    img.onload = () => done('ok');
    img.onerror = () => done('bad');
    const start = setTimeout(() => { img.src = u; }, 500);
    const giveUp = setTimeout(() => done('bad'), 9000);
    return () => { live = false; clearTimeout(start); clearTimeout(giveUp); img.onload = null; img.onerror = null; };
  }, [url, invalid]);

  if (direct) {
    return (
      <p className="ap-imghint is-bad" role="status">
        That is a Google Images page, not the picture itself.{' '}
        <button type="button" className="ap-textbtn" onClick={() => onUse(direct)}>Use the direct image link</button>
      </p>
    );
  }
  if (state === 'checking') return <p className="ap-imghint" role="status">Checking the picture...</p>;
  if (state === 'ok') return <p className="ap-imghint is-ok" role="status"><img src={url.trim()} alt="" width={28} height={28} referrerPolicy="no-referrer" />Picture found.</p>;
  if (state === 'bad') {
    return (
      <p className="ap-imghint is-bad" role="status">
        No picture loaded from this link. Use the address of the image file itself (it usually ends in .jpg, .png or .webp), not the page it appears on.
      </p>
    );
  }
  return null;
}
