import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('YOUR_SUPABASE')
);

if (!isSupabaseConfigured) {
  console.info('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY environment variables not detected or set to defaults. Hybrid fallback mode active.');
}

// Instantiate Supabase client with PKCE Auth Flow enabled
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'buildops_supabase_auth'
    }
  }
);
