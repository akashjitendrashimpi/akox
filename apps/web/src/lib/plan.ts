import { PLAN_LIMITS, limitsFor, type Limits, type PlanId } from '@akox/core';

/** Everything the website says about plans comes from @akox/core, so a limit is changed in one place. */

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

/** 15728640 -> "15 MB". Small numbers keep one decimal so 0.4 MB does not read as "0 MB". */
export function fmtBytes(n: number): string {
  if (n >= GB) return `${trim(n / GB)} GB`;
  if (n >= MB) return `${trim(n / MB)} MB`;
  if (n >= KB) return `${Math.round(n / KB)} KB`;
  return `${Math.max(0, Math.round(n))} B`;
}

function trim(v: number): string {
  return v >= 10 || Number.isInteger(v) ? String(Math.round(v)) : v.toFixed(1);
}

/** Unknown or missing plans are treated as free, exactly like limitsFor does. */
export function planIdOf(plan: string | null | undefined): PlanId {
  return plan && Object.prototype.hasOwnProperty.call(PLAN_LIMITS, plan) ? (plan as PlanId) : 'free';
}

export function planLabel(plan: string | null | undefined): string {
  const id = planIdOf(plan);
  return id.charAt(0).toUpperCase() + id.slice(1);
}

const VIDEO_EXTENSIONS: readonly string[] = ['mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi'];

/** "Free plan: up to 15 MB total, 5 MB per file, 100 files, no video files. Put videos on YouTube or Vimeo and embed them." */
export function describeLimits(plan: string | null | undefined, limits: Limits = limitsFor(plan)): string {
  const parts = [`up to ${fmtBytes(limits.maxUnpackedBytes)} total`];
  if (limits.maxZipBytes !== limits.maxUnpackedBytes) parts.push(`zip up to ${fmtBytes(limits.maxZipBytes)}`);
  parts.push(`${fmtBytes(limits.maxFileBytes)} per file`, `${limits.maxFiles} files`);

  const blocked = limits.blockedExtensions ?? [];
  const onlyVideo = blocked.length > 0 && blocked.every((e) => VIDEO_EXTENSIONS.includes(e));
  if (blocked.length > 0) parts.push(onlyVideo ? 'no video files' : `no ${blocked.map((e) => '.' + e).join(', ')} files`);

  return `${planLabel(plan)} plan: ${parts.join(', ')}.${onlyVideo ? ' Put videos on YouTube or Vimeo and embed them.' : ''}`;
}

export type StorageLevel = 'ok' | 'warn' | 'full';

/** Normal under 80%, warning from 80%, error once the space is used up. */
export function storageLevel(used: number, max: number): { level: StorageLevel; pct: number } {
  const ratio = max > 0 ? Math.max(0, used) / max : 0;
  const level: StorageLevel = ratio >= 1 ? 'full' : ratio >= 0.8 ? 'warn' : 'ok';
  return { level, pct: Math.min(100, ratio * 100) };
}
