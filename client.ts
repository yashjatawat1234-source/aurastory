import { createClient } from '@supabase/supabase-js';

const PROXY_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://yhbhgvrwuhxtebvqxggi.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
  import.meta.env['VITE_SUPABASE_ANON_KEY'] ||
  '';

export const supabase = createClient(PROXY_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});