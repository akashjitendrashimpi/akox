/** The wordmark: lowercase "akox" plus the ▲ mark. The mark is drawn, so it needs no font and stays crisp. */
export function TriangleMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`akx-mark ${className}`.trim()} viewBox="0 0 12 11" aria-hidden="true" focusable="false">
      <path d="M6 .4 11.6 10.6H.4Z" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="akx-logo">
      akox<TriangleMark />
    </span>
  );
}
