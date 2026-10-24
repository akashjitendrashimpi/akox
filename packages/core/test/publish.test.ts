import { describe, expect, it } from 'vitest';
import { uploadBundle, type Bundle, type ObjectStore } from '../src/index';

const bundle = (n: number): Bundle => ({
  files: Array.from({ length: n }, (_, i) => ({
    path: i === 0 ? 'index.html' : `f${i}.js`,
    data: new Uint8Array(1),
    contentType: 'text/plain',
  })),
  totalBytes: n,
});

function memoryStore(failOnKey?: string) {
  const objects = new Map<string, string>();
  const store: ObjectStore = {
    async put(key, _body, contentType) {
      await Promise.resolve();
      if (key === failOnKey) throw new Error('boom');
      objects.set(key, contentType);
    },
    async deletePrefix(prefix) {
      for (const k of [...objects.keys()]) if (k.startsWith(prefix)) objects.delete(k);
    },
  };
  return { store, objects };
}

describe('uploadBundle', () => {
  it('writes every file under the prefix', async () => {
    const { store, objects } = memoryStore();
    await uploadBundle(bundle(30), 'sites/s/v1/', store, 4);
    expect(objects.size).toBe(30);
    expect(objects.has('sites/s/v1/index.html')).toBe(true);
  });

  it('cleans up the prefix when any upload fails', async () => {
    const { store, objects } = memoryStore('sites/s/v1/f7.js');
    await expect(uploadBundle(bundle(30), 'sites/s/v1/', store, 4)).rejects.toThrow('boom');
    expect(objects.size).toBe(0);
  });
});
