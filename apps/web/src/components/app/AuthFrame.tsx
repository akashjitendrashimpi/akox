import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteMock } from './SiteMock';
import { Logo } from '../brand/Logo';

type Props = {
  title: string;
  lead: ReactNode;
  /** The username shown in the preview beside the form. */
  address?: string;
  /** Small text in the top corner, such as a link to the other auth page. */
  corner?: ReactNode;
  children: ReactNode;
};

/** Shared frame for login, signup and onboarding: form on the left, a preview of what you are building on the right. */
export function AuthFrame({ title, lead, address = '', corner, children }: Props) {
  return (
    <div className="ap-auth">
      <div className="ap-auth-main">
        <div className="ap-auth-top">
          <Link className="ap-logo" href="/"><Logo /></Link>
          {corner ? <p className="ap-auth-corner">{corner}</p> : null}
        </div>
        <div className="ap-auth-form">
          <h1 className="ap-title">{title}</h1>
          <p className="ap-lead">{lead}</p>
          {children}
        </div>
      </div>
      <aside className="ap-auth-aside" aria-hidden="true">
        <SiteMock username={address} />
      </aside>
    </div>
  );
}
