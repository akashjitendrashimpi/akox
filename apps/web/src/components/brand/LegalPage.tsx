import Link from 'next/link';
import type { ReactNode } from 'react';
import { BRAND, LEGAL_REVIEWED, LEGAL_UPDATED } from '../../lib/brand';
import { Logo } from './Logo';
import { SiteFooter } from './SiteFooter';

type Props = { title: string; lead: string; children: ReactNode; draft?: boolean };

/**
 * Shell for Terms, Privacy, Acceptable use and Report a site.
 * While LEGAL_REVIEWED is false, every page shows a visible "draft, pending legal review" notice.
 */
export function LegalPage({ title, lead, children, draft = true }: Props) {
  return (
    <>
      <main id="main" className="akx-doc">
        <div className="akx-doc-top">
          <Link className="ap-logo" href="/" aria-label="Akox home"><Logo /></Link>
          <Link className="ap-textlink" href="/">Back to home</Link>
        </div>
        <h1>{title}</h1>
        <p className="akx-meta">{lead}</p>
        {draft && !LEGAL_REVIEWED && (
          <p className="akx-draft" role="note">
            <b>Draft, pending legal review.</b> This is a plain-language draft. It is not final legal text and may change before launch. Anything in [square brackets] is still to be filled in.
          </p>
        )}
        {draft && <p className="akx-meta">Last updated: {LEGAL_UPDATED}. Run by {BRAND.operator}.</p>}
        {children}
        <div className="akx-help">
          <p>Questions? Write to <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>. A person reads it.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
