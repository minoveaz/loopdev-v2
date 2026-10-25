---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: deferred
  android: deferred
status: approved_web_only
owner: "@loopdev-io (Product Owner)"
---

# Platform scope

## Surface decision

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
| --- | --- | --- | --- | --- |
| Desktop web | Required | `/app/erp/products` is canonical; `/app/erp/product-catalog` redirects to it and `/app/erp/product-catalog/:catalogId` remains compatible | @loopdev-io (Product Owner) | `src/routes/LoopdevRoutes.tsx` registers these paths. The authenticated shell was exercised, but the catalog request currently fails closed because `VITE_CATALOG_ADAPTER_MODE` is unset; no remote runtime was used. |
| Mobile web | Required | Same responsive web route and action surface; mobile viewport/operation parity is not verified | @loopdev-io (Product Owner) | User-approved first-release scope; wireframes are conceptual only; verify responsive interactions and operations in mobile web. A native mobile router is outside this approved scope. |
| iOS | Deferred | No ERP native route or build evidence inspected; not part of this release | @loopdev-io (Product Owner) | User selected web desktop/mobile only; reconsider in a later release |
| Android | Deferred | No ERP native route or build evidence inspected; not part of this release | @loopdev-io (Product Owner) | User selected web desktop/mobile only; reconsider in a later release |

## Visual composition decision

The visual gate covers the current ERP Overview as navigation compatibility and
the target Products surface as the first-release functionality: a direct,
organization-scoped product/service list, full-page product/SKU records and
forms, quick auxiliary-reference drawers, commercial configuration and
category-tree administration within Products. The approved scope is amended by
`CR-ERP-PRODUCT-MEDIA-001` to include image assets for products and variants,
an organization-scoped reusable library, file metadata and alt text, without
automatic channel publication or synchronization. The original conceptual
visual approval from 2026-10-24 did not cover media; the desktop/mobile
gallery addendum was separately approved conceptually on 2026-10-25. This
approval does not approve the shared Files contract or implementation. The approved record includes a
unit purchase-cost reference per product/SKU (not accounting/inventory
valuation or margin calculation) and structured physical attributes.
It removes the standalone
organization-catalog index from the proposed module flow. Catalog-named
structures may remain internal; migration data is preserved until an
authorized inventory and dry-run are reviewed. Its normative source is
[`visual-design.md`](visual-design.md), with desktop/mobile evidence under
[`wireframes/`](wireframes/) and state coverage in
[`view-state-matrix.md`](view-state-matrix.md).

Desktop uses the current wide page shell, shared KPI/cards, compact local
DataTable and full-page product/SKU forms and records. Mobile web preserves the
same action semantics but stacks overview/cards, renders product rows as cards,
uses full-page forms/records and reserves a full-surface drawer for quick
reference creation. The canonical `/app/erp/products` route is already registered in the web
application; `/app/erp/product-catalog` redirects to it, while
`/app/erp/product-catalog/:catalogId` remains a compatibility route. This route
registration does not prove product data loads or that operations are complete:
the current local runtime fails closed without an explicit adapter mode, and
mobile-web operation parity still needs verification. Sales, purchasing, inventory, finance,
Shopify connection and sync views remain unapproved candidates and are not
represented as committed scope.

These artifacts do not demonstrate runtime rendering or operation parity.
Conceptual approval covers the revised full-page product/SKU compositions,
record page, reference drawers and purchase-cost-reference scope, approved by
@loopdev-io on 2026-10-24. The media addendum was approved conceptually by
@loopdev-io on 2026-10-25. Screenshot comparison remains `NOT_RUN` until
implementation exists. Remote Products and
Files are online-only:
offline is an unavailable state with no cache or mutation queue, while
`local_demo` is a separately selected local-only mode.

The revised wireframes use the exact light HSL token values from
`src/index.css`, the white sidebar/active-item treatment from
`src/components/layout/Sidebar.tsx`, the shared card surface from
`src/components/common/SurfaceCard.tsx`, and the current LoopDev navigation
labels. This is a static source-backed visual proposal, not runtime evidence;
the SVG snapshot covers light theme only.

## Shared contract decisions

| Concern | Shared source | Desktop adaptation | Mobile adaptation | Evidence |
| --- | --- | --- | --- | --- |
| Domain and lifecycle | `src/loopdev/domains/catalog/types.ts` is the legacy technical contract; canonical Products model TBD | Current catalog UI/adapter supplies evidence for the future Products module | Same semantics required; individual mobile operations need testing | `discovery.md`; catalog tests |
| Product category operations | Proposed shared operations `catalog.categories.list` / `catalog.categories.manage`; current `categoryKey` is not a category-tree contract | Dedicated category-management view within Products; tree/detail composition is conceptual | Same operations and permission semantics; tree and detail stack with visible return to Products | `VD-ERP-013`; category-management wireframe and platform evidence matrix |
| Product media operations | Proposed `catalog.media.library.list`, `catalog.media.upload`, `catalog.media.attach`, `catalog.media.metadata.manage`, `catalog.media.reorder` and `catalog.media.detach`; shared Files owns file bytes and derivatives, Products owns product/variant association semantics | Product record shows a right-column carousel; the full gallery is product-scoped and “Usar existente” opens an in-context selector, not an organization-library route | Same operations; the product card stacks, selector uses a full surface, and upload interruption/focus return are specified | Approved conceptual media design and wireframes; current Files contract is insufficient for generic remote/reusable associations and renditions |
| Navigation and deep links | `src/routes/LoopdevRoutes.tsx`; canonical web route is registered and legacy paths remain compatible | `/app/erp/products`; legacy `/app/erp/product-catalog` redirect and `:catalogId` compatibility route | Same responsive web route; mobile-web back/close and operation behavior require viewport verification. Native iOS/Android are deferred. | Current route source, Shell reference and `wireframes/` |
| Permissions and tenant scope | Platform organization/membership and RLS contracts; cost read/manage are separate (`catalog.cost.read`, `catalog.cost.manage`) | Existing catalog actions need permission parity audit; cost fields are gated separately | Same semantics; mobile visibility does not substitute for server checks | `MULTI_TENANCY_STRATEGY.md`, `DATABASE_SECURITY_RLS.md`, catalog migration and Product Owner decision |
| Offline and synchronization | Remote Products are online-only; local demo mode is separate and explicit | Explicit `VITE_CATALOG_ADAPTER_MODE` selection and fail-closed behavior are implemented; current runtime is unset. Core local Catalog persistence is strict, while product-media persistence remains best-effort. | Same unavailable/offline feedback; no remote cache or mutation queue in this release | `sync-model.md`, `catalog/adapter/index.ts`, Catalog adapter tests and `localProductMedia.ts` |
| Visual tokens and states | Official typography: Inter/JetBrains Mono (`CRM_UI_COMPONENT_PROTOCOL.md`, Product Owner); current code tokens/primitives in `src/index.css`, `tailwind.config.ts` | Light-theme SVGs use source HSL tokens and shared page/form primitives; current runtime still loads Geist/Geist Mono and legacy Catalog labels, to reconcile in build | Same official fonts and semantic meaning; stacked category tree, full-page forms/records, quick reference drawer, minimum 44×44px touch targets | `visual-design.md`; updated desktop/mobile SVGs; font/route drift recorded; no runtime comparison yet |

## Deferred or unsupported surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up issue |
| --- | --- | --- | --- | --- |
| iOS and Android ERP operations | Explicitly deferred from first release by the Product Owner | No native parity is claimed | @loopdev-io (Product Owner) | #36 |
| Mobile-web operation parity | Responsive source exists, but operation-level behavior has not been verified | Users could see data without all required actions | @loopdev-io (Product Owner) | #36 |
| Product media operation parity | Desktop/mobile composition is conceptually approved; remote Files operations, derivatives and per-operation runtime evidence remain unverified | Local-only behavior could be mistaken for a tenant-safe upload/reuse flow | Product Owner + Platform owner | #36 |
| Sales, purchasing, inventory, finance and channel integrations | Explicitly deferred from this release (`ERP-OD-006` resolved) | Wireframes/roadmap could be mistaken for approved MVP scope | @loopdev-io (Product Owner) | #36 |
