import type { ReactNode } from 'react';

/** Only the content area eases in when you move between dashboard pages, so the sidebar never flickers. */
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <div className="ap-route">{children}</div>;
}
