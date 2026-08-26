import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sanity check to prevent app-wide crashes if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'CRITICAL: Supabase environment variables are missing! ' +
    'Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Fallback to placeholder strings to prevent createClient initialization crash
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  }
);

// Attach to window AFTER initialization so DevTools console testing works
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}