'use client';

import type { ChangeEvent } from 'react';

/** Lowercase letters, digits and hyphens only, so the preview always looks like a real subdomain. */
export function cleanHandle(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  idPrefix: string;
  cta?: string;
};

/**
 * The address field is the page's main interaction. A plain GET form, so it still
 * works without JavaScript: it opens /signup?u=<name>.
 */
export function ClaimForm({ value, onChange, placeholder, idPrefix, cta = 'Check my name' }: Props) {
  const inputId = `${idPrefix}-handle`;
  const hintId = `${idPrefix}-hint`;
  // Size the input to what is shown (typed text, or the sample name) so ".akox.in" sits right after it.
  const width = Math.max((value || placeholder).length, 4) + 1;

  return (
    <form className="lp-claim" action="/signup" method="get">
      <label className="lp-claim-field" htmlFor={inputId}>
        <span className="lp-lock" aria-hidden="true" />
        <span className="lp-sr">Your name, for your address</span>
        <input
          id={inputId}
          name="u"
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(cleanHandle(e.target.value))}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={30}
          aria-describedby={hintId}
          style={{ width: `${width}ch` }}
        />
        <span className="lp-claim-suffix" aria-hidden="true">.akox.in</span>
      </label>
      <button className="lp-btn" type="submit">{cta}</button>
      <p id={hintId} className="lp-hint" aria-live="polite">
        {!value
          ? 'Letters, numbers and hyphens. Takes five seconds.'
          : value.length < 3
            ? 'Use 3 or more characters.'
            : /^-|-$/.test(value)
              ? 'A name cannot start or end with a hyphen.'
              : <>Looks good: <b>{value}.akox.in</b>. We check it is free when you sign up.</>}
      </p>
    </form>
  );
}
