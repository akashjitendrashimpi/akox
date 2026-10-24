export interface Limits {
  /** Max size of the uploaded .zip itself. */
  maxZipBytes: number;
  /** Max total size after unzipping (zip-bomb guard). */
  maxUnpackedBytes: number;
  /** Max size of any single file (3D models and videos are the big ones). */
  maxFileBytes: number;
  maxFiles: number;
  maxPathLength: number;
}

const MB = 1024 * 1024;

/** Free-tier limits. Raise per plan later by passing a different Limits object. */
export const LIMITS: Limits = {
  maxZipBytes: 50 * MB,
  maxUnpackedBytes: 150 * MB,
  maxFileBytes: 30 * MB,
  maxFiles: 3000,
  maxPathLength: 180,
};
