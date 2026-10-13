import { createClient } from '@supabase/supabase-js';

const PROXY_URL = 'https://supabase-proxy.yashjatawat1234.workers.dev';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbGl0b2p1ZnBpbXZja2ZnZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk0MDUsImV4cCI6MjEwNzQ2NTQwNX0.qrzp6pUHZYDCli42VSk5kl48JJndiExMIgwx9bvoPMo';

export const supabase = createClient(
  PROXY_URL,
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