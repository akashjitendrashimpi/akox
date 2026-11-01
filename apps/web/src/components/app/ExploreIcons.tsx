import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const, focusable: false as const });

export function BookmarkIcon({ size = 18, filled = false, ...r }: P & { filled?: boolean }) {
  return <svg {...base(size)} {...r} fill={filled ? 'currentColor' : 'none'}><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" /></svg>;
}
export function DiceIcon({ size = 18, ...r }: P) {
  return <svg {...base(size)} {...r}><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><circle cx="8.5" cy="8.5" r=".6" /><circle cx="15.5" cy="8.5" r=".6" /><circle cx="12" cy="12" r=".6" /><circle cx="8.5" cy="15.5" r=".6" /><circle cx="15.5" cy="15.5" r=".6" /></svg>;
}
export function ShareIcon({ size = 18, ...r }: P) {
  return <svg {...base(size)} {...r}><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>;
}
export function GridIcon({ size = 18, ...r }: P) {
  return <svg {...base(size)} {...r}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>;
}
export function ListIcon({ size = 18, ...r }: P) {
  return <svg {...base(size)} {...r}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>;
}
