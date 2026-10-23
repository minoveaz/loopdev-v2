# Account native compositions

These compositions define the approved iOS and Android renderer structure using
the existing Expo/React Native UI kit. They are separate from
`wireframes/*.svg`, which describe desktop and mobile web. They are design
artifacts, not runtime screenshots; source and test evidence is recorded
separately in `platform-evidence-matrix.md`.

## Shared native frame

Both native platforms use the current `mobileTheme` and the native component
catalog. The account destination is a native stack screen, not a web route or
embedded Rivera page:

```text
Native stack/screen wrapper (owns system insets and back behavior)
├── Native back/navigation header
├── MobilePageHeader (title, description, optional action)
└── MobilePageContainer (scrollable content host)
    └── MobileCard sections and native controls
```

Navigation preserves the originating surface in the Expo app and uses the
same semantic destination/action IDs as web. Profile and Preferences are
connected from the account sheet and More screen. The Expo renderer owns its
own screen/back behavior; OS-level back, safe-area insets, keyboard avoidance
and focus restoration still require device acceptance.

## Per-view compositions

| View | Proposed native composition | Existing components | Gap or constraint |
|---|---|---|---|
| Profile | Identity header with `MobileAvatar` and account identity; `MobileCard` containing labeled `MobileInput` for display name; native image-library picker and confirmation for avatar removal | `MobilePageHeader`, `MobilePageContainer`, `MobileAvatar`, `MobileCard`, `MobileInput`, `MobileButton`, `MobileLoadingState`, `MobileConfirmDialog` | Implemented through the shared Auth/Profile/Private Files adapters; signed preview, upload, cleanup and errors are covered by component tests. OS picker permissions and device behavior remain unverified |
| Preferences | One scroll screen with separate `MobileCard` groups for language/timezone, appearance, and notifications; options open `MobileSelectSheet`; appearance/notification booleans use accessible React Native switches; show per-field pending/error feedback | `MobilePageHeader`, `MobilePageContainer`, `MobileCard`, `MobileSelectSheet`, `MobileButton`, `MobileLoadingState` | No Account-level preference form/state component is verified. Do not reuse the account sheet's local language toggle as synced preference behavior; add a focused shared native control only if these primitives do not meet the contract |
| Security | `MobileCard` per password/email, MFA and session capability; `MobileInput` for credential changes; `MobileStatusBadge` for provider-confirmed state; `MobileConfirmDialog` for signing out other sessions; unsupported/empty sections use explicit feedback | `MobilePageHeader`, `MobilePageContainer`, `MobileCard`, `MobileInput`, `MobileButton`, `MobileStatusBadge`, `MobileEmptyState`, `MobileLoadingState`, `MobileConfirmDialog` | Use provider-supported sign-out-other-sessions only. No fake factors, sessions or device inventory; do not store credentials or secrets in view state beyond provider requirements |
| Billing | Active organization context at top; `MobileCard` for authoritative subscription summary and each invoice; provider actions use `MobileButton` and a secure external/native handoff; empty and forbidden states are explicit | `MobilePageHeader`, `MobilePageContainer`, `MobileCard`, `MobileButton`, `MobileStatusBadge`, `MobileEmptyState`, `MobileLoadingState`, `MobileConfirmDialog` | No native Billing handoff primitive or provider contract is verified. Do not display seeded plans, payment methods, invoices or prices; Owner/Admin authorization is server-enforced |

## Platform-specific behavior

| Concern | iOS | Android |
|---|---|---|
| Navigation | Native stack/back gesture; return to the screen that opened Account | Native stack/system back; return to the screen that opened Account |
| Safe area and keyboard | Respect top/bottom safe areas and keyboard inset; scroll focused fields into view | Respect system insets and keyboard resize/pan behavior; scroll focused fields into view |
| Selectors | `MobileSelectSheet` as the in-app selection surface; OS picker only when required by an approved contract | `MobileSelectSheet` as the in-app selection surface; OS picker only when required by an approved contract |
| Image selection | Expo image-library picker uses the approved private avatar adapter; no camera access is requested | Expo image-library picker uses the approved private avatar adapter; no camera access is requested |
| Provider flows | Use provider-supported native SDK or secure system-browser handoff; never embed a provider web page without approval | Use provider-supported native SDK or secure system-browser handoff; never embed a provider web page without approval |
| Visual system | Existing `mobileTheme` and React Native controls | Existing `mobileTheme` and React Native controls |

## Shared interaction and state rules

- Preserve operation IDs, permissions, validation, state meaning and copy
  semantics from `view-state-matrix.md`; layout and OS navigation may adapt.
- Use `MobileLoadingState` for loading, and explicit `MobileEmptyState` or
  inline error feedback for empty/error/unsupported outcomes. Do not convert
  unavailable provider behavior into an empty-success state.
- Keep drafts on recoverable field errors/conflicts, disable duplicate
  submissions while pending and report success only after authoritative
  adapter/provider confirmation.
- Use `MobileConfirmDialog` for destructive session or subscription actions
  only when the authoritative capability exists.
- Preserve accessible labels/roles, selected/disabled/busy state, screen-reader
  announcements and touch targets. Color is never the only status signal.
- Keep security and billing details out of stale/offline caches according to
  the operation-level state matrix.

## Reuse boundary

`MobilePageContainer`, `MobilePageHeader`, `MobileCard`, `MobileInput`,
`MobileButton`, `MobileSelectSheet`, `MobileAvatar`, `MobileStatusBadge`,
`MobileEmptyState`, `MobileLoadingState` and `MobileConfirmDialog` are
source-verified React Native primitives. Their existence does not establish
Account routes, persistence, authorization or provider operations.

Create or extend a native component only for an approved capability that the
current catalog cannot express accessibly. In particular, avatar image upload,
secure Auth operations and Billing provider handoff remain contract-dependent.
Do not align native colors to Rivera web solely for cross-platform appearance:
the user confirmed that Rivera is the desktop/mobile web baseline and native
apps retain their existing component and token system.

**Review status:** the conceptual visual package is approved. Native runtime
and device comparison remain outstanding for the operations identified above.
