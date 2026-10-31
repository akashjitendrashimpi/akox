import Link from 'next/link';
import { BRAND } from '../../lib/brand';
import { Logo } from './Logo';

/** The footer for the landing page and every trust page. Server component: no JavaScript shipped. */
export function SiteFooter({ landing = false }: { landing?: boolean }) {
  return (
    <footer className={landing ? undefined : 'akx-footer'}>
      <div className="lp-wrap lp-foot">
        <div className="lp-foot-brand">
          <Link href="/" className="lp-logo" aria-label="Akox home"><Logo /></Link>
          <p>{BRAND.tagline}</p>
          <p className="lp-foot-small">Akox is in early access. Things will change. We will say so when they do.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/#how">How it works</Link>
          <Link href="/#examples">Examples</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/explore">Explore</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/acceptable-use">Acceptable use</Link>
          <Link href="/report">Report a site</Link>
          <a href={`mailto:${BRAND.email}`}>Contact</a>
        </nav>
        <p className="lp-foot-small lp-foot-legal">&copy; {new Date().getFullYear()} {BRAND.name}. Made in India.</p>
      </div>
    </footer>
  );
}
