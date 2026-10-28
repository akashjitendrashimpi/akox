/** One live site per person. `kind` says what it was made with: a zip they uploaded, or a template. */
export type SiteKind = 'zip' | 'template';

/** The database value, checked. Anything unexpected counts as "nothing live" rather than being guessed at. */
export const asKind = (v: unknown): SiteKind | null => (v === 'zip' || v === 'template' ? v : null);

export const kindLabel = (k: SiteKind): string => (k === 'zip' ? 'Custom website' : 'Template');

export function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Publishing the other kind replaces the live site, so ask first. Nothing live yet, or the same kind, needs no question.
 * Returns true when it is fine to go ahead.
 */
export function confirmReplace(current: SiteKind | null, target: SiteKind): boolean {
  if (!current || current === target) return true;
  return window.confirm("This replaces your live website. You can undo it with 'Go back to the previous version'.");
}
