import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// Self-hosted fonts (npm packages), so nothing is downloaded from Google while you develop.
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './globals.css';
import { THEME_BOOT_SCRIPT } from '../lib/theme';

export const metadata: Metadata = {
  title: 'AKOX: a website with your name on it',
  description: 'Free portfolio websites for students and freelancers. Use a simple form, or bring your own code.',
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
