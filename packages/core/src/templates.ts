import type { Bundle } from './bundle';

export const TEMPLATE_IDS = ['clean', 'midnight', 'studio'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATES: readonly { id: TemplateId; name: string; description: string }[] = [
  { id: 'clean', name: 'Clean', description: 'Light and simple. Good for job applications.' },
  { id: 'midnight', name: 'Midnight', description: 'Dark with a soft violet accent. Good for developers and designers.' },
  { id: 'studio', name: 'Studio', description: 'Warm and bold. Good for founders and freelancers.' },
];

export const PORTFOLIO_LIMITS = {
  name: 60, headline: 100, bio: 1000, skill: 30, skills: 30,
  links: 8, label: 30, projects: 12, title: 80, description: 500, url: 500,
} as const;

export interface PortfolioLink { label: string; url: string }
export interface PortfolioProject { title: string; description: string; url?: string; imageUrl?: string }
export interface PortfolioData {
  name: string;
  headline: string;
  bio: string;
  /** https only */
  avatarUrl?: string;
  contactEmail?: string;
  skills: string[];
  links: PortfolioLink[];
  projects: PortfolioProject[];
}

export type ParsedRequest =
  | { ok: true; template: TemplateId; data: PortfolioData }
  | { ok: false; error: string };

// ---------- validation (never trust the browser) ----------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function text(v: unknown, field: string, max: number, required = false): string {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') throw new Error(`${field} must be text.`);
  const t = v.trim();
  if (required && t === '') throw new Error(`${field} is required.`);
  if (t.length > max) throw new Error(`${field} is too long (up to ${max} characters).`);
  return t;
}

function webLink(v: unknown, field: string, protocols: readonly string[]): string | undefined {
  const t = text(v, field, PORTFOLIO_LIMITS.url);
  if (t === '') return undefined;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    throw new Error(`${field} is not a valid link.`);
  }
  if (!protocols.includes(u.protocol)) {
    throw new Error(`${field} must start with ${protocols.map((p) => p + '//').join(' or ')}.`);
  }
  return u.toString();
}

function emailOf(v: unknown): string | undefined {
  const t = text(v, 'Email', 100);
  if (t === '') return undefined;
  if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(t)) throw new Error('Email is not valid.');
  return t;
}

function list(v: unknown, field: string, max: number): unknown[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new Error(`${field} must be a list.`);
  if (v.length > max) throw new Error(`${field}: at most ${max} items.`);
  return v;
}

export function parsePortfolioRequest(input: unknown): ParsedRequest {
  try {
    if (!isRecord(input)) throw new Error('Invalid request.');
    const template = TEMPLATE_IDS.find((t) => t === input.template);
    if (!template) throw new Error('Choose a template.');
    const d = input.data;
    if (!isRecord(d)) throw new Error('Missing portfolio details.');
    const L = PORTFOLIO_LIMITS;
    const data: PortfolioData = {
      name: text(d.name, 'Name', L.name, true),
      headline: text(d.headline, 'Headline', L.headline),
      bio: text(d.bio, 'About you', L.bio),
      avatarUrl: webLink(d.avatarUrl, 'Photo link', ['https:']),
      contactEmail: emailOf(d.contactEmail),
      skills: list(d.skills, 'Skills', L.skills).map((s) => text(s, 'Skill', L.skill, true)),
      links: list(d.links, 'Links', L.links).map((item) => {
        if (!isRecord(item)) throw new Error('Each link needs a label and a web address.');
        const address = webLink(item.url, 'Link', ['https:', 'http:']);
        if (!address) throw new Error('Each link needs a web address.');
        return { label: text(item.label, 'Link label', L.label, true), url: address };
      }),
      projects: list(d.projects, 'Projects', L.projects).map((item) => {
        if (!isRecord(item)) throw new Error('Each project needs a title.');
        return {
          title: text(item.title, 'Project title', L.title, true),
          description: text(item.description, 'Project description', L.description),
          url: webLink(item.url, 'Project link', ['https:', 'http:']),
          imageUrl: webLink(item.imageUrl, 'Project image link', ['https:']),
        };
      }),
    };
    return { ok: true, template, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid request.' };
  }
}

// ---------- rendering (pure: same input, same page) ----------

interface Theme {
  bg: string; ink: string; muted: string; card: string; line: string;
  accent: string; on: string; heading: string; body: string;
}

const SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const THEMES: Record<TemplateId, Theme> = {
  clean: { bg: '#ffffff', ink: '#16181d', muted: '#565d6b', card: '#f5f6f8', line: '#e3e5ea', accent: '#2f4bd8', on: '#ffffff', heading: 'Georgia,"Times New Roman",serif', body: SANS },
  midnight: { bg: '#0e1117', ink: '#e8ebf2', muted: '#a3abbc', card: '#171c26', line: '#262d3b', accent: '#a99bff', on: '#10101a', heading: SANS, body: SANS },
  studio: { bg: '#fbf4ea', ink: '#2a1f17', muted: '#66554a', card: '#ffffff', line: '#eadfce', accent: '#c2410c', on: '#ffffff', heading: 'Georgia,"Times New Roman",serif', body: SANS },
};

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function css(t: Theme): string {
  return `:root{--bg:${t.bg};--ink:${t.ink};--muted:${t.muted};--card:${t.card};--line:${t.line};--accent:${t.accent};--on:${t.on}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 ${t.body}}
main{max-width:900px;margin:0 auto;padding:clamp(24px,6vw,72px) 20px 64px}
h1,h2,h3{font-family:${t.heading};line-height:1.15;margin:0}
h1{font-size:clamp(2.2rem,7vw,3.6rem);letter-spacing:-.02em}
h2{font-size:1.3rem;margin:48px 0 16px}
.top{display:flex;gap:24px;align-items:center;flex-wrap:wrap}
.top img{width:112px;height:112px;border-radius:50%;object-fit:cover}
.headline{color:var(--accent);font-weight:600;margin:8px 0 0}
.bio{color:var(--muted);max-width:62ch;margin:20px 0 0;white-space:pre-line}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
a{color:var(--accent)}
.btn{display:inline-block;padding:10px 18px;border-radius:10px;background:var(--accent);color:var(--on);text-decoration:none;font-weight:600}
.btn.alt{background:transparent;color:var(--ink);border:1px solid var(--line)}
.chips{display:flex;gap:8px;flex-wrap:wrap;padding:0;list-style:none;margin:0}
.chips li{padding:6px 14px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:.95rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.card div{padding:16px 18px 20px}
.card p{margin:8px 0 0;color:var(--muted);font-size:.97rem}
:focus-visible{outline:3px solid var(--accent);outline-offset:3px}`;
}

function projectCard(p: PortfolioProject): string {
  const title = p.url
    ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>`
    : esc(p.title);
  const image = p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="" loading="lazy">` : '';
  const about = p.description ? `<p>${esc(p.description)}</p>` : '';
  return `<article class="card">${image}<div><h3>${title}</h3>${about}</div></article>`;
}

function buildHtml(data: PortfolioData, t: Theme): string {
  const desc = data.headline || data.bio.slice(0, 160) || `${data.name}'s portfolio`;
  const avatar = data.avatarUrl ? `<img src="${esc(data.avatarUrl)}" alt="${esc(data.name)}">` : '';
  const headline = data.headline ? `<p class="headline">${esc(data.headline)}</p>` : '';
  const bio = data.bio ? `<p class="bio">${esc(data.bio)}</p>` : '';
  const contact = data.contactEmail ? `<a class="btn" href="mailto:${esc(data.contactEmail)}">Contact me</a>` : '';
  const links = data.links
    .map((l) => `<a class="btn alt" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`)
    .join('');
  const skills = data.skills.length
    ? `<h2>Skills</h2><ul class="chips">${data.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
    : '';
  const projects = data.projects.length
    ? `<h2>Projects</h2><div class="grid">${data.projects.map(projectCard).join('')}</div>`
    : '';
  const ogImage = data.avatarUrl ? `<meta property="og:image" content="${esc(data.avatarUrl)}">` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(data.name)}</title><meta name="description" content="${esc(desc)}"><meta property="og:title" content="${esc(data.name)}"><meta property="og:description" content="${esc(desc)}">${ogImage}<style>${css(t)}</style></head><body><main><header class="top">${avatar}<div><h1>${esc(data.name)}</h1>${headline}</div></header>${bio}<div class="row">${contact}${links}</div>${skills}${projects}</main></body></html>`;
}

/** Turns validated portfolio details into a one-file static site, ready for the normal publish pipeline. */
export function renderPortfolio(template: TemplateId, data: PortfolioData): Bundle {
  const bytes = new TextEncoder().encode(buildHtml(data, THEMES[template]));
  return {
    files: [{ path: 'index.html', data: bytes, contentType: 'text/html; charset=utf-8' }],
    totalBytes: bytes.byteLength,
  };
}