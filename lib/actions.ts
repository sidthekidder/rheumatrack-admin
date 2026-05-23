'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type DiaryEntryInput = {
  entry_date: string; // YYYY-MM-DD
  pain: number; // 0-10
  stiffness_min: number; // 0-120, step 5
  fatigue: number; // 0-10
  joints: string[];
  notes: string;
};

export async function createDiaryEntry(
  patientId: string,
  data: DiaryEntryInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Verify caller is signed in.
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const adminUserId = claimsData?.claims?.sub;
  if (!adminUserId) return { ok: false, error: 'Not authenticated' };

  // Verify caller is in admin_users (defence-in-depth — middleware already
  // gates the page, but server actions are reachable from any client).
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', adminUserId)
    .maybeSingle();
  if (!adminRow) return { ok: false, error: 'Not an admin' };

  // Light validation. Mobile app rejects out-of-range inputs already; this is
  // just a guard for the case where someone POSTs the action manually.
  if (data.pain < 0 || data.pain > 10) return { ok: false, error: 'pain out of range' };
  if (data.fatigue < 0 || data.fatigue > 10) return { ok: false, error: 'fatigue out of range' };
  if (data.stiffness_min < 0 || data.stiffness_min > 600) {
    return { ok: false, error: 'stiffness out of range' };
  }

  const admin = createAdminClient();

  const { error: insertErr } = await admin.from('flare_entries').insert({
    patient_id: patientId,
    entry_date: data.entry_date,
    pain: data.pain,
    stiffness_min: data.stiffness_min,
    fatigue: data.fatigue,
    joints: data.joints,
    notes: data.notes || null,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  await admin.from('admin_access_log').insert({
    admin_user_id: adminUserId,
    patient_id: patientId,
    action: 'create_diary_entry',
    metadata: {
      entry_date: data.entry_date,
      pain: data.pain,
      stiffness_min: data.stiffness_min,
      fatigue: data.fatigue,
      joint_count: data.joints.length,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}
