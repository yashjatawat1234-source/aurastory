import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || 'https://yhbhgvrwuhxtebvqxggi.supabase.co';
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || 'sb_publishable_dp13p3Ln8L_aVxzu_-LMzQ_ekqjeuKS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);