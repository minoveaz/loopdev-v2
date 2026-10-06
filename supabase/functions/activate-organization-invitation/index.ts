/// <reference lib="deno.ns" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { token, password } = await request.json();
    if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return json({ error: 'A valid token and password of at least 8 characters are required.' }, 400);
    }
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const tokenHash = await sha256(token);
    const { data: invitation } = await admin.from('organization_invitation_tokens')
      .select('id, organization_id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash).is('used_at', null).gt('expires_at', new Date().toISOString()).maybeSingle();
    if (!invitation) return json({ error: 'This activation token is invalid, expired, or already used.' }, 400);

    const { error: userError } = await admin.auth.admin.updateUserById(invitation.user_id, { password });
    if (userError) return json({ error: userError.message }, 400);
    const { error: membershipError } = await admin.from('organization_memberships')
      .update({ status: 'active' }).eq('organization_id', invitation.organization_id).eq('user_id', invitation.user_id);
    if (membershipError) return json({ error: membershipError.message }, 400);
    const { error: consumeError } = await admin.from('organization_invitation_tokens')
      .update({ used_at: new Date().toISOString() }).eq('id', invitation.id).is('used_at', null);
    if (consumeError) return json({ error: consumeError.message }, 400);
    return json({ success: true });
  } catch (error) {
    console.error('activate-organization-invitation failed', error);
    return json({ error: 'Unable to activate the invitation.' }, 500);
  }
});

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
