'use client';

import { useEffect, useState } from 'react';
import { applyTheme, readTheme, type Theme } from '../../lib/theme';
import { MoonIcon, SunIcon } from './Icons';

const OPTIONS: { id: Theme; label: string; sub: string }[] = [
  { id: 'dark', label: 'Dark', sub: 'Deep indigo, easy at night' },
  { id: 'light', label: 'Light', sub: 'The original soft paper look' },
];

export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => { setTheme(readTheme()); }, []);

  function pick(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="ap-themes" role="radiogroup" aria-label="Theme">
      {OPTIONS.map((o) => (
        <label key={o.id} className={`ap-themecard${theme === o.id ? ' is-on' : ''}`}>
          <input type="radio" name="theme" value={o.id} checked={theme === o.id} onChange={() => pick(o.id)} />
          <span className={`ap-themeprev is-${o.id}`} aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="ap-themetext">
            <b>{o.id === 'dark' ? <MoonIcon size={16} /> : <SunIcon size={16} />}{o.label}</b>
            <small>{o.sub}</small>
          </span>
        </label>
      ))}
    </div>
  );
}
