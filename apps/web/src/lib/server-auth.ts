import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

/** Server only. Uses the secret key, which must never start with NEXT_PUBLIC. */
export function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function userFrom(req: Request, sb: SupabaseClient): Promise<User | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer /i, '');
  if (!token) return null;
  const { data } = await sb.auth.getUser(token);
  return data.user;
}