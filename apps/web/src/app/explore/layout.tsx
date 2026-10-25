import type { ReactNode } from 'react';
import { DashboardShell } from '../../components/app/Shell';

/** Explore sits inside the same shell as the dashboard, so the menu never changes shape between the two. */
export default function ExploreLayout({ children }: { children: ReactNode }) {
  return <DashboardShell pub>{children}</DashboardShell>;
}
