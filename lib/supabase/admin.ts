import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client. Server-only. Bypasses RLS. Use sparingly — only for
// admin_access_log inserts and other privileged ops where RLS is the wrong
// lever (e.g. audit writes that must succeed even if the policy rejects them).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
