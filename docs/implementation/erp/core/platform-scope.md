---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: planned
  android: planned
status: specialized_analysis_complete
owner: "ERP product owner (individual pending)"
---

# Platform scope

## Surface decision

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
| --- | --- | --- | --- | --- |
| Desktop web | Required | Current routes: `/app/erp/overview`, legacy `/app/erp/product-catalog`; target Products route `/app/erp/products` is proposed, not implemented | ERP product owner (individual pending) | Multiplatform contract; current route source in `src/routes/LoopdevRoutes.tsx` |
| Mobile web / Expo Web | Required | Existing responsive web route; operation parity not verified; styled compositions are in `visual-design.md` and `wireframes/` | ERP product owner (individual pending) | Shared route semantics; wireframes are conceptual only; require operation-by-operation mobile evidence |
| iOS | Planned, not approved | No ERP native route or build evidence inspected | Owner pending assignment | Decide applicability and owner before plan approval |
| Android | Planned, not approved | No ERP native route or build evidence inspected | Owner pending assignment | Decide applicability and owner before plan approval |

## Visual composition decision

The visual gate covers the current ERP Overview and the target Products
surface: a direct, organization-scoped product/service list, product detail,
product form, commercial configuration and category-tree administration
within Products. It removes the standalone
organization-catalog index from the proposed module flow. Catalog-named
structures may remain internal; their continued use and field ownership are
open domain decisions, and no existing data is deleted by this design. Its normative source is
[`visual-design.md`](visual-design.md), with desktop/mobile evidence under
[`wireframes/`](wireframes/) and state coverage in
[`view-state-matrix.md`](view-state-matrix.md).

Desktop uses the current wide page shell, shared KPI/cards, compact local
DataTable and contextual AppDrawer. Mobile web preserves the same action
semantics but stacks overview/cards, renders product rows as cards and presents
forms/detail in a full-surface drawer. The former `/app/erp/product-catalog`
route remains the current implementation until a later build migrates
navigation to `/app/erp/products` and preserves old deep links through a
compatible redirect/filter. Sales, purchasing, inventory, finance,
Shopify connection and sync views remain unapproved candidates and are not
represented as committed scope.

These artifacts do not demonstrate runtime rendering or operation parity.
Conceptual visual approval is recorded; screenshot comparison remains
`NOT_RUN` until approved implementation exists.

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
| Navigation and deep links | `src/routes/LoopdevRoutes.tsx`; current route is legacy, target path is proposed | Current `/app/erp/product-catalog/:catalogId`; proposed `/app/erp/products` with legacy redirect/filter | Same route meaning; sidebar drawer, product-card action, back/close and old deep-link behavior require mobile verification | Current route source, Shell reference and `wireframes/` |
| Permissions and tenant scope | Platform organization/membership and RLS contracts; current IDs remain `catalog.*` | Existing catalog actions need permission parity audit | Same semantics; mobile visibility does not substitute for server checks | `MULTI_TENANCY_STRATEGY.md`, `DATABASE_SECURITY_RLS.md`, catalog migration |
| Offline and synchronization | Local-first/domain contracts and future integration contract | Existing catalog-named adapter is the current Products persistence path; sync/conflict states are proposals, not implemented runtime claims | Same semantic states; offline behavior and pending/error feedback unverified | Multiplatform delivery contract, `visual-design.md`, adapter evidence |
| Visual tokens and states | Official typography: Inter/JetBrains Mono (`CRM_UI_COMPONENT_PROTOCOL.md`, Product Owner); current code tokens/primitives in `src/index.css`, `tailwind.config.ts` | Light-theme SVGs use source HSL tokens, shared sidebar/card treatments and target Products navigation; current runtime still loads Geist/Geist Mono and legacy Catalog labels, to reconcile in build | Same official fonts and semantic meaning; stacked category tree/detail, single-column cards/full-surface drawer, minimum 44×44px touch targets | `visual-design.md`; five revised SVGs; font/route drift recorded; no runtime comparison yet |

## Deferred or unsupported surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up issue |
| --- | --- | --- | --- | --- |
| iOS and Android ERP operations | Native scope/owner not decided | Web-first plan could be mistaken for native parity | Product/platform owner pending | #36 |
| Mobile-web operation parity | Responsive source exists, but operation-level behavior has not been verified | Users could see data without all required actions | ERP product owner pending | #36 |
| Sales, purchasing, inventory, finance and channel integrations | First cross-sector release modules remain open (`ERP-OD-006`) | Wireframes could be mistaken for approved MVP scope | Product Owner | #36 |
