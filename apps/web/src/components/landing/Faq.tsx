import type { ReactNode } from 'react';
import Link from 'next/link';

export const FAQ: { q: string; a: ReactNode; plain: string }[] = [
  { q: 'Is Akox really free?', plain: 'Yes, during early access. If that changes, we will email you first, before anything happens to your site.',
    a: 'Yes, during early access. If that changes, we will email you first, before anything happens to your site.' },
  { q: 'Do I need to know how to code?', plain: 'No. The form needs no code. If you do code, or you use an AI tool to make a site, upload it as a zip.',
    a: 'No. The form needs no code. If you do code, or you use an AI tool to make a site, upload it as a zip.' },
  { q: 'Who owns what I put on my site?', plain: 'You do. By publishing, you let Akox show it at your address. That is all we need. The Terms are short and in plain language.',
    a: <>You do. By publishing, you let Akox show it at your address. That is all we need. The <Link href="/terms">Terms</Link> are short and in plain language.</> },
  { q: 'What can I upload?', plain: 'A zip with an index.html at the top. On the free plan: up to 15 MB in total, 5 MB per file, 100 files, and no video files. Put videos on YouTube or Vimeo and embed them.',
    a: 'A zip with an index.html at the top. On the free plan: up to 15 MB in total, 5 MB per file, 100 files, and no video files. Put videos on YouTube or Vimeo and embed them.' },
  { q: 'What do you do with my data?', plain: 'We keep what we need to run your site: your email, address, name, bio, projects and files. We do not sell your data. If you want out, delete your account and your site goes with it.',
    a: <>We keep what we need to run your site: your email, address, name, bio, projects and files. We do not sell your data. If you want out, delete your account and your site goes with it. Details are in the <Link href="/privacy">Privacy page</Link>.</> },
];

export function Faq() {
  return (
    <div className="lp-faq">
      {FAQ.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
