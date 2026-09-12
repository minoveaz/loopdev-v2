---
title: CRM Lead Contract
status: approved
version: 1.2
created: 2026-08-13
updated: 2026-09-10
owner: crm
program_track: tracks/active/crm/2026-08-13-crm-pilot-execution.md
issue: https://github.com/minoveaz/loopdev/issues/84
---

# Contrato de Lead

## Proposito

Define el contrato compartido para listar, buscar, crear/capturar, editar, cualificar y convertir
leads en oportunidades sin duplicar contactos.

## Modelo de lectura

```ts
type Lead = {
  id: string;
  organizationId: string;
  workspaceId: string | null;
  brandId: string | null;
  contactId: string;
  status: 'nuevo' | 'contactado' | 'cualificado' | 'estancado' | 'inactivo' | 'convertido';
  interest: string | null;
  assignedUserId: string | null;
  source: LeadSource;
  duplicateReviewId: string | null;
  createdAt: string;
  updatedAt: string;
};

type LeadOpportunityOrigin = 'lead_conversion' | 'manual';

type LeadSource = {
  kind: 'manual' | 'campaign' | 'whatsapp_simulated' | 'referral' | 'social' | 'partner';
  provider: string | null;
  externalId: string | null;
  campaign: string | null;
  utm: Record<string, string>;
};
```

## Commands and queries

| Operation                   | Input                                                                    | Result                                      |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| `listLeads`                 | scope, filters, cursor, limit, sort                                      | Paginated authorized leads                  |
| `getLead`                   | leadId and scope                                                         | Lead with contact/opportunity summary       |
| `createLead`                | contactId or contact creation input, source, assignment, idempotency key | Lead and contact relation                   |
| `updateLead`                | leadId, patch, expected version                                          | Updated lead or conflict                    |
| `moveLeadStatus`            | leadId, target status, expected version                                  | Updated state and audit event               |
| `createOpportunityFromLead` | leadId, product/interés key, opportunity input, idempotency tuple        | Opportunity linked to same contact and lead |

## Rules

- A lead always belongs to one Contact.
- A new lead may create a Contact through the approved Contact contract.
- Exact normalized external identifiers are idempotent inside provider/account/organization scope.
- Ambiguous contact matches create the contact and open human duplicate review; no automatic merge.
- Campaign and WhatsApp real integrations are deferred; `referral`, `social` and `partner` are
  active source values in the pilot and may be captured manually or through fixtures.
- Agent and manager may move authorized leads; admin configures allowed states/rules.
- `assignedUserId` may be null (automatic assignment to the actor) or an active `owner`, `admin`
  or `agent` membership in the same organization; viewers, suspended memberships and cross-org
  users are rejected before any Contact or Lead side effect.
- Every state change and conversion is auditable.
- A qualified Lead may create one conversion Opportunity per normalized product/interés key in
  stable stage ID `qualified`, initially displayed as `Cualificado`.
- The first successful `lead_conversion` changes the Lead status from `cualificado` to `convertido`.
- `convertido` means the Lead has produced at least one conversion Opportunity; it does not block
  later conversion Opportunities for different product/interés keys.
- Repeating the same Lead + product/interés conversion returns the existing Opportunity; a different
  product/interés may create another Opportunity for the same Lead and Contact.
- Pipeline may create additional manual Opportunities, identified with `origin = manual`; Lead
  conversion uses `origin = lead_conversion`.
- Creating a manual Pipeline Opportunity does not change the Lead status by itself.
- The database must enforce uniqueness for the conversion tuple `(tenant, lead, product_key,
origin=lead_conversion)` and the command must be transactional.
- The visible stage name/order may change without changing stable IDs, contracts or historical data.
- Cross-tenant leads and references are never returned.
- The application validates assignees against active organization membership, and the database
  additionally enforces `(organization_id, assigned_to_user_id)`, active operational roles and an
  RLS write check. Applying that barrier is a no-go while historical assignments do not satisfy the
  same organization/status/role invariant; the migration never repairs those rows silently.
- The conversion command never accepts `contactId`; the transactional backend operation inherits
  the Lead's authorized Contact and rejects non-qualified status. A repeated normalized
  Lead/product conversion returns the existing Opportunity, while a successful new conversion
  returns the created Opportunity and reconciles the Lead status.
- Initial-note persistence follows Lead capture. If the note fails after the Lead is created, the
  result is partial success: the client retains the created Lead identity and retries only the
  idempotent note command. It must not present the capture itself as failed or create another Lead.

## Errors

Use typed envelopes and stable codes:

```ts
type LeadErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INVALID_STATUS_TRANSITION'
  | 'CONTACT_REQUIRED';
```

## Frontend

- Leads list and contextual detail use `SuiteCanvas mode="split"` from module entry.
- Direct detail uses `SuiteCanvas mode="workspace"` via “Ver ficha” or a direct route.
- FSD layers are app -> widgets -> features -> entities -> shared.
- Query keys include organization, workspace, filters and source dimensions.
- State includes loading, empty, error, forbidden and success.

## Frontend adapter alignment (2026-09-10)

The local CRM adapter now implements the approved lifecycle separation. Lead status uses the
stable technical codes `new`, `contacted`, `qualified`, `stalled`, `inactive`, and `converted`;
these codes are never used as Pipeline stage codes. Opportunities use the independent Pipeline
stages `prospecting`, `qualified`, `proposal`, `negotiation`, `won`, and `lost`. Pipeline renders
Opportunities only. A qualified Lead conversion preserves the Contact and organization, starts
the Opportunity at `qualified`, and is idempotent for each normalized Lead/product key. The
first successful conversion changes the Lead to `converted`; additional product keys remain
allowed. Moving an Opportunity, including to `lost`, does not mutate Lead status.

Conversion modal UX follows the approved CRM/UI Kit pattern: a controlled Radix `Dialog` with
`DialogHeader`, labelled `Input` fields, a responsive `max-h-[90vh]`/`sm:max-w-xl` content
surface, form submit semantics, pending state, and inline validation/conflict/permission/server
feedback. Focus is explicitly restored to the action that opened the modal. Dirty conversion
details use the shared `ConfirmDialog` warning before dismissal. The existing CRM Contact
`Sheet`/`ContactFormDrawer` uses the same dirty-state `ConfirmDialog` and focus-restoration
behavior, and Contact archive confirmation now uses that system primitive as well; no browser
native prompt/confirm is used for these CRM actions.

### Fase 3 local

The local adapter now also exposes `createLead`. Capture requires an existing Contact and an
interest, accepts manually supplied source/attribution and local assignment, and starts at
`new`. The Leads page provides a standard Dialog plus a contextual drawer workspace with
contact, source, owner, related opportunities and conversion actions. This remains local-only;
membership validation and persistence belong to the future Supabase adapter.

## Definition of contract readiness

- [x] UX and component audit approved.
- [x] Product Owner approves source, status and conversion rules.
- [x] Tech Lead approves commands, queries, errors and idempotency.
- [x] Schema/RLS impact is recorded.
