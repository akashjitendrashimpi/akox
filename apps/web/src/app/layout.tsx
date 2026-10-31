import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// Self-hosted fonts (npm packages), so nothing is downloaded from Google while you develop.
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './globals.css';
import { THEME_BOOT_SCRIPT } from '../lib/theme';
import { BRAND, SHARE } from '../lib/brand';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: { default: SHARE.title, template: `%s | ${BRAND.name}` },
  description: SHARE.description,
  applicationName: BRAND.name,
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    title: SHARE.ogTitle,
    description: SHARE.ogDescription,
    url: BRAND.url,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image', title: SHARE.ogTitle, description: SHARE.ogDescription },
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
