# Document Lifecycle Synchronization Design

Local metadata mutations are queued with an idempotency key and expected
version. A promotion retry first checks the operation/association key, then
reuses an existing permanent object where possible. Conflicts are surfaced
when the version or contact differs; success is not shown until metadata and
permanent storage are both confirmed. Cleanup marks expired rows before
storage deletion, while reconciliation reports missing metadata/object pairs
for retry rather than deleting them blindly.
