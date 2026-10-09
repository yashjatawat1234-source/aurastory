import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yhbhgvrwuhxtebvqxggi.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env['VITE_SUPABASE_ANON_KEY'] || import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || '';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);