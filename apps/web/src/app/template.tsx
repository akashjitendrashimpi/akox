import type { ReactNode } from 'react';
import { AuthRedirect } from '../components/AuthRedirect';

export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthRedirect />
      {children}
    </>
  );
}