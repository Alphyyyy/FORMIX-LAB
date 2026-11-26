import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudMode =
  Boolean(url && anonKey) &&
  import.meta.env.MODE !== 'test' &&
  import.meta.env.VITE_FORCE_LOCAL !== '1';

export const supabase =
  isCloudMode && url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;
