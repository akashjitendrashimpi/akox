import Link from 'next/link';

const steps = [
  { title: 'Sign up', text: 'Log in with your email. It is free.' },
  { title: 'Build or upload', text: 'Fill a simple form, or upload a site you coded yourself.' },
  { title: 'Share your link', text: 'Your portfolio goes live at yourname.akox.in.' },
];

export default function Home() {
  return (
    <>
      <header className="bar">
        <span className="logo">akox</span>
        <nav className="nav">
          <Link className="btn ghost" href="/login">Log in</Link>
          <Link className="btn" href="/login">Sign up</Link>
        </nav>
      </header>
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
            <Link className="btn" href="/login">Get started</Link>
            <Link className="btn ghost" href="/upload">Check my site</Link>
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
