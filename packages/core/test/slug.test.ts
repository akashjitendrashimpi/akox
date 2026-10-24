import { describe, expect, it } from 'vitest';
import { checkSlug, slugFromHost } from '../src/index';

describe('checkSlug', () => {
  it('accepts normal names', () => {
    for (const s of ['akash', 'a1b', 'my-portfolio', 'x'.repeat(32)]) expect(checkSlug(s)).toBeNull();
  });
  it('rejects bad formats', () => {
    for (const s of ['', 'a', 'ab', 'Akash', '-ab', 'ab-', 'a--b', 'xn--abc', 'a_b', 'a.b', 'x'.repeat(33)]) {
      expect(checkSlug(s)).toBe('FORMAT');
    }
  });
  it('rejects reserved names', () => {
    expect(checkSlug('admin')).toBe('RESERVED');
    expect(checkSlug('www')).toBe('RESERVED');
  });
});

describe('slugFromHost', () => {
  it('extracts the slug', () => {
    expect(slugFromHost('akash.akox.in', 'akox.in')).toBe('akash');
    expect(slugFromHost('AKASH.akox.in', 'akox.in')).toBe('akash');
  });
  it('rejects everything else', () => {
    expect(slugFromHost('akox.in', 'akox.in')).toBeNull();
    expect(slugFromHost('a.b.akox.in', 'akox.in')).toBeNull();
    expect(slugFromHost('akash.evil.com', 'akox.in')).toBeNull();
    expect(slugFromHost('akash.notakox.in', 'akox.in')).toBeNull();
    expect(slugFromHost('www.akox.in', 'akox.in')).toBeNull();
  });
});
