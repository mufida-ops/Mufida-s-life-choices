import { supabase } from './client';
import type { AuthProvider } from '../auth/localAuth';

/**
 * Real Supabase-backed implementation of the same AuthProvider seam localAuth uses.
 * Only constructed when `supabase` is non-null (see lib/auth/index.ts) — every call
 * below can safely assume it's configured.
 */
export const supabaseAuth: AuthProvider = {
  async signUp(email, password) {
    const client = supabase!;
    const { data, error } = await client.auth.signUp({ email, password });

    if (error) {
      // Already-registered email: fall through to sign-in instead of failing onboarding.
      if (error.message.toLowerCase().includes('already registered')) {
        return supabaseAuth.signIn(email, password);
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Sign up did not return a user.');
    return { userId: data.user.id, email: data.user.email ?? email };
  },

  async signIn(email, password) {
    const client = supabase!;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return { userId: data.user.id, email: data.user.email ?? email };
  },
};
