---
title: Platform foundation and Catalog local handoff
status: local-complete
updated: 2026-09-12
---

# Platform foundation y Catalog local

## Alcance completado

La Fase 2 implementa una base local y reemplazable para capacidades que no pertenecen
exclusivamente a CRM:

- `src/loopdev/domains/platform` define `OrganizationContext`, `EntityScope`, `EntityRef`,
  permisos y `PlatformAdapter`.
- `src/loopdev/domains/catalog` define `OrganizationCatalog`, `CatalogItem`, `Offer`,
  `CatalogVariant`, `ProductPartyRole`, `CatalogAvailability`, `CatalogEligibility`,
  `PriceBook`, `PriceEntry` y `CatalogAdapter`.
- Los stores locales usan fixtures deterministas y separan organización y workspace. Los
  registros compartidos usan `workspaceId: null`; los registros restringidos solo son visibles
  dentro del workspace solicitado.
- Las claves `key` y `sku` son estables. Nombre visible, estado, precio y operación se mantienen
  en contratos separados.
- Metadata permite ejemplos de salud, comercio, SaaS y servicios profesionales sin introducir
  campos sectoriales en el núcleo.
- El adapter local soporta lectura y CRUD de ofertas, variantes, price books y price entries,
  con validación de permisos `catalog.read`/`catalog.write`, scope por organización/workspace y
  eliminación explícita.
- ERP expone catálogos por deep link, búsqueda, filtros, ciclo de vida, detalle contextual,
  gestión comercial, estados de carga/error y catálogo inexistente.
- Customer 360 consume `CRMCustomerProduct` para representar asociaciones reales con cantidad,
  importe, fechas, estado y origen CRM (`sourceOpportunityId`/`sourceLeadId`).
- Communications 360 puede adjuntar un `catalog_item` a un mensaje y conserva su metadata tipada.
- Leads mantiene el drawer exclusivamente para creación/edición. La consulta de un lead usa
  el workspace navegable `/app/sales-crm/leads/:leadId`, con resumen de contacto, estado,
  actividad, oportunidades relacionadas, archivos y acciones comerciales.

## Integración CRM

`CRMOpportunity` y `CRMPipelineOpportunity` conservan `productKey` para compatibilidad. También
exponen referencias opcionales `catalogItemId`, `offerId` y `variantId`. La conversión local de
Lead mantiene la idempotencia anterior, y cuando recibe una referencia válida puede resolverla
mediante `CatalogAdapter` y conservar su `productKey` estable.

El catálogo dejará de considerarse una capacidad propiedad de CRM en la Fase 9.
Su track canónico es
[`PRODUCT_CATALOG_GLOBAL_TRACK.md`](../products/PRODUCT_CATALOG_GLOBAL_TRACK.md).
CRM y Communications 360 serán consumidores del catálogo global y conservarán
únicamente sus referencias de negocio.

## Límites locales conocidos

- La persistencia sigue siendo local-first; no hay sincronización entre dispositivos,
  auditoría remota ni resolución de conflictos multiusuario.
- No se implementan todavía cotizaciones, pedidos, billing, inventario, entitlement
  transaccional remoto ni versionado inmutable de ofertas.
- Los datos de parties, disponibilidad y elegibilidad usan contratos y fixtures locales;
  la resolución de organizaciones/profesionales reales queda para la integración de backend.

## Frontera futura Supabase

Esta entrega no instala Docker/Supabase, no ejecuta migraciones y no conecta backend real. Las
páginas siguen consumiendo hooks y adapters. La integración futura debe reemplazar los adapters
locales por implementaciones Supabase conservando:

1. `organizationId` y `workspaceId` como scope autorizado.
2. `EntityRef` para relaciones polimórficas.
3. Permisos antes de leer o mutar datos.
4. Los estados y claves estables del catálogo.
5. La compatibilidad de CRM con `productKey` durante la transición a referencias de catálogo.
