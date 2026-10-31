import Link from 'next/link';
import { Logo } from '../components/brand/Logo';

export default function NotFound() {
  return (
    <main id="main" className="akx-doc" style={{ textAlign: 'center' }}>
      <Link className="ap-logo" href="/" aria-label="Akox home"><Logo /></Link>
      <h1>This address is not taken. Yet.</h1>
      <p>Nothing lives here. Claim it?</p>
      <p><Link className="ap-btn" href="/signup">Claim my name</Link></p>
    </main>
  );
}
