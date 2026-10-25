'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { CloseIcon, MenuIcon } from './app/Icons';

/**
 * The three-line button and the slide-in drawer behind it. Every page on a phone uses this one pattern.
 * Closes on route change, Escape, a tap on the dim area or any link inside it. Scroll is locked while open.
 */
export function MobileMenu({ children, side = 'left', title = 'Menu', className = '' }: { children: ReactNode; side?: 'left' | 'right'; title?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  const close = useCallback(() => { setOpen(false); btn.current?.focus(); }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('a, button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const first = items[0]; const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, [open, close]);

  return (
    <div className={`ap-show-sm ${className}`}>
      <button ref={btn} type="button" className="ap-mm-btn" aria-expanded={open} aria-controls="ap-drawer" aria-label="Open menu" onClick={() => setOpen(true)}>
        <MenuIcon size={22} />
      </button>
      {open && createPortal(
        <>
          <div className="ap-scrim" onClick={close} />
          <aside ref={panel} id="ap-drawer" className={`ap-drawer is-${side}`} role="dialog" aria-modal="true" aria-label={title}
            onClick={(e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); }}>
            <button type="button" className="ap-drawer-x" aria-label="Close menu" onClick={close}><CloseIcon size={20} /></button>
            {children}
          </aside>
        </>,
        document.body,
      )}
    </div>
  );
}
