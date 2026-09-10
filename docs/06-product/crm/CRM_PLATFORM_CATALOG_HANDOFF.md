---
title: Platform foundation and Catalog local handoff
status: local-complete
updated: 2026-09-10
---

# Platform foundation y Catalog local

## Alcance completado

La Fase 2 implementa una base local y reemplazable para capacidades que no pertenecen
exclusivamente a CRM:

- `src/loopdev/domains/platform` define `OrganizationContext`, `EntityScope`, `EntityRef`,
  permisos y `PlatformAdapter`.
- `src/loopdev/domains/catalog` define `CatalogItem`, `Offer`, `CatalogVariant`, `PriceBook`,
  `PriceEntry` y `CatalogAdapter`.
- Los stores locales usan fixtures deterministas y separan organización y workspace. Los
  registros compartidos usan `workspaceId: null`; los registros restringidos solo son visibles
  dentro del workspace solicitado.
- Las claves `key` y `sku` son estables. Nombre visible, estado, precio y operación se mantienen
  en contratos separados.
- Metadata permite ejemplos de salud, comercio, SaaS y servicios profesionales sin introducir
  campos sectoriales en el núcleo.

## Integración CRM

`CRMOpportunity` y `CRMPipelineOpportunity` conservan `productKey` para compatibilidad. También
exponen referencias opcionales `catalogItemId`, `offerId` y `variantId`. La conversión local de
Lead mantiene la idempotencia anterior, y cuando recibe una referencia válida puede resolverla
mediante `CatalogAdapter` y conservar su `productKey` estable.

## Frontera futura Supabase

Esta entrega no instala Docker/Supabase, no ejecuta migraciones y no conecta backend real. Las
páginas siguen consumiendo hooks y adapters. La integración futura debe reemplazar los adapters
locales por implementaciones Supabase conservando:

1. `organizationId` y `workspaceId` como scope autorizado.
2. `EntityRef` para relaciones polimórficas.
3. Permisos antes de leer o mutar datos.
4. Los estados y claves estables del catálogo.
5. La compatibilidad de CRM con `productKey` durante la transición a referencias de catálogo.
