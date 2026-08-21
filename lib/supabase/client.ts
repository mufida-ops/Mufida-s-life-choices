import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Phase 2 seam: null until EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are set
 * (see .env.example). Until then, store/useAppStore.ts and lib/auth/localAuth.ts provide the
 * same app behaviour on local/AsyncStorage persistence, per spec section 34.
 *
 * On web with `expo.web.output: "static"`, routes are also rendered once server-side (Node,
 * no `window`) to produce static HTML. Supabase's client eagerly tries to restore a persisted
 * session on construction, which reads AsyncStorage's web backend (`window.localStorage`) and
 * throws `window is not defined` during that server render. There's no session to restore
 * server-side anyway, so persistence is simply disabled there — the real, storage-backed
 * client is still what every actual browser tab uses.
 */
const isBrowser = typeof window !== 'undefined';

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: isBrowser
          ? {
              storage: AsyncStorage,
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: false,
            }
          : {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;
