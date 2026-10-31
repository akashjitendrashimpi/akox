import type { Metadata } from 'next';
import { LegalPage } from '../../components/brand/LegalPage';

export const metadata: Metadata = { title: 'Acceptable use', description: 'What you can and cannot publish on Akox.' };

export default function AcceptableUse() {
  return (
    <LegalPage title="Acceptable use" lead="Akox is for people who build and share their own work.">
      <h2>Do not publish</h2>
      <ul>
        <li>Anything illegal in India.</li>
        <li>Sexual content involving anyone under 18. We report it to the authorities.</li>
        <li>Harassment, threats or hate against people or groups.</li>
        <li>Sexually explicit content.</li>
        <li>Pages that pretend to be someone else: fake login pages, fake payment pages, fake bank or government pages, or sites that copy a person or brand.</li>
        <li>Scams, fake giveaways or &ldquo;get rich fast&rdquo; schemes.</li>
        <li>Malware, exploits or crypto-mining.</li>
        <li>Spam, link farms or mass-made pages for search ranking.</li>
        <li>Other people&rsquo;s work without permission.</li>
        <li>Private information about other people.</li>
        <li>Anything that lies about who you are.</li>
      </ul>
      <h2>AI-made code</h2>
      <p>It is welcome. You are responsible for what it does and says.</p>
      <h2>Storage</h2>
      <p>Please do not use Akox as free file storage, a download host or a proxy.</p>
      <h2>How we enforce</h2>
      <p>We warn you where we can, then remove the content, then suspend the account. For serious harm we act at once. If you think we got it wrong, write to us and a person will look again.</p>
      <p>Found something that breaks these rules? <a href="/report">Report a site</a>.</p>
    </LegalPage>
  );
}
