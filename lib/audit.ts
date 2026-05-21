import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type AdminAction =
  | 'view_dashboard'
  | 'list_patients'
  | 'view_patient'
  | 'view_compliance'
  | 'view_patient_audit'
  | 'view_global_audit';

export async function logAdminAccess(
  action: AdminAction,
  patientId?: string | null,
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  const supabase = await createClient();
  // getClaims() decodes + verifies the JWT locally — no auth-server round-trip
  // on the hot path. Middleware has already gated /admin, so this is safe.
  const { data: claimsData } = await supabase.auth.getClaims();
  const adminUserId = claimsData?.claims?.sub;

  // Middleware guarantees a user, but bail safely just in case (e.g. someone
  // hits a page outside the matcher, or auth state expires mid-render).
  if (!adminUserId) return;

  const admin = createAdminClient();
  const { error } = await admin.from('admin_access_log').insert({
    admin_user_id: adminUserId,
    patient_id: patientId ?? null,
    action,
    metadata: metadata ?? null,
  });

  if (error) {
    // Don't throw — audit failures shouldn't break the user's view. But do
    // log so we notice if the service-role key is misconfigured.
    console.error('[audit] failed to record admin access', { action, error });
  }
}
