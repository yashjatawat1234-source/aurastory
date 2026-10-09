import { createClient } from '@supabase/supabase-js';

const SUPABASE_DIRECT_URL = import.meta.env['VITE_SUPABASE_URL'] || 'https://yhbhgvrwuhxtebvqxggi.supabase.co';

// On Vercel production, proxy requests through the same origin to avoid Cloudflare/DNS blocks
const PROXY_URL = typeof window !== 'undefined'
  ? window.location.origin
  : SUPABASE_DIRECT_URL;

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