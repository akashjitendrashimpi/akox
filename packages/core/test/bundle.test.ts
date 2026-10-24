import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { BundleError, LIMITS, extractBundle } from '../src/index';

const zip = (files: Record<string, string | Uint8Array>): Uint8Array =>
  zipSync(
    Object.fromEntries(
      Object.entries(files).map(([k, v]) => [k, typeof v === 'string' ? strToU8(v) : v]),
    ),
  );

const codeOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof BundleError ? e.code : `non-BundleError: ${String(e)}`;
  }
  return undefined;
};

describe('extractBundle', () => {
  it('accepts a minimal site and sets content types', () => {
    const b = extractBundle(zip({ 'index.html': '<h1>hi</h1>', 'css/a.css': 'a{}', 'm.glb': new Uint8Array(4) }));
    expect(b.files.map((f) => f.path).sort()).toEqual(['css/a.css', 'index.html', 'm.glb']);
    expect(b.files.find((f) => f.path === 'm.glb')?.contentType).toBe('model/gltf-binary');
    expect(b.totalBytes).toBeGreaterThan(0);
  });

  it('strips a single wrapper folder', () => {
    const b = extractBundle(zip({ 'my-site/index.html': 'x', 'my-site/js/app.js': 'y' }));
    expect(b.files.map((f) => f.path).sort()).toEqual(['index.html', 'js/app.js']);
  });

  it('requires index.html', () => {
    expect(codeOf(() => extractBundle(zip({ 'about.html': 'x' })))).toBe('MISSING_INDEX');
    expect(codeOf(() => extractBundle(zip({})))).toBe('MISSING_INDEX');
  });

  it('rejects path traversal and absolute paths', () => {
    expect(codeOf(() => extractBundle(zip({ 'index.html': 'x', '../evil.html': 'x' })))).toBe('UNSAFE_PATH');
    expect(codeOf(() => extractBundle(zip({ 'index.html': 'x', 'a/../../b.html': 'x' })))).toBe('UNSAFE_PATH');
    expect(codeOf(() => extractBundle(zip({ 'index.html': 'x', '/etc/x.html': 'x' })))).toBe('UNSAFE_PATH');
    expect(codeOf(() => extractBundle(zip({ 'index.html': 'x', 'C:/x.html': 'x' })))).toBe('UNSAFE_PATH');
    expect(codeOf(() => extractBundle(zip({ 'index.html': 'x', 'a\\b.html': 'x' })))).toBe('UNSAFE_PATH');
  });

  it('rejects traversal even inside otherwise-ignored dot folders', () => {
    expect(codeOf(() => extractBundle(zip({ 'index.html': 'x', '.git/../../x.html': 'x' })))).toBe('UNSAFE_PATH');
  });

  it('rejects server-side and executable file types', () => {
    for (const name of ['shell.php', 'run.exe', 'x.sh', 'noext', 'a.py']) {
      expect(codeOf(() => extractBundle(zip({ 'index.html': 'x', [name]: 'x' })))).toBe('FORBIDDEN_FILE_TYPE');
    }
  });

  it('silently drops dotfiles, node_modules and macOS junk (never publishes .env/.git)', () => {
    const b = extractBundle(
      zip({
        'index.html': 'x',
        '.env': 'SECRET=1',
        '.git/config': 'x',
        'node_modules/pkg/index.js': 'x',
        '__MACOSX/._index.html': 'x',
        '.DS_Store': 'x',
        'img/.hidden.png': 'x',
      }),
    );
    expect(b.files.map((f) => f.path)).toEqual(['index.html']);
  });

  it('rejects case-insensitive duplicates', () => {
    expect(codeOf(() => extractBundle(zip({ 'index.html': 'x', 'A.html': 'x', 'a.html': 'y' })))).toBe('DUPLICATE_PATH');
  });

  it('enforces limits', () => {
    const z = zip({ 'index.html': 'x', 'a.js': 'aaaaaaaaaa', 'b.js': 'bbbbbbbbbb' });
    expect(codeOf(() => extractBundle(z, { ...LIMITS, maxFiles: 2 }))).toBe('TOO_MANY_FILES');
    expect(codeOf(() => extractBundle(z, { ...LIMITS, maxFileBytes: 5 }))).toBe('FILE_TOO_LARGE');
    expect(codeOf(() => extractBundle(z, { ...LIMITS, maxUnpackedBytes: 15 }))).toBe('UNPACKED_TOO_LARGE');
    expect(codeOf(() => extractBundle(z, { ...LIMITS, maxZipBytes: 10 }))).toBe('ZIP_TOO_LARGE');
  });

  it('reports garbage as ZIP_INVALID', () => {
    expect(codeOf(() => extractBundle(strToU8('definitely not a zip file at all')))).toBe('ZIP_INVALID');
  });
});
