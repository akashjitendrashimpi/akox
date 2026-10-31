import type { Metadata } from 'next';
import { LegalPage } from '../../components/brand/LegalPage';
import { ReportForm } from './ReportForm';

export const metadata: Metadata = { title: 'Report a site', description: 'Tell us about a site on akox.in that breaks the rules.' };

export default async function Report({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const initial = (site ?? '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 120);
  return (
    <LegalPage title="Report a site" lead="Something on akox.in that breaks the rules, or something about you that should not be there? Tell us." draft={false}>
      <ReportForm initialAddress={initial} />
      <div className="akx-help">
        <p><b>Urgent?</b> If a child is in danger, call the police or Childline 1098 first. For online fraud in India: cybercrime.gov.in, or call 1930. [Check these numbers on launch day.]</p>
      </div>
      <h2>If your work was copied</h2>
      <p>Include your name, a link to your original, and a statement that you own it. [Lawyer to write the formal notice steps.]</p>
      <h2>What happens next</h2>
      <p>We review the report, check the site, and act under the <a href="/acceptable-use">Acceptable use</a> rules. We tell the site owner what we removed and why, unless the law or safety says we cannot.</p>
    </LegalPage>
  );
}
