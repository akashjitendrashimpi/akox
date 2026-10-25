'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Fades a block in once, the first time it scrolls into view.
 * Content is visible by default; it is only hidden after the page loads in a browser that allows motion,
 * so nothing is lost without JavaScript or for people who prefer reduced motion.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    el.dataset.armed = 'true';
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        el.classList.add('is-in');
        io.disconnect();
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} className={`lp-reveal${className ? ` ${className}` : ''}`}>{children}</div>;
}
