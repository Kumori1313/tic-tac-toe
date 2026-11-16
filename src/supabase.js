import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Both project paths share an origin in production. Keep this key identical.
export const supabase = url && key ? createClient(url, key, {
  auth: { storageKey: 'game-hub-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
}) : null;
