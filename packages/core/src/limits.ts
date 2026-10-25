export interface Limits {
  /** Max size of the uploaded .zip itself. */
  maxZipBytes: number;
  /** Max total size after unzipping (zip-bomb guard). */
  maxUnpackedBytes: number;
  /** Max size of any single file. */
  maxFileBytes: number;
  maxFiles: number;
  maxPathLength: number;
  /** File extensions (lowercase, no dot) refused on this plan. */
  blockedExtensions?: readonly string[];
}

const MB = 1024 * 1024;

/** Hard ceiling used by tests and as a default. Real users get a plan limit below. */
export const LIMITS: Limits = {
  maxZipBytes: 50 * MB,
  maxUnpackedBytes: 150 * MB,
  maxFileBytes: 30 * MB,
  maxFiles: 3000,
  maxPathLength: 180,
};

export type PlanId = 'free' | 'plus' | 'pro';

/** One place to change plan limits. Each site keeps 2 versions, so storage per user is at most 2x maxUnpackedBytes. */
export const PLAN_LIMITS: Readonly<Record<PlanId, Limits>> = {
  free: { maxZipBytes: 15 * MB, maxUnpackedBytes: 15 * MB, maxFileBytes: 5 * MB, maxFiles: 100, maxPathLength: 180, blockedExtensions: ['mp4', 'webm'] },
  plus: { maxZipBytes: 50 * MB, maxUnpackedBytes: 50 * MB, maxFileBytes: 10 * MB, maxFiles: 300, maxPathLength: 180 },
  pro: { maxZipBytes: 200 * MB, maxUnpackedBytes: 200 * MB, maxFileBytes: 25 * MB, maxFiles: 1000, maxPathLength: 180 },
};

export function limitsFor(plan: string | null | undefined): Limits {
  return plan === 'plus' || plan === 'pro' ? PLAN_LIMITS[plan] : PLAN_LIMITS.free;
}