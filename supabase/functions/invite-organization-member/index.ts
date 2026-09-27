/// <reference lib="deno.ns" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const allowedRoles = new Set(['admin', 'agent', 'viewer']);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required.' }, 401);
    const body = await request.json();
    const organizationId = String(body.organizationId || '');
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || '');
    if (!organizationId || !name || !email.includes('@') || !allowedRoles.has(role)) {
      return json({ error: 'Organization, name, email, and a valid role are required.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const token = authorization.replace('Bearer ', '');
    const { data: actor, error: actorError } = await admin.auth.getUser(token);
    if (actorError || !actor.user) return json({ error: 'Authentication required.' }, 401);

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', actor.user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (!membership) return json({ error: 'You do not have permission to invite members.' }, 403);
    const { data: permission } = await admin
      .from('role_permissions')
      .select('permission_key')
      .eq('role', membership.role)
      .eq('permission_key', 'members.manage')
      .maybeSingle();
    if (!permission) return json({ error: 'You do not have permission to invite members.' }, 403);

    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name },
    });
    if (inviteError || !invitation.user) return json({ error: inviteError?.message || 'Invitation failed.' }, 400);

    const { data: membership, error: membershipError } = await admin
      .from('organization_memberships')
      .upsert({
        organization_id: organizationId,
        user_id: invitation.user.id,
        role,
        status: 'pending',
        invited_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,user_id' })
      .select('user_id, organization_id, role, status, created_at, invited_at, last_active_at')
      .single();
    if (membershipError) return json({ error: membershipError.message }, 400);
    return json({
      user: {
        ...membership,
        full_name: name,
        email,
      },
    }, 200);
  } catch (error) {
    console.error('invite-organization-member failed', error);
    return json({ error: 'Unable to create the invitation.' }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
