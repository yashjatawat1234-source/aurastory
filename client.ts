import { createClient } from '@supabase/supabase-js';

// Clean fallback to 'any' without referencing non-existent namespace members
type DatabaseType = any;

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] || 'https://yhbhgvrwuhxtebvqxggi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
  import.meta.env['VITE_SUPABASE_ANON_KEY'] ||
  '';

export const supabase = createClient<DatabaseType>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);