import type { ReactNode } from 'react';

/** A template remounts on every navigation, so each page eases in the same way. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="ap-route">{children}</div>;
}
