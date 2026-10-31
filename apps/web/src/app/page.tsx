import type { ReactNode } from 'react';
import Link from 'next/link';
import './landing.css';
import { FinalClaim } from '../components/landing/FinalClaim';
import { Hero } from '../components/landing/Hero';
import { LandingNav } from '../components/landing/LandingNav';
import { Reveal } from '../components/landing/Reveal';
import { Faq, FAQ } from '../components/landing/Faq';
import { Showcase } from '../components/landing/Showcase';
import { SiteFooter } from '../components/brand/SiteFooter';

const steps: { title: string; text: ReactNode }[] = [
  { title: 'Claim your name', text: <>Type it. If it is free, it can be yours: <span className="lp-mono">yourname.akox.in</span>.</> },
  { title: 'Add your work', text: 'Fill a short form, or upload your own site.' },
  { title: 'Share the link', text: 'Send it to anyone. Put it on LinkedIn, your resume or your WhatsApp status.' },
];

function FormArt() {
  return (
    <svg className="lp-ill" viewBox="0 0 240 150" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="36" cy="36" r="18" />
      <rect x="68" y="24" width="150" height="12" rx="6" />
      <rect x="68" y="44" width="96" height="8" rx="4" opacity=".5" />
      <rect x="16" y="78" width="202" height="24" rx="8" />
      <rect x="16" y="110" width="202" height="24" rx="8" />
      <rect x="150" y="115" width="60" height="14" rx="7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CodeArt() {
  return (
    <svg className="lp-ill" viewBox="0 0 240 150" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M78 36 30 75l48 39" />
      <path d="M162 36l48 39-48 39" />
      <path d="M134 24 106 126" />
      <path d="M196 14l14 8v16l-14 8-14-8V22z" opacity=".55" />
      <path d="M182 22l14 8 14-8M196 30v16" opacity=".55" />
    </svg>
  );
}

function GalleryArt() {
  return (
    <svg className="lp-ill" viewBox="0 0 240 150" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="16" y="14" width="64" height="56" rx="10" />
      <rect x="88" y="14" width="64" height="56" rx="10" />
      <rect x="160" y="14" width="64" height="56" rx="10" />
      <rect x="16" y="80" width="64" height="56" rx="10" />
      <rect x="88" y="80" width="64" height="56" rx="10" fill="currentColor" stroke="none" />
      <rect x="160" y="80" width="64" height="56" rx="10" />
    </svg>
  );
}

export default function Home() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.plain } })),
  };
  return (
    <div className="lp">
      <LandingNav />
      <main id="main">
        <Hero />

        <section className="lp-sec" id="how" aria-labelledby="how-h">
          <Reveal className="lp-wrap">
            <h2 id="how-h">Three steps. No tutorial.</h2>
            <ol className="lp-steps" role="list">
              {steps.map((s) => (
                <li key={s.title}>
                  <b>{s.title}</b>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section className="lp-sec" id="ways" aria-labelledby="ways-h">
          <Reveal className="lp-wrap">
            <h2 id="ways-h">Your site. Your way.</h2>
            <div className="lp-ways lp-ways-2">
              <article>
                <FormArt />
                <h3>Use the form</h3>
                <p>No code. Pick a look, add your name, bio and projects, and watch the page appear. Done in minutes.</p>
                <p className="lp-chips"><span>Clean</span><span>Midnight</span><span>Studio</span></p>
                <Link className="lp-textlink" href="/signup">Build with the form</Link>
              </article>
              <article>
                <CodeArt />
                <h3>Bring your own code</h3>
                <p>Built it yourself, or had AI build it? Zip it and upload it. It goes live at your address with your design untouched.</p>
                <p className="lp-small">Free plan: up to 15 MB, 100 files. Videos go on YouTube or Vimeo.</p>
                <Link className="lp-textlink" href="/signup">Upload my site</Link>
              </article>
            </div>
            <p className="lp-foot-note">One live site per person. Publish a new one and it replaces the old one. The previous version is one click away.</p>
          </Reveal>
        </section>

        <section className="lp-sec" id="examples" aria-labelledby="ex-h">
          <Reveal className="lp-wrap">
            <h2 id="ex-h">See your name on it.</h2>
            <p className="lp-sub">This is what the form makes. Type your name and these update.</p>
            <Showcase />
          </Reveal>
        </section>

        <section className="lp-sec" id="faq" aria-labelledby="faq-h">
          <Reveal className="lp-wrap">
            <h2 id="faq-h">Questions, answered.</h2>
            <Faq />
          </Reveal>
        </section>

        <section className="lp-sec lp-final" aria-labelledby="final-h">
          <Reveal className="lp-wrap">
            <h2 id="final-h">Your name is waiting.</h2>
            <p className="lp-sub">Check if it is free. It takes five seconds.</p>
            <FinalClaim />
            <p className="lp-small">Free during early access.</p>
          </Reveal>
        </section>
      </main>

      <SiteFooter landing />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </div>
  );
}
