'use client';

import { useState, type InputHTMLAttributes } from 'react';

/** A password input with a Show/Hide toggle, so people can check what they typed. */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="ap-pw">
      <input {...props} className="ap-input" type={show ? 'text' : 'password'} />
      <button type="button" className="ap-pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
