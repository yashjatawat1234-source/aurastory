import { createClient } from '@supabase/supabase-js';

const PROXY_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : (import.meta.env['VITE_SUPABASE_URL'] || '');

export const supabase = createClient(
  PROXY_URL,
  import.meta.env['VITE_SUPABASE_ANON_KEY'],
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);