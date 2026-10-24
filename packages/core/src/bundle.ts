import { unzipSync, type UnzipFileInfo } from 'fflate';
import { LIMITS, type Limits } from './limits';
import { contentTypeFor, extensionOf } from './mime';

export type BundleErrorCode =
  | 'ZIP_TOO_LARGE'
  | 'ZIP_INVALID'
  | 'TOO_MANY_FILES'
  | 'UNPACKED_TOO_LARGE'
  | 'FILE_TOO_LARGE'
  | 'UNSAFE_PATH'
  | 'FORBIDDEN_FILE_TYPE'
  | 'DUPLICATE_PATH'
  | 'MISSING_INDEX';

/** Safe to show to the user: messages never contain internals. */
export class BundleError extends Error {
  readonly code: BundleErrorCode;
  constructor(code: BundleErrorCode, message: string) {
    super(message);
    this.name = 'BundleError';
    this.code = code;
  }
}

export interface BundleFile {
  path: string;
  data: Uint8Array;
  contentType: string;
}

export interface Bundle {
  files: BundleFile[];
  totalBytes: number;
}

const show = (s: string): string => JSON.stringify(s.slice(0, 80));

function assertSafePath(name: string, limits: Limits): void {
  const bad =
    name.length > limits.maxPathLength ||
    name.includes('\0') ||
    name.includes('\\') ||
    name.startsWith('/') ||
    /^[a-zA-Z]:/.test(name);
  if (bad) throw new BundleError('UNSAFE_PATH', `Unsafe file path: ${show(name)}`);
  for (const seg of name.split('/')) {
    if (seg === '' || seg === '.' || seg === '..') {
      throw new BundleError('UNSAFE_PATH', `Unsafe file path: ${show(name)}`);
    }
  }
}

/** Junk we silently drop instead of failing the whole upload (and never publish: .env, .git). */
function isIgnored(name: string): boolean {
  const segs = name.split('/');
  const last = segs[segs.length - 1];
  return (
    segs.some((s) => s.startsWith('.') || s === 'node_modules' || s === '__MACOSX') ||
    last === 'Thumbs.db'
  );
}

/** If everything sits inside one wrapper folder (zip of a folder), return "folder/". */
function commonRoot(paths: string[]): string {
  const first = paths[0];
  if (!first) return '';
  const i = first.indexOf('/');
  if (i === -1) return '';
  const root = first.slice(0, i + 1);
  return paths.every((p) => p.startsWith(root)) ? root : '';
}

/**
 * Validate and unpack a portfolio zip. Pure and synchronous: no I/O, easy to test.
 *
 * Safety model:
 *  - every entry name is checked BEFORE its data is inflated (fflate `filter`);
 *  - declared sizes are capped, and fflate allocates only the declared size,
 *    so a lying header cannot make us allocate more than the caps allow;
 *  - real sizes are re-checked after inflation.
 */
export function extractBundle(zip: Uint8Array, limits: Limits = LIMITS): Bundle {
  if (zip.byteLength > limits.maxZipBytes) {
    throw new BundleError('ZIP_TOO_LARGE', 'The zip is too large.');
  }

  let declaredTotal = 0;
  let count = 0;
  const seen = new Set<string>();

  let raw: Record<string, Uint8Array>;
  try {
    raw = unzipSync(zip, {
      filter(file: UnzipFileInfo): boolean {
        const name = file.name;
        if (name.endsWith('/')) return false; // directory entry
        assertSafePath(name, limits);
        if (isIgnored(name)) return false;

        if (!contentTypeFor(name)) {
          const ext = extensionOf(name);
          throw new BundleError(
            'FORBIDDEN_FILE_TYPE',
            `File type not allowed: ${show(name)}${ext ? ` (.${ext})` : ''}`,
          );
        }
        if (file.originalSize > limits.maxFileBytes) {
          throw new BundleError('FILE_TOO_LARGE', `File too large: ${show(name)}`);
        }
        declaredTotal += file.originalSize;
        if (declaredTotal > limits.maxUnpackedBytes) {
          throw new BundleError('UNPACKED_TOO_LARGE', 'The site is too large once unzipped.');
        }
        if (++count > limits.maxFiles) {
          throw new BundleError('TOO_MANY_FILES', 'Too many files in the zip.');
        }
        const key = name.toLowerCase();
        if (seen.has(key)) {
          throw new BundleError('DUPLICATE_PATH', `Duplicate file path: ${show(name)}`);
        }
        seen.add(key);
        return true;
      },
    });
  } catch (err) {
    if (err instanceof BundleError) throw err;
    throw new BundleError('ZIP_INVALID', 'That file is not a valid zip archive.');
  }

  const entries = Object.entries(raw);
  let totalBytes = 0;
  for (const [name, data] of entries) {
    if (data.byteLength > limits.maxFileBytes) {
      throw new BundleError('FILE_TOO_LARGE', `File too large: ${show(name)}`);
    }
    totalBytes += data.byteLength;
    if (totalBytes > limits.maxUnpackedBytes) {
      throw new BundleError('UNPACKED_TOO_LARGE', 'The site is too large once unzipped.');
    }
  }

  const root = commonRoot(entries.map(([name]) => name));
  const files: BundleFile[] = entries.map(([name, data]) => {
    const path = name.slice(root.length);
    return { path, data, contentType: contentTypeFor(path) ?? 'application/octet-stream' };
  });

  if (!files.some((f) => f.path === 'index.html')) {
    throw new BundleError('MISSING_INDEX', 'Your zip needs an index.html at its top level.');
  }
  return { files, totalBytes };
}
