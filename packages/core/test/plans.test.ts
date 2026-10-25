import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { BundleError, PLAN_LIMITS, extractBundle, limitsFor } from '../src/index';

const html = strToU8('<h1>hi</h1>');
const codeOf = (fn: () => unknown): string | undefined => {
  try { fn(); } catch (e) { return (e as BundleError).code; }
  return undefined;
};

describe('plan limits', () => {
  it('maps plan names and falls back to free', () => {
    expect(limitsFor('pro')).toBe(PLAN_LIMITS.pro);
    expect(limitsFor('nonsense')).toBe(PLAN_LIMITS.free);
    expect(limitsFor(null)).toBe(PLAN_LIMITS.free);
  });
  it('free plan blocks video files, pro allows them', () => {
    const z = zipSync({ 'index.html': html, 'clip.mp4': new Uint8Array(10) });
    expect(codeOf(() => extractBundle(z, PLAN_LIMITS.free))).toBe('FORBIDDEN_FILE_TYPE');
    expect(codeOf(() => extractBundle(z, PLAN_LIMITS.pro))).toBeUndefined();
  });
  it('free plan enforces the per-file limit', () => {
    const z = zipSync({ 'index.html': html, 'big.png': new Uint8Array(6 * 1024 * 1024) });
    expect(codeOf(() => extractBundle(z, PLAN_LIMITS.free))).toBe('FILE_TOO_LARGE');
  });
});