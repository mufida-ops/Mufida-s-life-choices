/**
 * Local, offline stand-in for Supabase email/password auth (spec section 22). This is the
 * seam: `AuthProvider` interface below matches Supabase's `signUp`/`signInWithPassword` shape
 * closely enough that swapping the implementation for `lib/supabase/auth.ts` in Phase 2 is a
 * one-file change — nothing in app/onboarding or the store needs to know which one is active.
 */

export interface AuthResult {
  userId: string;
  email: string;
}

export interface AuthProvider {
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
}

function assertCredentials(email: string, password: string) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
}

export const localAuth: AuthProvider = {
  async signUp(email, password) {
    assertCredentials(email, password);
    return { userId: 'local-user', email };
  },
  async signIn(email, password) {
    assertCredentials(email, password);
    return { userId: 'local-user', email };
  },
};
