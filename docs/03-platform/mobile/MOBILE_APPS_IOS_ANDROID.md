---
title: LoopDev mobile apps — iOS and Android reference
status: design-reference
owner: platform
---

# LoopDev mobile apps — iOS and Android reference

## Scope and status

This is a V2 design and governance reference for potential native iOS and
Android applications. It is **not** evidence that native applications exist,
are implemented, or are released. No native mobile source, build target, store
listing, or mobile runtime was verified in this repository while this document
was written. The current implemented mobile experience is the responsive web
shell described in [`../frontend/MOBILE_SHELL_NAVIGATION_CONTRACT.md`](../frontend/MOBILE_SHELL_NAVIGATION_CONTRACT.md).

Any future implementation must add source, tests, build configuration, and
release evidence before this reference is treated as an implementation claim.

## Platform boundaries

- **Web frontend:** the current browser application owns the implemented web
  shell, responsive layout, browser navigation, and web-specific capabilities.
- **Native apps:** iOS and Android would be separate presentation/adaptation
  clients. They must not silently become a second source of domain rules,
  authorization, or persistence behavior.
- **Shared contracts:** domain models, capability definitions, organization and
  workspace context, permissions, API envelopes, validation rules, sync
  semantics, and error taxonomy should be shared as versioned contracts where
  practical. Platform UI and lifecycle code remains platform-owned.
- **Adapters/API:** native clients consume the same authorized API and domain
  contracts as the web frontend through a mobile-appropriate adapter. The
  server remains the authority for identity, organization membership,
  workspace scope, permissions, mutations, and audit events.
- **Organization/workspace context:** every request and local record carries
  an explicit organization context and, where applicable, workspace context.
  Context is resolved from authenticated membership and server policy, never
  trusted solely from client input. Switching context invalidates or partitions
  cached data and queued mutations.

## Offline, local-first, and synchronization strategy

Offline behavior is an explicit capability, not an implicit guarantee. A
future native client should use a local store and an outbox only for approved
capabilities, with:

1. versioned records, stable IDs, timestamps, actor/device metadata, and a
   server revision or equivalent concurrency token;
2. queued mutations that are idempotent, authenticated, organization-scoped,
   and replayable after reconnect;
3. pull/push synchronization with retry backoff, bounded queue growth, and
   clear stale-session handling;
4. deterministic conflict policies per entity (for example, field-level merge
   only where safe, otherwise server rejection requiring user review);
5. visible sync state and recovery actions; local data must never be presented
   as server-confirmed when it is pending or conflicted; and
6. local deletion/retention rules that respect remote authorization and
   privacy requirements.

The web frontend remains online-first unless its own source-backed contract
says otherwise. Offline support must not bypass server-side RLS or permission
checks.

## Navigation, links, notifications, and secure storage

- Navigation should map stable domain routes to native screens without making
  route strings the domain contract.
- Universal Links (iOS) and App Links (Android) should resolve authenticated
  deep links to the same resource/context checks as web routes. Unrecognized,
  expired, or unauthorized links must fail safely.
- Push notifications should contain minimal, non-sensitive payloads and a
  stable resource reference. The app fetches current authorized data after
  opening; notification delivery is not proof of access.
- Access and refresh credentials belong in Keychain (iOS) and Android Keystore
  backed storage, not ordinary preferences, logs, analytics, or notification
  payloads. Tokens must be revocable and rotated according to the auth
  contract.
- Deep-link and notification routing must preserve organization/workspace
  context and require re-authentication when the session is absent or stale.

## Accessibility and platform conventions

Native clients should meet WCAG-aligned accessibility outcomes while honoring
platform conventions: Dynamic Type and VoiceOver semantics on iOS; font
scaling, TalkBack semantics, and back navigation on Android; minimum touch
sizes; contrast; reduced motion; localization/RTL; keyboard and switch access;
and clear loading, error, empty, and offline states. Shared interaction intent
may be reused, but controls should look and behave naturally on each platform.

## Analytics, observability, and release channels

Analytics events must use a versioned, privacy-reviewed taxonomy shared with
web where semantics match. Events must be organization-safe, avoid secrets and
sensitive payloads, and distinguish device/app version, platform, and
connectivity state. Operational telemetry should include crash reporting,
startup/navigation failures, sync queue health, API latency/error classes, and
release version, with redaction and retention controls.

A future release process should separate internal development, QA/staging,
beta (TestFlight/Google Play testing), and production channels. Builds must be
signed, reproducible, environment-specific, and tied to source commits and
migration/API compatibility evidence. No such native release pipeline is
currently claimed by this document.

## Capability matrix

| Capability | Shared/reused | Extended for native | Platform-specific | Current status |
|---|---|---|---|---|
| Domain entities and validation | Versioned domain/API contracts | Mobile adapter and cache policy | Native serialization/lifecycle | Design only |
| Organization/workspace/permissions | Server authorization and context contract | Context switching and cache partitioning | Secure session UX | Web/source contracts exist; native not verified |
| Navigation and resource links | Stable resource identity | Native route mapping | Universal Links/App Links and back stack | Web shell is implemented; native design only |
| Forms and mutations | API envelope, errors, idempotency | Offline outbox where approved | Keyboard, focus, pickers, gestures | Native not implemented |
| Notifications | Event/resource semantics | Notification preferences and sync | APNs/FCM delivery and OS permission UX | Design only |
| Files and media | File metadata and authorization | Background upload/download | Photos/camera/filesystem APIs | Design only |
| Accessibility | Labels, states, contrast, semantics | Mobile-specific testing | VoiceOver/TalkBack and Dynamic Type | Design only |
| Analytics and observability | Event taxonomy and redaction | Offline buffering and app context | OS crash/performance SDKs | Design only |

## Non-goals

- This document does not assert that iOS or Android applications exist.
- It does not authorize native source, app-store publication, or a separate
  mobile backend.
- It does not duplicate web UI contracts or define pixel-identical native
  screens.
- It does not permit client-side authorization, unrestricted offline access,
  or local data to override server truth.
- It does not choose a native framework, database, push provider, analytics
  vendor, or release automation without an approved implementation decision.

## Open decisions

1. Whether native apps are prioritized and which capabilities require them.
2. Native technology and shared-contract packaging strategy.
3. Offline scope and conflict policy for each entity/capability.
4. Authentication, device enrollment, revocation, and recovery flows.
5. Deep-link ownership and notification preference model.
6. Approved local storage, encryption, telemetry, crash reporting, and retention
   controls.
7. Accessibility test matrix, supported OS versions, and release governance.
