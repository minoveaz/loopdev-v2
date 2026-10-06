# Document lifecycle operations

## Worker

`supabase/functions/document-intelligence-worker` runs cleanup and promotion
reconciliation with the Supabase service role. It must never be exposed to
browser clients. Configure `DOCUMENT_INTELLIGENCE_WORKER_SECRET` as a secret
and invoke the function from Supabase Cron or an external scheduler.

Recommended cadence:

- cleanup: hourly;
- promotion reconciliation: hourly with the same worker;
- backup restore drill: quarterly.

The scheduler must send `x-document-worker-secret`. Rotate the secret and
disable the schedule if repeated failures are detected.

## Production gates

- Keep both Storage buckets private.
- Verify anonymous and cross-tenant reads return `401`/`403`.
- Keep service-role credentials exclusively in Edge Functions or the scheduler.
- Record worker output in the monitoring system.
- Configure Supabase backups and perform a restore drill before enabling
  identity-document uploads for all employees.

## Open company decisions

The engineering implementation cannot decide legal basis, consent wording,
DPA, legal hold policy, permitted download roles, or incident response
ownership. These require approval from the company privacy/security owner.
