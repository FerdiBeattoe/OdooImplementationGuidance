import supabase from './supabase-client.js';

export async function validateInviteCode(code) {
  if (!code) {
    return { valid: false, error: 'Invalid invite code' };
  }

  const normalized = code.toUpperCase().trim();

  if (!supabase) {
    // Dev mode — accept any code starting with BETA-
    if (normalized.startsWith('BETA-')) {
      return { valid: true, plan: 'free_forever' };
    }
    return { valid: false, error: 'Invalid invite code' };
  }

  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', normalized)
    .eq('used', false)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or already used invite code' };
  }

  return { valid: true, plan: data.plan, id: data.id };
}

export async function consumeInviteCode(code, email) {
  if (!supabase) return { ok: true };

  const { error } = await supabase
    .from('invite_codes')
    .update({
      used: true,
      used_by_email: email,
      used_at: new Date().toISOString(),
    })
    .eq('code', code.toUpperCase().trim());

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
