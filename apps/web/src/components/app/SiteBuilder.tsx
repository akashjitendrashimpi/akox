'use client';

import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { PORTFOLIO_LIMITS as L, parsePortfolioRequest, renderPortfolio, type PortfolioData } from '@akox/core';
import { getSupabase } from '../../lib/supabase';
import { DAILY_LIMIT } from '../../lib/limits';
import { asKind, confirmReplace, fmtWhen, kindLabel, type SiteKind } from '../../lib/liveSite';
import {
  SAMPLE, blankDraft, draftKey, fieldErrors, previewRequest, sanitizeDraft, toRequest, uid,
  type Draft, type LinkRow, type ProjectRow,
} from '../../lib/siteBuilder';
import { CheckIcon, CloseIcon, PlusIcon, SuccessMark, TrashIcon } from './Icons';
import { ImageHint } from './ImageHint';
import { PageHeader } from './PageHeader';
import { ScaledFrame } from './ScaledFrame';
import { useShellUser } from './Shell';
import { TemplatePicker } from './TemplatePicker';

const decode = (d: Uint8Array | undefined): string => new TextDecoder().decode(d);

/** A label, a character counter, the input, and its own error underneath. */
function Field({ id, label, count, max, error, hint, children }: { id: string; label: string; count?: number; max?: number; error?: string; hint?: string; children: ReactNode }) {
  const near = max !== undefined && count !== undefined && count >= max * 0.9;
  return (
    <div className="ap-bf">
      <div className="ap-bf-top">
        <label htmlFor={id}>{label}</label>
        {max !== undefined && <span className={`ap-count${near ? ' is-near' : ''}`} aria-hidden="true">{count ?? 0}/{max}</span>}
      </div>
      {children}
      {hint && !error && <p className="ap-bf-hint" id={`${id}-h`}>{hint}</p>}
      {error && <p className="ap-bf-err" id={`${id}-e`} role="alert">{error}</p>}
    </div>
  );
}

const describe = (id: string, error?: string, hint?: string): string | undefined => (error ? `${id}-e` : hint ? `${id}-h` : undefined);

export function SiteBuilder() {
  const { status, user } = useShellUser();
  const [draft, setDraft] = useState<Draft>(() => blankDraft());
  const [restored, setRestored] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [skillText, setSkillText] = useState('');
  const [pane, setPane] = useState<'edit' | 'preview'>('edit');
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop');
  const [left, setLeft] = useState(DAILY_LIMIT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const [kind, setKind] = useState<SiteKind | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const lastGood = useRef('');

  // On a phone, showing the phone layout is the honest preview.
  useEffect(() => { if (window.matchMedia('(max-width: 999px)').matches) setDevice('phone'); }, []);

  // ---- load the draft once we know who is signed in; fall back to their profile name
  useEffect(() => {
    if (status !== 'in' || !user || restored) return;
    let next: Draft | null = null;
    try {
      const raw = localStorage.getItem(draftKey(user.id));
      if (raw) next = sanitizeDraft(JSON.parse(raw));
    } catch { /* unreadable draft: start fresh */ }
    setDraft(next ?? blankDraft(user.name));
    setRestored(true);
  }, [status, user, restored]);

  // ---- save the draft on this device, a moment after typing stops
  useEffect(() => {
    if (!restored || !user) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey(user.id), JSON.stringify(draft)); setSaved(true); } catch { setSaved(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [draft, restored, user]);

  // ---- uploads left today (same count the Upload page uses)
  useEffect(() => {
    const sb = getSupabase();
    if (status !== 'in' || !user || !sb) return;
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    void sb.from('publish_log').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).gte('created_at', since)
      .then(({ count }) => setLeft(Math.max(0, DAILY_LIMIT - (count ?? 0))));
    // What is live right now, so we can ask before replacing a different kind of site.
    void sb.from('portfolio_sites').select('kind, previous_kind, updated_at').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => { setKind(data ? asKind(data.kind) : null); setUpdatedAt(data?.updated_at ? String(data.updated_at) : null); });
  }, [status, user]);

  const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value })), []);
  const touch = (key: string) => setTouched((t) => (t.has(key) ? t : new Set(t).add(key)));

  // ---- validation: the core decides, nothing here re-implements its rules
  const request = useMemo(() => toRequest(draft), [draft]);
  const parsed = useMemo(() => parsePortfolioRequest(request), [request]);
  const errors = useMemo(() => fieldErrors(draft), [draft]);
  const errorCount = Object.keys(errors).length;
  const show = (key: string): string | undefined => (touched.has(key) || submitted ? errors[key] : undefined);

  // ---- preview: always something to look at. Problem fields are left out of the preview (never out of the form),
  // so a draft with one bad link still shows the rest of the page, even right after the page loads.
  const deferredDraft = useDeferredValue(draft);
  const preview = useMemo(() => {
    const r = parsePortfolioRequest(previewRequest(deferredDraft));
    if (r.ok) lastGood.current = decode(renderPortfolio(r.template, r.data).files[0]?.data);
    return { html: lastGood.current, data: r.ok ? r.data : null };
  }, [deferredDraft]);
  const pickerData: PortfolioData = preview.data ?? SAMPLE;

  // ---- skills
  function addSkills(text: string) {
    const parts = text.split(',').map((s) => s.trim().slice(0, L.skill)).filter(Boolean);
    if (parts.length === 0) return;
    setDraft((d) => {
      const have = new Set(d.skills.map((s) => s.toLowerCase()));
      const next = [...d.skills];
      for (const p of parts) if (next.length < L.skills && !have.has(p.toLowerCase())) { next.push(p); have.add(p.toLowerCase()); }
      return { ...d, skills: next };
    });
    setSkillText('');
  }
  function onSkillKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkills(skillText); }
    else if (e.key === 'Backspace' && skillText === '' && draft.skills.length) set('skills', draft.skills.slice(0, -1));
  }

  // ---- rows
  const patchLink = (id: string, p: Partial<LinkRow>) => set('links', draft.links.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const patchProject = (id: string, p: Partial<ProjectRow>) => set('projects', draft.projects.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const moveProject = (i: number, by: -1 | 1) => {
    const j = i + by;
    if (j < 0 || j >= draft.projects.length) return;
    const next = draft.projects.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    set('projects', next);
  };

  function reset() {
    if (!window.confirm('Clear everything on this page and start again?')) return;
    setDraft(blankDraft(user?.name ?? ''));
    setTouched(new Set()); setSubmitted(false); setError(''); setLive(false);
  }

  // ---- publish: only what passed validation is sent, never the raw form
  async function publish() {
    setSubmitted(true); setError('');
    const r = parsePortfolioRequest(request);
    if (!r.ok) { setError(r.error); setPane('edit'); return; }
    const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
    if (!token) { setError('Please log in again.'); return; }
    setBusy(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch('/api/publish-template', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: r.template, data: r.data }),
        signal: ctrl.signal, credentials: 'omit', cache: 'no-store',
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; left?: number; kind?: string };
      if (!res.ok) { setError(body.error ?? 'Publishing failed.'); return; }
      setLeft(typeof body.left === 'number' ? Math.max(0, body.left) : Math.max(0, left - 1));
      setKind(asKind(body.kind) ?? 'template'); setUpdatedAt(new Date().toISOString());
      setLive(true);
    } catch (e) {
      setError(e instanceof DOMException && e.name === 'AbortError'
        ? 'That took too long. Check your connection and try again.'
        : 'Could not reach the server. Check your connection and try again.');
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  const signedIn = status === 'in' && Boolean(user);
  const canPublish = signedIn && restored && !busy && left > 0 && errorCount === 0 && parsed.ok;
  const address = user?.username ? `${user.username}.akox.in` : 'your address';

  return (
    <>
      <PageHeader title="Build a site" lead="Pick a template, fill in your details and watch it appear. Nothing goes live until you publish." />

      <div className="ap-segtabs ap-builder-tabs" role="tablist" aria-label="Editor or preview">
        <button type="button" role="tab" aria-selected={pane === 'edit'} onClick={() => setPane('edit')}>Edit</button>
        <button type="button" role="tab" aria-selected={pane === 'preview'} onClick={() => setPane('preview')}>Preview</button>
      </div>

      <div className={`ap-builder is-${pane}`}>
        <div className="ap-builder-form">
          <section className="ap-bsec" aria-labelledby="b-tpl">
            <h2 className="ap-h2" id="b-tpl">1. Template</h2>
            <TemplatePicker value={draft.template} data={pickerData} onChange={(t) => set('template', t)} />
          </section>

          <section className="ap-bsec" aria-labelledby="b-you">
            <h2 className="ap-h2" id="b-you">2. About you</h2>
            <Field id="f-name" label="Name (required)" count={draft.name.length} max={L.name} error={show('name')}>
              <input id="f-name" className="ap-input" value={draft.name} maxLength={L.name} autoComplete="name" required
                aria-invalid={Boolean(show('name'))} aria-describedby={describe('f-name', show('name'))}
                onChange={(e) => set('name', e.target.value)} onBlur={() => touch('name')} />
            </Field>
            <Field id="f-headline" label="Headline" count={draft.headline.length} max={L.headline} error={show('headline')} hint="One line under your name, like “Design student in Pune”.">
              <input id="f-headline" className="ap-input" value={draft.headline} maxLength={L.headline}
                aria-invalid={Boolean(show('headline'))} aria-describedby={describe('f-headline', show('headline'), 'x')}
                onChange={(e) => set('headline', e.target.value)} onBlur={() => touch('headline')} />
            </Field>
            <Field id="f-bio" label="About you" count={draft.bio.length} max={L.bio} error={show('bio')}>
              <textarea id="f-bio" className="ap-input" rows={4} value={draft.bio} maxLength={L.bio}
                aria-invalid={Boolean(show('bio'))} aria-describedby={describe('f-bio', show('bio'))}
                onChange={(e) => set('bio', e.target.value)} onBlur={() => touch('bio')} />
            </Field>
            <Field id="f-avatar" label="Photo link" error={show('avatarUrl')} hint="A link to a picture of you. It must start with https://">
              <input id="f-avatar" className="ap-input" type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://" value={draft.avatarUrl} maxLength={L.url}
                aria-invalid={Boolean(show('avatarUrl'))} aria-describedby={describe('f-avatar', show('avatarUrl'), 'x')}
                onChange={(e) => set('avatarUrl', e.target.value)} onBlur={() => touch('avatarUrl')} />
              <ImageHint url={draft.avatarUrl} invalid={Boolean(errors.avatarUrl)} onUse={(u) => set('avatarUrl', u)} />
            </Field>
            <Field id="f-email" label="Contact email" error={show('contactEmail')} hint="Shows a “Contact me” button. Anyone who visits can see it.">
              <input id="f-email" className="ap-input" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={draft.contactEmail} maxLength={100}
                aria-invalid={Boolean(show('contactEmail'))} aria-describedby={describe('f-email', show('contactEmail'), 'x')}
                onChange={(e) => set('contactEmail', e.target.value)} onBlur={() => touch('contactEmail')} />
            </Field>
          </section>

          <section className="ap-bsec" aria-labelledby="b-skills">
            <h2 className="ap-h2" id="b-skills">3. Skills</h2>
            <Field id="f-skill" label="Add a skill" count={draft.skills.length} max={L.skills} error={show('skills')} hint="Type a skill and press Enter. Commas add several at once.">
              <div className="ap-skillbox">
                {draft.skills.map((s, i) => (
                  <span className="ap-skill" key={s}>{s}
                    <button type="button" aria-label={`Remove ${s}`} onClick={() => set('skills', draft.skills.filter((_, k) => k !== i))}><CloseIcon size={14} /></button>
                  </span>
                ))}
                <input id="f-skill" value={skillText} maxLength={L.skill * 4} disabled={draft.skills.length >= L.skills} autoComplete="off" spellCheck={false}
                  aria-describedby="f-skill-h" placeholder={draft.skills.length ? '' : 'HTML, Figma, Public speaking'}
                  onChange={(e) => setSkillText(e.target.value)} onKeyDown={onSkillKey} onBlur={() => addSkills(skillText)} />
              </div>
            </Field>
          </section>

          <section className="ap-bsec" aria-labelledby="b-links">
            <div className="ap-bsec-head">
              <h2 className="ap-h2" id="b-links">4. Links</h2>
              <span className="ap-count" aria-hidden="true">{draft.links.length}/{L.links}</span>
            </div>
            {draft.links.map((l, i) => (
              <div className="ap-brow" key={l.id}>
                <Field id={`${l.id}-label`} label={`Link ${i + 1} label`} count={l.label.length} max={L.label} error={show(`${l.id}:label`)}>
                  <input id={`${l.id}-label`} className="ap-input" value={l.label} maxLength={L.label} placeholder="GitHub"
                    aria-invalid={Boolean(show(`${l.id}:label`))} aria-describedby={describe(`${l.id}-label`, show(`${l.id}:label`))}
                    onChange={(e) => patchLink(l.id, { label: e.target.value })} onBlur={() => touch(`${l.id}:label`)} />
                </Field>
                <Field id={`${l.id}-url`} label="Web address" error={show(`${l.id}:url`)}>
                  <input id={`${l.id}-url`} className="ap-input" type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://" value={l.url} maxLength={L.url}
                    aria-invalid={Boolean(show(`${l.id}:url`))} aria-describedby={describe(`${l.id}-url`, show(`${l.id}:url`))}
                    onChange={(e) => patchLink(l.id, { url: e.target.value })} onBlur={() => touch(`${l.id}:url`)} />
                </Field>
                <button type="button" className="ap-rowbtn" aria-label={`Remove link ${i + 1}`} onClick={() => set('links', draft.links.filter((x) => x.id !== l.id))}><TrashIcon size={18} /></button>
              </div>
            ))}
            <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" disabled={draft.links.length >= L.links} onClick={() => set('links', [...draft.links, { id: uid(), label: '', url: '' }])}>
              <PlusIcon size={16} />Add a link
            </button>
          </section>

          <section className="ap-bsec" aria-labelledby="b-proj">
            <div className="ap-bsec-head">
              <h2 className="ap-h2" id="b-proj">5. Projects</h2>
              <span className="ap-count" aria-hidden="true">{draft.projects.length}/{L.projects}</span>
            </div>
            {draft.projects.map((p, i) => (
              <fieldset className="ap-bproj" key={p.id}>
                <legend>Project {i + 1}</legend>
                <Field id={`${p.id}-title`} label="Title" count={p.title.length} max={L.title} error={show(`${p.id}:title`)}>
                  <input id={`${p.id}-title`} className="ap-input" value={p.title} maxLength={L.title}
                    aria-invalid={Boolean(show(`${p.id}:title`))} aria-describedby={describe(`${p.id}-title`, show(`${p.id}:title`))}
                    onChange={(e) => patchProject(p.id, { title: e.target.value })} onBlur={() => touch(`${p.id}:title`)} />
                </Field>
                <Field id={`${p.id}-desc`} label="Description" count={p.description.length} max={L.description} error={show(`${p.id}:description`)}>
                  <textarea id={`${p.id}-desc`} className="ap-input" rows={3} value={p.description} maxLength={L.description}
                    aria-invalid={Boolean(show(`${p.id}:description`))} aria-describedby={describe(`${p.id}-desc`, show(`${p.id}:description`))}
                    onChange={(e) => patchProject(p.id, { description: e.target.value })} onBlur={() => touch(`${p.id}:description`)} />
                </Field>
                <div className="ap-bpair">
                  <Field id={`${p.id}-url`} label="Project link" error={show(`${p.id}:url`)}>
                    <input id={`${p.id}-url`} className="ap-input" type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://" value={p.url} maxLength={L.url}
                      aria-invalid={Boolean(show(`${p.id}:url`))} aria-describedby={describe(`${p.id}-url`, show(`${p.id}:url`))}
                      onChange={(e) => patchProject(p.id, { url: e.target.value })} onBlur={() => touch(`${p.id}:url`)} />
                  </Field>
                  <Field id={`${p.id}-img`} label="Image link" error={show(`${p.id}:imageUrl`)}>
                    <input id={`${p.id}-img`} className="ap-input" type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://" value={p.imageUrl} maxLength={L.url}
                      aria-invalid={Boolean(show(`${p.id}:imageUrl`))} aria-describedby={describe(`${p.id}-img`, show(`${p.id}:imageUrl`))}
                      onChange={(e) => patchProject(p.id, { imageUrl: e.target.value })} onBlur={() => touch(`${p.id}:imageUrl`)} />
                    <ImageHint url={p.imageUrl} invalid={Boolean(errors[`${p.id}:imageUrl`])} onUse={(u) => patchProject(p.id, { imageUrl: u })} />
                  </Field>
                </div>
                <div className="ap-bproj-tools">
                  <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" disabled={i === 0} onClick={() => moveProject(i, -1)}>Move up</button>
                  <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" disabled={i === draft.projects.length - 1} onClick={() => moveProject(i, 1)}>Move down</button>
                  <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm ap-btn-danger" onClick={() => set('projects', draft.projects.filter((x) => x.id !== p.id))}><TrashIcon size={16} />Remove</button>
                </div>
              </fieldset>
            ))}
            <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" disabled={draft.projects.length >= L.projects} onClick={() => set('projects', [...draft.projects, { id: uid(), title: '', description: '', url: '', imageUrl: '' }])}>
              <PlusIcon size={16} />Add a project
            </button>
          </section>

          <section className="ap-bsec ap-publish" aria-labelledby="b-pub">
            <h2 className="ap-h2" id="b-pub">6. Publish</h2>
            {live ? (
              <div className="ap-celebrate" role="status">
                <h3 className="ap-h2 ap-live"><SuccessMark />Your site is live</h3>
                <p className="ap-live-url ap-mono">{address}</p>
                <p className="ap-note">On this computer it opens at /s/{user?.username}.</p>
                <div className="ap-actions">
                  <a className="ap-btn" href={'/s/' + (user?.username ?? '') + '/'} target="_blank" rel="noopener">Open my site</a>
                  <button type="button" className="ap-btn ap-btn-ghost" onClick={() => setLive(false)}>Keep editing</button>
                </div>
              </div>
            ) : (
              <>
                <p className="ap-note" style={{ margin: '0 0 12px' }}>
                  Publishing puts this page at <span className="ap-mono">{address}</span>. You have one live site, so it replaces whatever is live there now. {kind ? <>Live now: <b>{kindLabel(kind)}</b>{updatedAt ? `, updated ${fmtWhen(updatedAt)}` : ''}.</> : 'Nothing is published yet.'}
                </p>
                {!signedIn && status !== 'loading' && <p className="ap-note bad">You need to <Link className="ap-textlink" href="/login">log in</Link> to publish.</p>}
                {error && <div className="ap-alert" role="alert"><b>Could not publish</b><span>{error}</span></div>}
                {submitted && errorCount > 0 && !error && <div className="ap-alert" role="alert"><b>Fix {errorCount === 1 ? 'one thing' : `${errorCount} things`} first</b><span>The fields marked in red tell you what to change.</span></div>}
                <div className="ap-pubrow">
                  <button type="button" className="ap-btn" aria-busy={busy} disabled={busy || !signedIn || !restored || left === 0} onClick={() => { if (confirmReplace(kind, 'template')) void publish(); }}>
                    {left === 0 ? 'No uploads left today' : busy ? 'Publishing...' : `Publish to ${address}`}
                  </button>
                  <button type="button" className="ap-btn ap-btn-ghost" disabled={busy} onClick={reset}>Start over</button>
                </div>
                {!canPublish && signedIn && left > 0 && errorCount > 0 && !submitted && <p className="ap-note" style={{ marginTop: 10 }}>{errorCount} {errorCount === 1 ? 'field needs' : 'fields need'} a look before you can publish.</p>}
              </>
            )}
            {signedIn && (
              <div className="ap-meter ap-panel" style={{ marginTop: 18 }}>
                <p className="ap-note" style={{ margin: 0 }}>Uploads left today: {left} of {DAILY_LIMIT}</p>
                <div className="ap-slots" role="progressbar" aria-label="Uploads left today" aria-valuemin={0} aria-valuemax={DAILY_LIMIT} aria-valuenow={left}>
                  {Array.from({ length: DAILY_LIMIT }, (_, k) => <i key={k} className={k < left ? 'is-on' : ''} />)}
                </div>
              </div>
            )}
            <p className="ap-note ap-draftnote">{saved ? 'Your draft is saved on this device only.' : 'Your draft is not saved yet.'}</p>
          </section>
        </div>

        <aside className="ap-builder-preview" aria-label="Live preview">
          <div className="ap-pv-bar">
            <span className="ap-pv-title">Live preview</span>
            <div className="ap-pv-switch" role="group" aria-label="Preview size">
              <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>Desktop</button>
              <button type="button" aria-pressed={device === 'phone'} onClick={() => setDevice('phone')}>Phone</button>
            </div>
          </div>
          {errorCount > 0 && <p className="ap-pv-note" role="status">{errorCount === 1 ? 'One field has a problem' : `${errorCount} fields have problems`}, so the preview leaves {errorCount === 1 ? 'it' : 'them'} out.</p>}
          <div className={`ap-pv-stage is-${device}`}>
            <ScaledFrame html={preview.html} width={device === 'desktop' ? 1100 : 390} title="Preview of your site" />
          </div>
        </aside>
      </div>
    </>
  );
}
