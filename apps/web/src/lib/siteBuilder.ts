import { PORTFOLIO_LIMITS, TEMPLATE_IDS, parsePortfolioRequest, type PortfolioData, type TemplateId } from '@akox/core';

/** What the form holds. Everything is plain text until it passes parsePortfolioRequest. */
export interface LinkRow { id: string; label: string; url: string }
export interface ProjectRow { id: string; title: string; description: string; url: string; imageUrl: string }
export interface Draft {
  template: TemplateId;
  name: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  contactEmail: string;
  skills: string[];
  links: LinkRow[];
  projects: ProjectRow[];
}

let counter = 0;
export const uid = (): string => `r${Date.now().toString(36)}${(counter++).toString(36)}`;

export const blankDraft = (name = ''): Draft => ({
  template: 'clean', name, headline: '', bio: '', avatarUrl: '', contactEmail: '', skills: [], links: [], projects: [],
});

/** Shown in the template thumbnails until the person has filled in a valid name. */
export const SAMPLE: PortfolioData = {
  name: 'Your Name',
  headline: 'Student and builder',
  bio: 'A short line about you goes here.',
  skills: ['HTML', 'CSS', 'JavaScript'],
  links: [{ label: 'GitHub', url: 'https://github.com' }],
  projects: [
    { title: 'My first project', description: 'What it is and why you built it.' },
    { title: 'Another project', description: 'A short description.' },
  ],
};

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * A saved draft comes back from localStorage, which anyone with the device (or an old version of this page) can change.
 * So it is rebuilt field by field with the right types and lengths. Nothing from storage is used as it is.
 */
export function sanitizeDraft(raw: unknown): Draft | null {
  if (!isRecord(raw)) return null;
  const L = PORTFOLIO_LIMITS;
  const template = TEMPLATE_IDS.find((t) => t === raw.template) ?? 'clean';
  const arr = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
  return {
    template,
    name: str(raw.name, L.name),
    headline: str(raw.headline, L.headline),
    bio: str(raw.bio, L.bio),
    avatarUrl: str(raw.avatarUrl, L.url),
    contactEmail: str(raw.contactEmail, 100),
    skills: arr(raw.skills, L.skills).map((s) => str(s, L.skill).trim()).filter(Boolean),
    links: arr(raw.links, L.links).filter(isRecord).map((l) => ({ id: uid(), label: str(l.label, L.label), url: str(l.url, L.url) })),
    projects: arr(raw.projects, L.projects).filter(isRecord).map((p) => ({
      id: uid(), title: str(p.title, L.title), description: str(p.description, L.description), url: str(p.url, L.url), imageUrl: str(p.imageUrl, L.url),
    })),
  };
}

const blank = (...v: string[]) => v.every((x) => x.trim() === '');

/** The request exactly as the API expects it. Rows the person added but never filled in are left out. */
export function toRequest(d: Draft): { template: TemplateId; data: Record<string, unknown> } {
  return {
    template: d.template,
    data: {
      name: d.name, headline: d.headline, bio: d.bio, avatarUrl: d.avatarUrl, contactEmail: d.contactEmail,
      skills: d.skills,
      links: d.links.filter((l) => !blank(l.label, l.url)).map((l) => ({ label: l.label, url: l.url })),
      projects: d.projects.filter((p) => !blank(p.title, p.description, p.url, p.imageUrl))
        .map((p) => ({ title: p.title, description: p.description, url: p.url, imageUrl: p.imageUrl })),
    },
  };
}

export type Errors = Record<string, string>;

/**
 * parsePortfolioRequest reports only the first problem as one sentence. To show each message next to its own field,
 * every field is checked on its own against a known-good request. The messages are the core's own.
 */
export function fieldErrors(d: Draft): Errors {
  const out: Errors = {};
  const ok = { name: 'x', headline: '', bio: '', skills: [] as unknown[], links: [] as unknown[], projects: [] as unknown[] };
  const check = (key: string, patch: Record<string, unknown>) => {
    const r = parsePortfolioRequest({ template: d.template, data: { ...ok, ...patch } });
    if (!r.ok) out[key] = r.error;
  };
  check('name', { name: d.name });
  check('headline', { headline: d.headline });
  check('bio', { bio: d.bio });
  check('avatarUrl', { avatarUrl: d.avatarUrl });
  check('contactEmail', { contactEmail: d.contactEmail });
  check('skills', { skills: d.skills });
  d.links.forEach((l) => {
    if (blank(l.label, l.url)) return;
    check(`${l.id}:label`, { links: [{ label: l.label, url: 'https://x.y' }] });
    check(`${l.id}:url`, { links: [{ label: 'x', url: l.url }] });
  });
  d.projects.forEach((p) => {
    if (blank(p.title, p.description, p.url, p.imageUrl)) return;
    check(`${p.id}:title`, { projects: [{ title: p.title }] });
    check(`${p.id}:description`, { projects: [{ title: 'x', description: p.description }] });
    check(`${p.id}:url`, { projects: [{ title: 'x', url: p.url }] });
    check(`${p.id}:imageUrl`, { projects: [{ title: 'x', imageUrl: p.imageUrl }] });
  });
  return out;
}

export const draftKey = (userId: string): string => `akox:site-draft:${userId}`;

/**
 * What to show in the preview while the form still has problems. A broken optional field is left out, a broken row is skipped,
 * and an empty name becomes "Your Name". The real publish request is never built from this.
 */
export function previewRequest(d: Draft): { template: TemplateId; data: Record<string, unknown> } {
  const e = fieldErrors(d);
  return {
    template: d.template,
    data: {
      name: e.name || d.name.trim() === '' ? 'Your Name' : d.name,
      headline: e.headline ? '' : d.headline,
      bio: e.bio ? '' : d.bio,
      avatarUrl: e.avatarUrl ? '' : d.avatarUrl,
      contactEmail: e.contactEmail ? '' : d.contactEmail,
      skills: e.skills ? [] : d.skills,
      links: d.links
        .filter((l) => !blank(l.label, l.url) && !e[`${l.id}:label`] && !e[`${l.id}:url`])
        .map((l) => ({ label: l.label, url: l.url })),
      projects: d.projects
        .filter((p) => !blank(p.title, p.description, p.url, p.imageUrl) && !e[`${p.id}:title`])
        .map((p) => ({
          title: p.title,
          description: e[`${p.id}:description`] ? '' : p.description,
          url: e[`${p.id}:url`] ? '' : p.url,
          imageUrl: e[`${p.id}:imageUrl`] ? '' : p.imageUrl,
        })),
    },
  };
}

/**
 * Pasting a Google Images result gives a link to a results page, not to the picture. The picture's own address
 * is inside it. Returns that address when it is a safe https link, otherwise null.
 */
export function directImage(link: string): string | null {
  try {
    const u = new URL(link.trim());
    if (!/(^|\.)google\.[a-z.]+$/i.test(u.hostname) || u.pathname !== '/imgres') return null;
    const inner = u.searchParams.get('imgurl');
    if (!inner) return null;
    const v = new URL(inner);
    return v.protocol === 'https:' && inner.length <= 500 ? v.toString() : null;
  } catch {
    return null;
  }
}
