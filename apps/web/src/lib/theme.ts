export type Theme = 'dark' | 'light';

export const THEME_KEY = 'akox:theme';

/** Dark is the default. Light is the original AKOX palette (pale green-grey page, indigo accent). */
export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f6f1' : '#100e2a');
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode: the choice just lasts until the tab closes */
  }
}

/** Runs in <head> before the first paint: applies the saved theme (no dark flash for light users) and
 *  turns on "lite" mode for slow or data-saving connections, which switches off decoration, not content. */
export const THEME_BOOT_SCRIPT =
  `try{var d=document.documentElement;if(localStorage.getItem('${THEME_KEY}')==='light'){d.setAttribute('data-theme','light');}`
  + `var c=navigator.connection;if(c&&(c.saveData||/(^|-)2g$|3g/.test(c.effectiveType||'')))d.setAttribute('data-lite','');}catch(e){}`;
