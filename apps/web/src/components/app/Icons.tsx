import type { ReactNode, SVGProps } from 'react';

type P = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number };

function Base({ size = 20, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const CheckIcon = (p: P) => <Base {...p}><path d="M5 12.5 10 17.5 19 7" /></Base>;
export const CopyIcon = (p: P) => <Base {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" /></Base>;
export const PencilIcon = (p: P) => <Base {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></Base>;
export const UploadIcon = (p: P) => <Base {...p}><path d="M12 16V4m0 0L7 9m5-5 5 5M4 20h16" /></Base>;
export const CompassIcon = (p: P) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></Base>;
export const ArrowIcon = (p: P) => <Base {...p}><path d="M5 12h14m0 0-6-6m6 6-6 6" /></Base>;
export const SearchIcon = (p: P) => <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Base>;
export const ExternalIcon = (p: P) => <Base {...p}><path d="M7 17 17 7M9 7h8v8" /></Base>;

/** A check that draws itself inside a ring. Used once, when something goes live. */
export function SuccessMark({ size = 44 }: { size?: number }) {
  return (
    <span className="ap-success-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle className="ap-sm-ring" cx="24" cy="24" r="21" pathLength={1} />
        <path className="ap-sm-check" d="M14 25.5 21 32.5 34.5 17" pathLength={1} />
      </svg>
    </span>
  );
}
