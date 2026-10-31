'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon } from '../app/Icons';

type Which = 'link' | 'linkedin' | null;

/** Copy the live address, or a ready-made LinkedIn post. Used on the success screens. */
export function ShareActions({ address }: { address: string }) {
  const [done, setDone] = useState<Which>(null);
  const url = `https://${address}`;

  async function copy(which: Exclude<Which, null>, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setDone(which);
      window.setTimeout(() => setDone((d) => (d === which ? null : d)), 2500);
    } catch {
      setDone(null);
      window.prompt('Copy this:', text);
    }
  }

  const post = `I now have my own website: ${address}\n\nI built it myself on Akox. Have a look and tell me what you would change. ▲`;

  return (
    <div className="akx-share">
      <div className="ap-actions">
        <button type="button" className="ap-btn ap-btn-ghost" onClick={() => void copy('link', url)}>
          {done === 'link' ? <CheckIcon size={16} /> : <CopyIcon size={16} />}{done === 'link' ? 'Copied' : 'Copy link'}
        </button>
        <button type="button" className="ap-btn ap-btn-ghost" onClick={() => void copy('linkedin', post)}>
          {done === 'linkedin' ? <CheckIcon size={16} /> : <CopyIcon size={16} />}{done === 'linkedin' ? 'Copied' : 'Copy for LinkedIn'}
        </button>
      </div>
      <p className="ap-note ap-status" role="status">
        {done === 'linkedin' ? 'Copied. Now paste it on LinkedIn.' : done === 'link' ? 'Link copied.' : 'On LinkedIn, add it under Contact info, Website.'}
      </p>
    </div>
  );
}
