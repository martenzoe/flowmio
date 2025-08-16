// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Optional: Wenn du generierte DB-Typen hast, kannst du sie hier importieren und unten als Generic übergeben.
// import type { Database } from '../types/supabase'; // Beispiel

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Dev-Hinweis: hilft beim lokalen Setup
  // (bricht den Build nicht ab, aber macht das Problem sichtbar)
  console.warn(
    '[Flowmio] VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlt. ' +
    'Bitte in .env(.local) setzen.'
  );
}

export const supabase =
  // createClient<Database>(...) // falls du Typen nutzt
  createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

/**
 * Einheitliche Redirect-URL für OAuth/Magic-Link/SignUp-Emails.
 * Nutzung: options: { redirectTo: authRedirect('/app') }
 */
export function authRedirect(next = '/app') {
  const base = window.location.origin;
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}
