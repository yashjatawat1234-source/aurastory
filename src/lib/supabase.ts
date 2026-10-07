import { createClient } from '@supabase/supabase-js';

// Uses your app's origin URL (e.g., https://aurastory-beta.vercel.app or http://localhost:5173)
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