'use client';

import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

/** False until the public site key is set, so local development works without a CAPTCHA. */
export const captchaEnabled = SITE_KEY !== '';

interface TurnstileApi {
  render(
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
      theme?: 'light' | 'dark' | 'auto';
    },
  ): string;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function load(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!document.querySelector('script[data-turnstile]')) {
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.dataset.turnstile = '1';
      document.head.appendChild(s);
    }
    let tries = 0;
    const timer = setInterval(() => {
      if (window.turnstile) {
        clearInterval(timer);
        resolve();
      } else if (++tries > 100) {
        clearInterval(timer);
        reject(new Error('Turnstile did not load'));
      }
    }, 100);
  });
}

/** Cloudflare Turnstile bot check. Calls onToken with a one-time token, or '' when it expires or fails. */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!captchaEnabled) return;
    let id: string | undefined;
    let gone = false;
    void load()
      .then(() => {
        if (gone || !box.current || !window.turnstile) return;
        id = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
          theme: 'auto',
        });
      })
      .catch(() => onToken(''));
    return () => {
      gone = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [onToken]);

  if (!captchaEnabled) return null;
  return <div ref={box} style={{ margin: '12px 0' }} />;
}
