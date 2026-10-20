import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[VAS] Supabase environment variables are not set. ' +
      'Authentication will be unavailable. ' +
      'Copy .env.example to .env and fill in your Supabase project credentials.',
  );
}

/**
 * Supabase client instance.
 *
 * The anon key is safe to expose in the browser — all access control is enforced
 * server-side via Row Level Security policies on the database.
 */
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
);

/** True when Supabase credentials have been configured via environment variables. */
export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'your_supabase_project_url_here';
