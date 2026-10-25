'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowIcon, CheckIcon, CompassIcon, CopyIcon, PencilIcon, UploadIcon } from './Icons';
import { SiteMock } from './SiteMock';

export interface DashboardMe {
  username: string;
  name: string;
  bio: string;
  projects: number;
  items: { title: string; description: string }[];
}

interface Task { done: boolean; label: string; href?: string }

function Ring({ value, max }: { value: number; max: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const pct = max ? value / max : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="ap-ring" role="img" aria-label={`${Math.round(pct * 100)} percent complete`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ap-ring-track" cx="50" cy="50" r={r} />
        <circle className="ap-ring-bar" cx="50" cy="50" r={r} strokeDasharray={c} strokeDashoffset={on ? c * (1 - pct) : c} />
      </svg>
      <span aria-hidden="true">{Math.round(pct * 100)}%</span>
    </div>
  );
}

const rise = (i: number) => ({ '--i': i } as CSSProperties);

export function DashboardView({ me, copied, onCopy }: { me: DashboardMe; copied: boolean; onCopy: () => void }) {
  const tasks: Task[] = [
    { done: true, label: 'Create your account' },
    { done: true, label: 'Choose your address' },
    { done: me.bio.trim().length > 0, label: 'Write a short bio', href: '/dashboard/edit' },
    { done: me.projects > 0, label: 'Add your first project', href: '/dashboard/edit' },
  ];
  const doneCount = tasks.filter((t) => t.done).length;
  const firstName = me.name.trim().split(/\s+/)[0] || me.name;

  const next = me.bio.trim().length === 0
    ? { title: 'Write a short bio', text: 'Tell visitors who you are in a sentence or two. It sits right under your name.', cta: 'Add my bio' }
    : me.projects === 0
      ? { title: 'Add your first project', text: 'Show something you built. Projects are what people click on.', cta: 'Add a project' }
      : null;

  return (
    <>
      <div className="ap-dash-head ap-rise" style={rise(0)}>
        <div>
          <h1 className="ap-title">Hi, {firstName}</h1>
          <div className="ap-addr-row">
            <div className="ap-addr">
              <span className="ap-lock" />
              <span>{me.username}<span className="ap-url-dim">.akox.in</span></span>
            </div>
            <button type="button" className={`ap-btn ap-btn-ghost ap-btn-sm${copied ? ' is-done' : ''}`} onClick={onCopy}>
              {copied ? <CheckIcon size={16} className="ap-pop" /> : <CopyIcon size={16} />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <span className="ap-sr" role="status">{copied ? 'Link copied' : ''}</span>
        </div>
        <Link className="ap-btn" href={'/u/' + me.username}>Open my page</Link>
      </div>

      <div className="ap-dash-grid">
        <div className="ap-dash-main">
          {next ? (
            <section className="ap-next ap-rise" style={rise(1)} aria-labelledby="next-h">
              <p className="ap-next-tag">Next step</p>
              <h2 id="next-h">{next.title}</h2>
              <p>{next.text}</p>
              <Link className="ap-btn ap-btn-light" href="/dashboard/edit">{next.cta}<ArrowIcon size={18} className="ap-nudge" /></Link>
            </section>
          ) : (
            <section className="ap-next ap-rise" style={rise(1)} aria-labelledby="next-h">
              <p className="ap-next-tag">All set</p>
              <h2 id="next-h">Your portfolio is ready to share</h2>
              <p>Copy your link and send it to one person today. A real visitor is the best test.</p>
              <div className="ap-actions">
                <button type="button" className="ap-btn ap-btn-light" onClick={onCopy}>{copied ? 'Copied' : 'Copy my link'}</button>
                <Link className="ap-btn ap-btn-onblue" href={'/u/' + me.username}>Open my page</Link>
              </div>
            </section>
          )}

          <div className="ap-tiles">
            <Link className="ap-tile ap-rise" style={rise(2)} href="/dashboard/edit">
              <span className="ap-tile-icon"><PencilIcon /></span>
              <b>Edit portfolio</b>
              <span className="ap-tile-sub">Your bio and projects</span>
            </Link>
            <Link className="ap-tile ap-rise" style={rise(3)} href="/upload">
              <span className="ap-tile-icon"><UploadIcon /></span>
              <b>Upload your site</b>
              <span className="ap-tile-sub">Bring your own code</span>
            </Link>
            <Link className="ap-tile ap-rise" style={rise(4)} href="/explore">
              <span className="ap-tile-icon"><CompassIcon /></span>
              <b>Explore</b>
              <span className="ap-tile-sub">See what others built</span>
            </Link>
          </div>

          <section className="ap-panel ap-rise" style={{ ...rise(5), marginTop: 20 }} aria-labelledby="finish-h">
            <div className="ap-progress-head">
              <Ring value={doneCount} max={tasks.length} />
              <div>
                <h2 className="ap-h2" id="finish-h">Finish your portfolio</h2>
                <p className="ap-note" style={{ margin: 0 }}>{doneCount} of {tasks.length} done</p>
              </div>
            </div>
            <ul className="ap-tasks">
              {tasks.map((t) => (
                <li key={t.label} className={t.done ? '' : 'is-todo'}>
                  <span className={`ap-tick${t.done ? ' is-done' : ''}`} aria-hidden="true">{t.done && <CheckIcon size={13} strokeWidth={3.5} />}</span>
                  <span className="ap-sr">{t.done ? 'Done: ' : 'To do: '}</span>
                  {!t.done && t.href ? <Link className="ap-textlink" href={t.href}>{t.label}</Link> : t.label}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="ap-dash-aside ap-rise" style={rise(2)} aria-label="Preview of your page">
          <p className="ap-note" style={{ margin: '0 0 12px' }}>This is how your page looks right now.</p>
          <SiteMock username={me.username} name={me.name} bio={me.bio} projects={me.items} />
          <p className="ap-note">It goes live on the internet when we deploy AKOX. For now, your page is on this computer.</p>
        </aside>
      </div>
    </>
  );
}
