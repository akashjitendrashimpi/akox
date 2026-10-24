import Link from 'next/link';
import { AppBar } from '../components/AppBar';

const steps = [
  { title: 'Sign up', text: 'Create a free account with your email or Google.' },
  { title: 'Build your portfolio', text: 'Add your bio and projects, or upload a site you coded yourself.' },
  { title: 'Share your link', text: 'Your portfolio goes live at yourname.akox.in.' },
];

export default function Home() {
  return (
    <>
      <AppBar />
      <main>
        <section className="hero">
          <div className="address" aria-hidden="true">
            <span className="lock" />
            <span>akash<span className="dim">.akox.in</span></span>
          </div>
          <h1>A website with your name on it.</h1>
          <p className="lead">
            A free portfolio website for every student and freelancer, at your own address.
          </p>
          <div className="nav">
            <Link className="btn" href="/signup">Get started</Link>
            <Link className="btn ghost" href="/explore">Explore portfolios</Link>
          </div>
        </section>
        <section className="how">
          <h2>How it works</h2>
          <ol>
            {steps.map((s) => (
              <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>
            ))}
          </ol>
        </section>
      </main>
      <footer>AKOX. Built in India.</footer>
    </>
  );
}