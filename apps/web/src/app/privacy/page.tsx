import type { Metadata } from 'next';
import { LegalPage } from '../../components/brand/LegalPage';
import { BRAND } from '../../lib/brand';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'What Akox keeps about you, and why.' };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" lead="What Akox keeps about you, why, and what we do not do.">
      <h2>1. What we keep</h2>
      <p>Your email, your username, your name, bio and project text, the files you upload, and a log of when you publish.</p>
      <h2>2. Why</h2>
      <p>To run your account and your site, to stop abuse, and to keep Akox working.</p>
      <h2>3. Public and private</h2>
      <p>Public: your site, and your name, bio and projects if you publish them. Private: your email and your login details.</p>
      <h2>4. What we do not do</h2>
      <p>We do not sell your data. We do not run ad trackers. [Founder to confirm this matches the product before launch.]</p>
      <h2>5. Storage on your device</h2>
      <p>We use your browser&rsquo;s storage only for things you ask for: staying logged in, your light or dark choice, and an unsaved draft of your site. Log out and the draft is cleared.</p>
      <h2>6. Who helps us run Akox</h2>
      <p>Companies that provide our database, login and hosting: [list providers]. They may only use your data to provide that service.</p>
      <h2>7. Sharing</h2>
      <p>Only with those providers, or if the law requires it. We will tell you unless the law stops us.</p>
      <h2>8. How long we keep it</h2>
      <p>While your account is open, then [X days] after you delete it. Some logs may stay longer if the law requires.</p>
      <h2>9. Your rights</h2>
      <p>You can ask to see, correct or delete your data, and to complain. [Lawyer: describe rights and process under the Digital Personal Data Protection Act, 2023.]</p>
      <h2>10. Age</h2>
      <p>Akox is for people 18 and older. [Lawyer to confirm.]</p>
      <h2>11. Security</h2>
      <p>We use reasonable safeguards. No system is perfectly safe. If something serious happens to your data, we will tell you. [Lawyer: breach duties.]</p>
      <h2>12. Contact</h2>
      <p><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>. Grievance Officer: {BRAND.grievanceOfficer}.</p>
    </LegalPage>
  );
}
