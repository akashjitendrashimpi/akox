import { useId } from 'react';
import { limitsFor } from '@akox/core';
import { fmtBytes, planLabel, storageLevel } from '../../lib/plan';

interface Props {
  /** portfolio_sites.total_bytes (0 when the person has not published yet). */
  used: number;
  /** profiles.plan */
  plan: string | null | undefined;
}

const NOTE: Record<'warn' | 'full', string> = {
  warn: 'Almost full. Remove large files from your site, or upgrade for more space.',
  full: 'Your storage is full. Free up space before you upload again.',
};

/** Storage used against the plan's limit, with a disabled upgrade button until paid plans exist. */
export function StorageMeter({ used, plan }: Props) {
  const id = useId();
  const max = limitsFor(plan).maxUnpackedBytes;
  const { level, pct } = storageLevel(used, max);
  const text = `${fmtBytes(used)} of ${fmtBytes(max)} used`;

  return (
    <section className={`ap-panel ap-storage is-${level}`} aria-labelledby={`${id}-h`}>
      <div className="ap-storage-head">
        <h2 className="ap-h2" id={`${id}-h`}>Storage</h2>
        <span className="ap-storage-plan">{planLabel(plan)} plan</span>
      </div>

      <p className="ap-storage-nums">
        <b>{text}</b>
        {level !== 'ok' && <span className="ap-storage-flag">{level === 'full' ? 'Full' : 'Almost full'}</span>}
      </p>
      <div className="ap-bar" role="progressbar" aria-label="Storage used" aria-valuemin={0} aria-valuemax={max}
        aria-valuenow={Math.min(used, max)} aria-valuetext={text}>
        <i style={{ width: `${pct}%` }} />
      </div>

      {level !== 'ok' && (
        <p className="ap-storage-msg" role={level === 'full' ? 'alert' : 'status'}>{NOTE[level]}</p>
      )}

      <div className="ap-upgrade">
        <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" disabled aria-describedby={`${id}-soon`}>Upgrade for more space</button>
        <span className="ap-soon" id={`${id}-soon`}>Coming soon</span>
      </div>
    </section>
  );
}
