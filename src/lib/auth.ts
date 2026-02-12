import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

interface AuthResult {
  userId: string;
  supabase: SupabaseClient;
  isAnonymous: boolean;
}

export async function getAuthenticatedUser(): Promise<AuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars not set');
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try { cookieStore.set(name, value, options); } catch { /* read-only in Server Components */ }
        });
      },
    },
  });

  // Auth bypass: when DISABLE_AUTH=true, skip authentication
  if (process.env.DISABLE_AUTH === 'true') {
    return { userId: ANONYMOUS_USER_ID, supabase, isAnonymous: true };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { userId: user.id, supabase, isAnonymous: false };
}
