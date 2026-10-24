import type { Bundle } from './bundle';

/**
 * The only seam between AKOX and object storage. R2 today; S3, GCS or disk
 * tomorrow, by implementing these two methods. Nothing else changes.
 */
export interface ObjectStore {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;
}

/**
 * Upload every file of a bundle under `prefix` with bounded concurrency.
 * On any failure the half-written prefix is deleted, so a broken deploy
 * never becomes visible. (Visibility only changes when the caller flips the
 * site's pointer after this resolves.)
 */
export async function uploadBundle(
  bundle: Bundle,
  prefix: string,
  store: ObjectStore,
  concurrency = 12,
): Promise<void> {
  const files = bundle.files;
  let next = 0;
  let failed = false;

  const worker = async (): Promise<void> => {
    while (!failed) {
      const file = files[next++];
      if (!file) return;
      try {
        await store.put(prefix + file.path, file.data, file.contentType);
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  };

  try {
    const n = Math.max(1, Math.min(concurrency, files.length));
    await Promise.all(Array.from({ length: n }, worker));
  } catch (err) {
    await store.deletePrefix(prefix).catch(() => undefined);
    throw err;
  }
}
