'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from './app/Icons';

/** Goes back to wherever the person came from. With no history (a pasted link), goes to the fallback instead. */
export function BackLink({ fallback, label = 'Back' }: { fallback: string; label?: string }) {
  const router = useRouter();
  return (
    <Link
      className="ap-back"
      href={fallback}
      onClick={(e) => {
        if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      <ChevronLeftIcon size={18} />{label}
    </Link>
  );
}
