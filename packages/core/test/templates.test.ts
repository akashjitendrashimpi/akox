import { describe, expect, it } from 'vitest';
import { TEMPLATE_IDS, parsePortfolioRequest, renderPortfolio, type Bundle } from '../src/index';

const valid = {
  template: 'clean',
  data: {
    name: 'Akash', headline: 'Student developer', bio: 'I build things.\nSecond line.',
    contactEmail: 'a@b.co', skills: ['React', 'Design'],
    links: [{ label: 'GitHub', url: 'https://github.com/x' }],
    projects: [{ title: 'AKOX', description: 'Portfolio platform', url: 'https://akox.in', imageUrl: 'https://example.com/a.png' }],
  },
};

const htmlOf = (b: Bundle): string => new TextDecoder().decode(b.files[0]?.data);
const withData = (patch: object) => ({ ...valid, data: { ...valid.data, ...patch } });
const errorOf = (input: unknown): string => {
  const r = parsePortfolioRequest(input);
  return r.ok ? '' : r.error;
};

describe('parsePortfolioRequest', () => {
  it('accepts a valid request', () => {
    expect(parsePortfolioRequest(valid).ok).toBe(true);
  });
  it('requires a name and a known template', () => {
    expect(errorOf(withData({ name: '  ' }))).toContain('Name is required');
    expect(errorOf({ ...valid, template: 'nope' })).toContain('Choose a template');
    expect(errorOf('hello')).toContain('Invalid request');
  });
  it('rejects dangerous or non-https links', () => {
    expect(errorOf(withData({ links: [{ label: 'x', url: 'javascript:alert(1)' }] }))).toContain('must start with');
    expect(errorOf(withData({ avatarUrl: 'http://example.com/a.png' }))).toContain('https://');
    expect(errorOf(withData({ contactEmail: 'not an email' }))).toContain('Email');
  });
  it('enforces limits', () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ title: `P${i}`, description: '' }));
    expect(errorOf(withData({ projects: many }))).toContain('at most 12');
    expect(errorOf(withData({ bio: 'x'.repeat(1001) }))).toContain('too long');
  });
});

describe('renderPortfolio', () => {
  it('escapes HTML in user text', () => {
    const r = parsePortfolioRequest(withData({ name: '<script>alert(1)</script>', bio: '"quoted" & <b>' }));
    if (!r.ok) throw new Error(r.error);
    const html = htmlOf(renderPortfolio(r.template, r.data));
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;quoted&quot; &amp; &lt;b&gt;');
  });
  it('renders every template as one index.html with the content', () => {
    const r = parsePortfolioRequest(valid);
    if (!r.ok) throw new Error(r.error);
    for (const id of TEMPLATE_IDS) {
      const bundle = renderPortfolio(id, r.data);
      expect(bundle.files).toHaveLength(1);
      expect(bundle.files[0]?.path).toBe('index.html');
      const html = htmlOf(bundle);
      for (const needle of ['Akash', 'Student developer', 'React', 'AKOX', 'GitHub', 'mailto:a@b.co']) {
        expect(html).toContain(needle);
      }
    }
  });
});