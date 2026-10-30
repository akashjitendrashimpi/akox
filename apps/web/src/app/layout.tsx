import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// Self-hosted fonts (npm packages), so nothing is downloaded from Google while you develop.
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './globals.css';
import { THEME_BOOT_SCRIPT } from '../lib/theme';

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://akox.in';

export const metadata: Metadata = {
  metadataBase: new URL(APP_ORIGIN),
  title: {
    default: 'AKOX: a website with your name on it',
    template: '%s | AKOX',
  },
  description: 'Free portfolio websites for students and freelancers. Use a simple form, or bring your own code.',
  keywords: ['portfolio', 'free website', 'student portfolio', 'designer portfolio', 'developer portfolio'],
  authors: [{ name: 'AKOX' }],
  openGraph: {
    title: 'AKOX: a website with your name on it',
    description: 'Free portfolio websites for students and freelancers. Use a simple form, or bring your own code.',
    url: APP_ORIGIN,
    siteName: 'AKOX',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AKOX: a website with your name on it',
    description: 'Free portfolio websites for students and freelancers. Use a simple form, or bring your own code.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = { themeColor: '#100e2a', colorScheme: 'dark light' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the boot script sets data-theme on <html> before React loads.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
