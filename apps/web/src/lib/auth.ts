import { getSupabase } from './supabase';

/** Starts Google login. Returns an error message, or null when the redirect begins. */
export async function signInWithGoogle(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Login is not connected yet.';
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
  return error ? error.message : null;
}