'use client';

import Link from 'next/link';
import { SITE_SUFFIX, siteHostname } from '../../lib/site-url';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { ArrowIcon, ChevronLeftIcon, CloseIcon, CopyIcon, CheckIcon, ExternalIcon, SearchIcon } from './Icons';

export interface Project { title: string; description: string; url: string | null }
export interface Person { id: string; username: string; display_name: string; bio: string; titles: string[]; projects?: Project[] }
type Sort = 'latest' | 'projects' | 'name';
type Filter = 'all' | 'many' | 'bio';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'projects', label: 'Most projects' },
  { id: 'name', label: 'A to Z' },
];
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'many', label: '3 or more projects' },
  { id: 'bio', label: 'Has a bio' },
];
const PAGE = 12;

/** Same name always gets the same colour, so a card looks familiar on every visit. */
function tone(username: string): number {
  let h = 0;
  for (const c of username) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 6;
}

const shown = (p: Person) => p.display_name || p.username;
const projectsOf = (p: Person): Project[] => p.projects ?? p.titles.map((title) => ({ title, description: '', url: null }));

/** Highlight the part of a word the search matched, so people see why a card is there. */
function mark(text: string, q: string): ReactNode {
  const s = q.trim();
  if (!s) return text;
  const at = text.toLowerCase().indexOf(s.toLowerCase());
  if (at < 0) return text;
  return <>{text.slice(0, at)}<mark>{text.slice(at, at + s.length)}</mark>{text.slice(at + s.length)}</>;
}

export function ExploreView({ people }: { people: Person[] }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('latest');
  const [filter, setFilter] = useState<Filter>('all');
  const [count, setCount] = useState(PAGE);
  const [active, setActive] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const viewer = useRef<HTMLElement>(null);
  const pushed = useRef(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = s
      ? people.filter((p) => [p.display_name, p.username, p.bio, ...p.titles].some((t) => t.toLowerCase().includes(s)))
      : people.slice();
    if (filter === 'many') out = out.filter((p) => p.titles.length >= 3);
    if (filter === 'bio') out = out.filter((p) => p.bio.trim().length > 0);
    if (sort === 'projects') out.sort((a, b) => b.titles.length - a.titles.length);
    if (sort === 'name') out.sort((a, b) => shown(a).localeCompare(shown(b)));
    return out;
  }, [people, q, sort, filter]);

  const visible = list.slice(0, count);
  const person = active ? people.find((p) => p.id === active) ?? null : null;
  // Previous and next follow whatever list the person is looking at, not the whole directory.
  const at = person ? list.findIndex((p) => p.id === person.id) : -1;
  const prev = at > 0 ? list[at - 1] : undefined;
  const next = at >= 0 && at < list.length - 1 ? list[at + 1] : undefined;

  const byName = useCallback((u: string) => people.find((p) => p.username === u) ?? null, [people]);

  /** Opening a profile adds one history entry, so the phone's Back button closes it instead of leaving Explore. */
  const open = useCallback((p: Person) => {
    setCopied(false);
    if (active === null && !pushed.current) { pushed.current = true; window.history.pushState(null, '', '#' + p.username); }
    else window.history.replaceState(null, '', '#' + p.username);
    setActive(p.id);
  }, [active]);

  const close = useCallback(() => {
    if (pushed.current) { pushed.current = false; window.history.back(); }
    else { window.history.replaceState(null, '', window.location.pathname + window.location.search); setActive(null); }
  }, []);

  useEffect(() => {
    const read = () => {
      const u = decodeURIComponent(window.location.hash.slice(1));
      const p = u ? byName(u) : null;
      setActive(p ? p.id : null);
      if (!p) pushed.current = false;
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [byName]);

  // Keys: / searches, Escape closes, left and right arrows move between profiles.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = Boolean(t?.closest('input, textarea, select, [contenteditable]'));
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); input.current?.focus(); return; }
      if (!person || typing) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && next) open(next);
      else if (e.key === 'ArrowLeft' && prev) open(prev);
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [person, next, prev, open, close]);

  // On a phone the profile is a sheet over the page: lock the page behind it and bring the sheet to the top.
  useEffect(() => {
    if (!person) return;
    viewer.current?.scrollTo({ top: 0 });
    if (!window.matchMedia('(max-width: 900px)').matches) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [person]);

  function copyLink(p: Person) {
    void navigator.clipboard.writeText(`${window.location.origin}/u/${p.username}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function onCard(e: MouseEvent<HTMLAnchorElement>, p: Person) {
    // A plain click previews. Ctrl, Cmd, Shift or middle click still open the page itself.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    open(p);
  }

  const showStrip = !q.trim() && filter === 'all' && sort === 'latest' && people.length >= 4;
  const reset = () => { setQ(''); setFilter('all'); setCount(PAGE); };

  return (
    <div className={`ap-xlayout${person ? ' has-active' : ''}`}>
      <div className="ap-xmain">
        {showStrip && (
          <section className="ap-strip" aria-label="Newest work">
            <p className="ap-strip-h">Newest work</p>
            <ul>
              {people.slice(0, 10).map((p) => (
                <li key={p.id}>
                  <button type="button" className={`ap-story ap-tone-${tone(p.username)}${person?.id === p.id ? ' is-active' : ''}`} onClick={() => open(p)} aria-label={`Preview ${shown(p)}`}>
                    <span className="ap-story-ring"><span>{shown(p).charAt(0)}</span></span>
                    <span className="ap-story-name">{shown(p).split(' ')[0]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="ap-xbar">
          <div className="ap-search">
            <SearchIcon size={18} />
            <label className="ap-sr" htmlFor="explore-q">Search portfolios</label>
            <input ref={input} id="explore-q" className="ap-input" type="search" value={q} placeholder="Search a name, skill or project"
              autoComplete="off" spellCheck={false} onChange={(e) => { setQ(e.target.value); setCount(PAGE); }} />
            {!q && <kbd className="ap-kbd" aria-hidden="true">/</kbd>}
            {q && <button type="button" className="ap-search-clear" aria-label="Clear search" onClick={() => setQ('')}><CloseIcon size={16} /></button>}
          </div>
          <div className="ap-seg" role="group" aria-label="Sort portfolios">
            {SORTS.map((s) => (
              <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => { setSort(s.id); setCount(PAGE); }}>{s.label}</button>
            ))}
          </div>
          <div className="ap-filters" role="group" aria-label="Filter portfolios">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setCount(PAGE); }}>{f.label}</button>
            ))}
          </div>
        </div>

        <p className="ap-note ap-xcount" role="status">
          {list.length} {list.length === 1 ? 'portfolio' : 'portfolios'}{q.trim() ? ` for “${q.trim()}”` : ''}
        </p>

        {list.length === 0 ? (
          <div className="ap-panel ap-empty">
            <p className="ap-note" style={{ marginTop: 0 }}>Nobody matches that. Try a name, a skill or a project title, or drop the filters.</p>
            <button type="button" className="ap-btn ap-btn-ghost" onClick={reset}>Clear search and filters</button>
          </div>
        ) : (
          <>
            <ul className="ap-grid">
              {visible.map((p, i) => {
                const letter = shown(p).charAt(0).toUpperCase();
                const newLetter = sort === 'name' && !q.trim() && (i === 0 || shown(visible[i - 1]!).charAt(0).toUpperCase() !== letter);
                const n = p.titles.length;
                const on = person?.id === p.id;
                return (
                  <Fragment key={p.id}>
                    {newLetter && <li className="ap-letter" aria-hidden="true">{letter}</li>}
                    <li>
                      <Link
                        href={'/u/' + p.username}
                        onClick={(e) => onCard(e, p)}
                        aria-current={on ? 'true' : undefined}
                        className={`ap-pcard ap-rise ap-tone-${tone(p.username)}${on ? ' is-active' : ''}`}
                        style={{ '--i': Math.min(i, 8) } as CSSProperties}
                      >
                        <span className="ap-pnum" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <span className="ap-phead">
                          <span className="ap-pavatar" aria-hidden="true">{shown(p).charAt(0)}</span>
                          <span className="ap-pname">
                            <b>{mark(shown(p), q)}</b>
                            <span className="ap-mono">{mark(p.username, q)}{SITE_SUFFIX}</span>
                          </span>
                        </span>
                        <span className="ap-pbio">{p.bio || 'No bio yet.'}</span>
                        <span className="ap-plist">{p.titles.slice(0, 3).join('  ·  ')}{n > 3 ? `  ·  +${n - 3} more` : ''}</span>
                        <span className="ap-pfoot">
                          <span>{n} {n === 1 ? 'project' : 'projects'}</span>
                          <span className="ap-view">{on ? 'Viewing' : 'Preview'}<ArrowIcon size={16} /></span>
                        </span>
                      </Link>
                    </li>
                  </Fragment>
                );
              })}
            </ul>
            {list.length > visible.length && (
              <div className="ap-more">
                <button type="button" className="ap-btn ap-btn-ghost" onClick={() => setCount((c) => c + PAGE)}>Show more ({list.length - visible.length} left)</button>
              </div>
            )}
          </>
        )}
      </div>

      {person && (
        <>
          <div className="ap-scrim ap-viewer-scrim" onClick={close} />
          <aside ref={viewer} className={`ap-viewer ap-tone-${tone(person.username)}`} aria-label={`${shown(person)}, profile preview`}>
            <div className="ap-viewer-bar">
              <button type="button" className="ap-viewer-nav" disabled={!prev} onClick={() => prev && open(prev)} aria-label="Previous profile"><ChevronLeftIcon size={18} /></button>
              <span className="ap-viewer-count">{at + 1} of {list.length}</span>
              <button type="button" className="ap-viewer-nav is-next" disabled={!next} onClick={() => next && open(next)} aria-label="Next profile"><ChevronLeftIcon size={18} /></button>
              <button type="button" className="ap-viewer-x" onClick={close} aria-label="Close preview"><CloseIcon size={18} /></button>
            </div>

            <div className="ap-viewer-body" key={person.id}>
              <span className="ap-viewer-avatar" aria-hidden="true">{shown(person).charAt(0)}</span>
              <h2 className="ap-viewer-name">{shown(person)}</h2>
              <p className="ap-mono ap-viewer-addr">{siteHostname(person.username)}</p>
              <p className="ap-viewer-bio">{person.bio || 'No bio yet.'}</p>

              <div className="ap-viewer-actions">
                <Link className="ap-btn" href={'/u/' + person.username}>Open full page<ArrowIcon size={18} className="ap-nudge" /></Link>
                <button type="button" className="ap-btn ap-btn-ghost" onClick={() => copyLink(person)}>
                  {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}{copied ? 'Copied' : 'Copy link'}
                </button>
              </div>

              <h3 className="ap-viewer-h">Projects <span>{projectsOf(person).length}</span></h3>
              <ol className="ap-viewer-projects">
                {projectsOf(person).map((pr, k) => (
                  <li key={k}>
                    <span className="ap-viewer-n" aria-hidden="true">{String(k + 1).padStart(2, '0')}</span>
                    <div>
                      <b>{pr.title}</b>
                      {pr.description && <p>{pr.description}</p>}
                      {pr.url && (
                        <a href={pr.url} target="_blank" rel="noopener noreferrer nofollow">Visit project<ExternalIcon size={14} /></a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
