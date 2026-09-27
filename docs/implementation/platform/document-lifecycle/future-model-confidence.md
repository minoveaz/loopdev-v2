# Future model confidence scoring

## Decision

Per-field model confidence is intentionally out of scope for the current
Document Intelligence lifecycle and hardening work. The current product keeps
two distinct signals:

- **Model confidence:** the current implementation uses provider confidence
  values when available and falls back to extraction coverage when the
  provider does not return scores.
- **Validated accuracy:** after user confirmation, the system compares the
  original extracted values with the reviewed values. Unchanged extracted
  fields produce 100% validated accuracy; changed fields reduce the
  agreement ratio.

## Future scope

Create a provider contract that returns each field as a value plus a
confidence score, for example:

```json
{
  "documentNumber": {
    "value": "AM476709",
    "confidence": 0.98
  }
}
```

The future implementation must update the Edge Function response schema,
normalization, adapter contracts, persistence, historical migration strategy,
UI labels, thresholds and tests. Provider confidence must remain clearly
distinguished from human-validated accuracy; a model-reported score is not
proof of correctness.

## Non-goals

This follow-up must not change the current lifecycle retention, promotion,
Storage, RLS or tenant-isolation behavior.
