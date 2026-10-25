'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowIcon, SearchIcon } from './Icons';

export interface Person { id: string; username: string; display_name: string; bio: string; titles: string[] }
type Sort = 'latest' | 'projects' | 'name';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'projects', label: 'Most projects' },
  { id: 'name', label: 'A to Z' },
];

/** Same name always gets the same colour, so a card looks familiar on every visit. */
function tone(username: string): number {
  let h = 0;
  for (const c of username) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 6;
}

const shown = (p: Person) => p.display_name || p.username;

export function ExploreView({ people }: { people: Person[] }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('latest');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = s
      ? people.filter((p) => [p.display_name, p.username, p.bio, ...p.titles].some((t) => t.toLowerCase().includes(s)))
      : people.slice();
    if (sort === 'projects') out.sort((a, b) => b.titles.length - a.titles.length);
    if (sort === 'name') out.sort((a, b) => shown(a).localeCompare(shown(b)));
    return out;
  }, [people, q, sort]);

  const featureFirst = !q.trim() && sort === 'latest' && list.length >= 4;

  return (
    <>
      <div className="ap-xbar">
        <div className="ap-search">
          <SearchIcon size={18} />
          <label className="ap-sr" htmlFor="explore-q">Search portfolios</label>
          <input id="explore-q" className="ap-input" type="search" value={q} placeholder="Search by name or project"
            autoComplete="off" spellCheck={false} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="ap-seg" role="group" aria-label="Sort portfolios">
          {SORTS.map((s) => (
            <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      <p className="ap-note ap-xcount" role="status">
        {list.length} {list.length === 1 ? 'portfolio' : 'portfolios'}{q.trim() ? ` matching “${q.trim()}”` : ''}
      </p>

      {list.length === 0 ? (
        <div className="ap-panel ap-empty">
          <p className="ap-note" style={{ marginTop: 0 }}>Nothing matches that search. Try a name, a skill or a project title.</p>
          <button type="button" className="ap-btn ap-btn-ghost" onClick={() => setQ('')}>Clear search</button>
        </div>
      ) : (
        <div className="ap-grid">
          {list.map((p, i) => {
            const feature = featureFirst && i === 0;
            const initial = shown(p).charAt(0);
            const n = p.titles.length;
            return (
              <Link
                key={p.id}
                href={'/u/' + p.username}
                className={`ap-pcard ap-rise ap-tone-${tone(p.username)}${feature ? ' is-feature' : ''}`}
                style={{ '--i': Math.min(i, 9) } as CSSProperties}
              >
                <span className="ap-cover" aria-hidden="true">
                  <span className="ap-cover-mark">{initial}</span>
                  <span className="ap-chips">
                    {p.titles.slice(0, 3).map((t, k) => <span className="ap-chip" key={k}>{t}</span>)}
                  </span>
                </span>
                <span className="ap-pbody">
                  <span className="ap-pavatar" aria-hidden="true">{initial}</span>
                  <b>{shown(p)}</b>
                  <span className="ap-mono">{p.username}.akox.in</span>
                  {p.bio && <span className="ap-pbio">{p.bio}</span>}
                  <span className="ap-pfoot">
                    <span>{n} {n === 1 ? 'project' : 'projects'}</span>
                    <span className="ap-view">View portfolio<ArrowIcon size={16} /></span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
