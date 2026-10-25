import type { ReactNode } from 'react';
import Link from 'next/link';
import './landing.css';
import { FinalClaim } from '../components/landing/FinalClaim';
import { Hero } from '../components/landing/Hero';
import { LandingNav } from '../components/landing/LandingNav';
import { Reveal } from '../components/landing/Reveal';

const steps: { title: string; text: ReactNode }[] = [
  { title: 'Sign up', text: 'Create a free account with your email or Google.' },
  { title: 'Build your portfolio', text: 'Add your bio and projects, or upload a site you coded yourself.' },
  { title: 'Share your link', text: <>Your portfolio goes live at <span className="lp-mono">yourname.akox.in</span>.</> },
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
  return (
    <div className="lp">
      <LandingNav />
      <main id="main">
        <Hero />

        <section className="lp-sec" aria-labelledby="ways-h">
          <Reveal className="lp-wrap">
            <h2 id="ways-h">Build it your way.</h2>
            <div className="lp-ways">
              <article>
                <FormArt />
                <h3>Fill in a form.</h3>
                <p>Add your bio and projects. No code, nothing to set up.</p>
              </article>
              <article>
                <CodeArt />
                <h3>Bring your own code.</h3>
                <p>Upload a site you wrote yourself or had AI generate, from a simple page to a full 3D scene.</p>
              </article>
              <article>
                <GalleryArt />
                <h3>Browse the gallery.</h3>
                <p>See portfolios other people built, in a public gallery styled like GitHub.</p>
                <Link className="lp-textlink" href="/explore">Explore portfolios</Link>
              </article>
            </div>
          </Reveal>
        </section>

        <section className="lp-sec" id="how" aria-labelledby="how-h">
          <Reveal className="lp-wrap">
            <h2 id="how-h">Live in three steps.</h2>
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

        <section className="lp-sec lp-final" aria-labelledby="final-h">
          <Reveal className="lp-wrap">
            <h2 id="final-h">Your address is one sign-up away.</h2>
            <FinalClaim />
          </Reveal>
        </section>
      </main>

      <footer>
        <div className="lp-wrap lp-foot">
          <span>AKOX. Built in India.</span>
          <nav aria-label="Footer">
            <Link href="/explore">Explore</Link>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
