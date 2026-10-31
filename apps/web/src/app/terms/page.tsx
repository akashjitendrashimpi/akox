import type { Metadata } from 'next';
import { LegalPage } from '../../components/brand/LegalPage';
import { BRAND } from '../../lib/brand';

export const metadata: Metadata = { title: 'Terms of Use', description: 'The short, plain-language rules for using Akox.' };

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" lead="The short version: it is your work, be honest, be kind, and we will tell you before things change.">
      <h2>1. What Akox is</h2>
      <p>Akox gives you a personal web address, <span className="ap-mono">yourname.akox.in</span>, and a place to publish a website.</p>
      <h2>2. Who can use it</h2>
      <p>You must be 18 or older. [Lawyer to confirm the age rule.]</p>
      <h2>3. Your account</h2>
      <p>Give true details. Keep your password safe. You are responsible for what happens under your account.</p>
      <h2>4. Your content</h2>
      <p>It stays yours. You give Akox a limited permission to store, copy and show it, so we can run your site. We do not use it for ads and we do not sell it. You promise you have the right to publish what you upload.</p>
      <h2>5. Your address</h2>
      <p>You can use it while your account is active and you follow the rules. We may refuse or remove names that impersonate people or brands, or that break the <a href="/acceptable-use">Acceptable use</a> rules.</p>
      <h2>6. Early access and cost</h2>
      <p>Akox is free during early access. Features, limits and pricing may change. We will email you [X days] before a change that affects your site.</p>
      <h2>7. The Akox mark</h2>
      <p>Every published site shows a small &ldquo;Made with Akox&rdquo; mark with the &#9650; at the end of the page. It cannot be removed. [Founder to confirm this applies to all plans.]</p>
      <h2>8. Rules</h2>
      <p>You agree to the <a href="/acceptable-use">Acceptable use</a> rules.</p>
      <h2>9. Taking things down</h2>
      <p>We may remove content or suspend an account that breaks the rules, or when the law requires it. We will tell you why unless the law or safety stops us. You can ask us to review the decision.</p>
      <h2>10. Leaving</h2>
      <p>You can delete your account at any time. We will remove your site within [X days]. We may end the service with [X days] notice.</p>
      <h2>11. No promise of perfection</h2>
      <p>Early access means bugs and downtime can happen. Keep a copy of your own files.</p>
      <h2>12. Liability</h2>
      <p>[Lawyer to write: limits on what Akox is liable for.]</p>
      <h2>13. Changes</h2>
      <p>If we change these terms, we will tell you by email and on this page.</p>
      <h2>14. Law</h2>
      <p>These terms follow Indian law. Disputes go to the courts in [city]. [Lawyer to confirm.]</p>
      <h2>15. Contact</h2>
      <p><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>. Grievance Officer: {BRAND.grievanceOfficer}. [Lawyer to confirm what India&rsquo;s IT Rules require of an intermediary.]</p>
    </LegalPage>
  );
}
