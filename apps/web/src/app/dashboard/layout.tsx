import type { ReactNode } from 'react';
import { DashboardShell } from '../../components/app/Shell';

/** One sidebar for every page under /dashboard. It stays put while the content on the right changes. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
