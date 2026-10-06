import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const expectedSecret = Deno.env.get('DOCUMENT_INTELLIGENCE_WORKER_SECRET');

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

if (!expectedSecret) {
  throw new Error('DOCUMENT_INTELLIGENCE_WORKER_SECRET is not configured.');
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(async (request) => {
  if (request.headers.get('x-document-worker-secret') !== expectedSecret) {
    return json({ error: 'forbidden' }, 403);
  }
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const now = new Date().toISOString();
  const cleanup = await supabase.rpc('document_intelligence_cleanup_expired', { p_now: now });
  if (cleanup.error) {
    await supabase.from('document_intelligence_worker_runs').insert({
      worker_name: 'document-intelligence-worker',
      status: 'failed',
      error_message: cleanup.error.message,
    });
    return json({ error: cleanup.error.message }, 500);
  }

  const reconciliation = await supabase.rpc('document_intelligence_reconcile_promotions');
  if (reconciliation.error) {
    await supabase.from('document_intelligence_worker_runs').insert({
      worker_name: 'document-intelligence-worker',
      status: 'failed',
      expired_documents: cleanup.data ?? 0,
      error_message: reconciliation.error.message,
    });
    return json({ error: reconciliation.error.message }, 500);
  }

  await supabase.from('document_intelligence_worker_runs').insert({
    worker_name: 'document-intelligence-worker',
    status: 'completed',
    expired_documents: cleanup.data ?? 0,
    promotion_issues: reconciliation.data?.length ?? 0,
  });

  return json({
    ok: true,
    executedAt: now,
    expiredDocuments: cleanup.data ?? 0,
    promotionIssues: reconciliation.data?.length ?? 0,
  });
});
