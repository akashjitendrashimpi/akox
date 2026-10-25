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

export const GearIcon = (p: P) => <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Base>;
export const GridIcon = (p: P) => <Base {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></Base>;
export const LogoutIcon = (p: P) => <Base {...p}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M16 8l4 4-4 4M20 12H9" /></Base>;
export const SunIcon = (p: P) => <Base {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4" /></Base>;
export const MoonIcon = (p: P) => <Base {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /></Base>;
export const ChevronLeftIcon = (p: P) => <Base {...p}><path d="m15 6-6 6 6 6" /></Base>;
export const FolderIcon = (p: P) => <Base {...p}><path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></Base>;
export const TrashIcon = (p: P) => <Base {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 1.8h6a2 2 0 0 0 2-1.8L18 7M9 7V4.5h6V7" /></Base>;
export const PlusIcon = (p: P) => <Base {...p}><path d="M12 5v14M5 12h14" /></Base>;

export const MenuIcon = (p: P) => <Base {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Base>;
export const CloseIcon = (p: P) => <Base {...p}><path d="m6 6 12 12M18 6 6 18" /></Base>;
