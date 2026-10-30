'use client';

import Link from 'next/link';
import { limitsFor } from '@akox/core';
import { SITE_SUFFIX } from '../../lib/site-url';
import { fmtBytes, planLabel } from '../../lib/plan';
import { fmtWhen, kindLabel, type SiteKind } from '../../lib/liveSite';
import { useEffect, useState } from 'react';
import { ChevronLeftIcon, CheckIcon, CompassIcon, CopyIcon, GearIcon, LayoutIcon, PencilIcon, UploadIcon } from './Icons';
import { PageHeader } from './PageHeader';
import { SiteMock } from './SiteMock';
import { StorageMeter } from './StorageMeter';

export interface DashboardMe {
  username: string;
  name: string;
  bio: string;
  projects: number;
  items: { title: string; description: string }[];
  /** profiles.plan */
  plan: string | null;
  /** portfolio_sites.total_bytes */
  usedBytes: number;
  /** Uploads left in the last 24 hours, out of `uploadsMax`. Left out when unknown. */
  /** portfolio_sites.kind. null means nothing is published yet. */
  kind?: SiteKind | null;
  previousKind?: SiteKind | null;
  updatedAt?: string | null;
  uploadsLeft?: number;
  uploadsMax?: number;
}

interface Task { done: boolean; label: string; href?: string }

const SHORTCUTS = [
  { href: '/dashboard/edit', title: 'Profile and projects', sub: 'Your card in Explore', tint: 'blue', Icon: PencilIcon },
  { href: '/dashboard/templates', title: 'Build a site', sub: 'Pick a template and fill it in', tint: 'purple', Icon: LayoutIcon },
  { href: '/dashboard/upload', title: 'Upload your site', sub: 'Publish a zip of your own code', tint: 'green', Icon: UploadIcon },
  { href: '/explore', title: 'Explore', sub: 'See what others published', tint: 'orange', Icon: CompassIcon },
  { href: '/dashboard/settings', title: 'Settings', sub: 'Light or dark, and log out', tint: 'gray', Icon: GearIcon },
] as const;

interface RingSpec { key: string; label: string; value: string; frac: number }

/** Three rings, one inside the other. Each is a real number: profile steps, storage used, uploads left today. */
function Rings({ rings }: { rings: RingSpec[] }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const radii = [52, 39, 26];
  return (
    <div className="ap-rings">
      <svg viewBox="0 0 120 120" role="img" aria-label={rings.map((r) => `${r.label}: ${r.value}`).join('. ')}>
        {rings.map((r, i) => {
          const rad = radii[i] ?? 26;
          const c = 2 * Math.PI * rad;
          const f = Math.max(0, Math.min(1, r.frac));
          return (
            <g key={r.key} className={`ap-rg is-${r.key}`} transform="rotate(-90 60 60)">
              <circle className="ap-rg-track" cx="60" cy="60" r={rad} />
              <circle className="ap-rg-bar" cx="60" cy="60" r={rad} strokeDasharray={c} strokeDashoffset={on ? c * (1 - f) : c} />
            </g>
          );
        })}
      </svg>
      <ul className="ap-rings-key">
        {rings.map((r) => (
          <li key={r.key} className={`is-${r.key}`}>
            <span className="ap-rings-dot" aria-hidden="true" />
            <span><small>{r.label}</small><b>{r.value}</b></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardView({ me, copied, onCopy }: { me: DashboardMe; copied: boolean; onCopy: () => void }) {
  const tasks: Task[] = [
    { done: true, label: 'Create your account' },
    { done: true, label: 'Choose your address' },
    { done: me.bio.trim().length > 0, label: 'Write a short bio', href: '/dashboard/edit' },
    { done: me.projects > 0, label: 'Add your first project', href: '/dashboard/edit' },
  ];
  const doneCount = tasks.filter((t) => t.done).length;
  const complete = doneCount === tasks.length;
  const max = limitsFor(me.plan).maxUnpackedBytes;
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  const rings: RingSpec[] = [
    { key: 'profile', label: 'Profile', value: `${doneCount} of ${tasks.length} steps`, frac: doneCount / tasks.length },
    { key: 'storage', label: 'Storage', value: `${fmtBytes(me.usedBytes)} of ${fmtBytes(max)}`, frac: max ? me.usedBytes / max : 0 },
  ];
  if (me.uploadsLeft !== undefined && me.uploadsMax) {
    rings.push({ key: 'uploads', label: 'Uploads left today', value: `${me.uploadsLeft} of ${me.uploadsMax}`, frac: me.uploadsLeft / me.uploadsMax });
  }

  return (
    <div className="ap-home">
      <header className="ap-home-head">
        <p className="ap-home-date">{date}</p>
        <h1>{me.name}</h1>
      </header>

      <section className="ap-hero" aria-label="Your page">
        <div className="ap-hero-text">
          <p className="ap-hero-cap">Your page</p>
          <h2 className="ap-mono">{me.username}<span>{SITE_SUFFIX}</span></h2>
          <p className="ap-hero-sub">
            {me.kind
              ? <>Live now: <b>{kindLabel(me.kind)}</b>{me.updatedAt ? `, updated ${fmtWhen(me.updatedAt)}` : ''}.
                {me.previousKind ? ` The previous version (${kindLabel(me.previousKind)}) is one click away on the Upload page.` : ''}</>
              : 'Nothing is published yet. Build a site from a template, or upload your own.'}
          </p>
          <div className="ap-hero-actions">
            {me.kind
              ? <Link className="ap-btn" href={'/u/' + me.username}>Open my page</Link>
              : <Link className="ap-btn" href="/dashboard/templates">Build a site</Link>}
            <button type="button" className="ap-btn ap-btn-ghost" onClick={onCopy}>
              {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}{copied ? 'Copied' : 'Copy link'}
            </button>
            <span className="ap-sr" role="status">{copied ? 'Link copied' : ''}</span>
          </div>
        </div>
        <div className="ap-hero-art" aria-hidden="true">
          <SiteMock username={me.username} name={me.name} bio={me.bio} projects={me.items} />
        </div>
      </section>

      {/* The to-do list is only here while there is something left to do. */}
      {!complete && (
        <section className="ap-group-wrap" aria-labelledby="finish-h">
          <h2 className="ap-group-h" id="finish-h">Finish your portfolio</h2>
          <ul className="ap-group">
            {tasks.map((t) => (
              <li key={t.label} className={t.done ? 'is-done' : 'is-todo'}>
                {!t.done && t.href ? (
                  <Link href={t.href}>
                    <span className="ap-circle" aria-hidden="true" /><span className="ap-sr">To do: </span>{t.label}
                    <ChevronLeftIcon size={16} className="ap-chev" />
                  </Link>
                ) : (
                  <span className="ap-group-row">
                    <span className="ap-circle is-done" aria-hidden="true"><CheckIcon size={13} strokeWidth={3.5} /></span><span className="ap-sr">Done: </span>{t.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ap-home-grid">
        <section className="ap-card" aria-labelledby="rings-h">
          <h2 className="ap-group-h" id="rings-h">Overview</h2>
          <Rings rings={rings} />
        </section>

        <section className="ap-group-wrap" aria-labelledby="short-h">
          <h2 className="ap-group-h" id="short-h">Shortcuts</h2>
          <ul className="ap-group">
            {SHORTCUTS.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>
                  <span className={`ap-ico is-${r.tint}`} aria-hidden="true"><r.Icon size={18} /></span>
                  <span className="ap-group-text"><b>{r.title}</b><small>{r.sub}</small></span>
                  <ChevronLeftIcon size={16} className="ap-chev" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <StorageMeter used={me.usedBytes} plan={me.plan} />
    </div>
  );
}
