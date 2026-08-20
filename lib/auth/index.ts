import { isSupabaseConfigured } from '../supabase/client';
import { supabaseAuth } from '../supabase/auth';
import { localAuth } from './localAuth';
import type { AuthProvider } from './localAuth';

/**
 * The seam described in localAuth.ts, resolved: real Supabase auth once
 * EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are set, local/offline auth
 * otherwise (spec section 34 — mock persistence when credentials aren't available yet).
 */
export const authProvider: AuthProvider = isSupabaseConfigured ? supabaseAuth : localAuth;
