import type { ObjectStore } from '@akox/core';
import type { SupabaseClient } from '@supabase/supabase-js';

export function supabaseStore(sb: SupabaseClient): ObjectStore {
  const bucket = sb.storage.from('sites');

  async function listAll(prefix: string): Promise<string[]> {
    const out: string[] = [];
    const { data } = await bucket.list(prefix.replace(/\/$/, ''), { limit: 1000 });
    for (const item of data ?? []) {
      const path = `${prefix}${item.name}`;
      if (item.id === null) out.push(...(await listAll(path + '/')));
      else out.push(path);
    }
    return out;
  }

  return {
    async put(key, body, contentType) {
      const { error } = await bucket.upload(key, body, { contentType, upsert: false });
      if (error) throw new Error(error.message);
    },
    async deletePrefix(prefix) {
      const files = await listAll(prefix);
      for (let i = 0; i < files.length; i += 100) await bucket.remove(files.slice(i, i + 100));
    },
  };
}