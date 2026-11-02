/**
 * Decorative mandala. The drawing lives in /mandala.svg (one cached file, about 28 KB, 8 KB compressed, downloaded once),
 * so the page itself carries only a few bytes per use. Hidden from screen readers.
 * Lines follow the text colour of the wrapper; the centre triangle is marigold (set --g to change it).
 */
export function Mandala({ className = '' }: { className?: string }) {
  return (
    <span className={`akx-mwrap ${className}`.trim()} aria-hidden="true">
      <svg className="akx-m" viewBox="-100 -100 200 200" focusable="false">
        <use href="/mandala.svg#m" />
      </svg>
    </span>
  );
}
