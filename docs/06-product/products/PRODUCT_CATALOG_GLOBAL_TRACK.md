---
title: LoopDev Global Product Catalog
track: products-platform
phase: 9
status: local-implementation-with-commercial-consumers-and-regression-coverage
updated: 2026-09-12
---

# LoopDev ERP Foundation and Global Product Catalog — Fase 9

> **Estado actual:** Fases 9.0–9.12 implementadas localmente para revisión
> visual. El catálogo soporta deep links por `catalogId`, filtros y búsqueda
> adaptados al tipo de catálogo, estados persistentes, acciones de ciclo de
> vida, service keys y atributos específicos de productos físicos. Los
> formularios de catálogo, Leads, Opportunities y Tasks usan el estándar
> compartido de drawer, lifecycle, dirty state, descarte y sección visual
> alineado con Create Contact. No hay integración Supabase.

### Fase 9.7 — Dominio comercial normalizado

La implementación local añade contratos y adapters para `ProductPartyRole`,
`CatalogAvailability` y `CatalogEligibility`, con aislamiento por
organización/workspace. El detalle de cada entrada puede consultar estas
relaciones sin leer directamente `metadata`; los price books, offers y
variants existentes mantienen el mismo contrato local. La persistencia remota
y la resolución de parties reales siguen fuera de esta fase.

### Fases 9.8–9.11 — Cierre funcional

- La vista de detalle expone ofertas, variantes, price entries, roles,
  disponibilidad y elegibilidad mediante el adapter.
- CRM conserva y consume referencias `catalogItemId`, `offerId`, `variantId`
  y `productKey` en oportunidades.
- Communications reconoce tarjetas de catálogo mediante `contentMetadata`
  tipado, sin duplicar la entidad comercial.
- El detalle de un producto o servicio permite crear, editar y eliminar ofertas,
  variantes y price books mediante el adapter local-first, manteniendo estas
  configuraciones separadas del maestro de catálogo.
- El cierre se valida con typecheck, lint, `git diff --check`, tests del
  adapter y la suite completa. Inventario, billing, Supabase y sistemas
  transaccionales siguen fuera de alcance.

## Objetivo

Construir la base inicial de la suite ERP de LoopDev y su primer módulo
transversal: un catálogo global de
productos, servicios y ofertas comerciales, agnóstico a industria. CRM,
Communications 360, Marketing, Billing, Inventory y futuras suites consumirán el
catálogo mediante contratos y adapters; no duplicarán productos en sus propios
dominios.

El catálogo debe servir tanto para:

- pólizas y servicios de aseguradoras;
- productos físicos de retail;
- tratamientos y servicios de clínicas;
- suscripciones y servicios profesionales;
- productos digitales y SaaS.

## Superficie inicial de la suite ERP

La suite se habilitará como una nueva superficie de producto, separada de CRM:

| Superficie | Ruta | Responsabilidad inicial |
| --- | --- | --- |
| Launchpad | `/launchpad` | Tarjeta habilitada de ERP con ilustración propia y enlace a `/app/erp/overview`. |
| ERP Overview | `/app/erp/overview` | Entrada de suite, resumen del estado del catálogo y accesos a los catálogos de la empresa. |
| Product Catalog | `/app/erp/product-catalog` y `/app/erp/product-catalog/:catalogId` | Listar catálogos y gestionar un catálogo concreto de productos o servicios mediante deep link. |

En el sidebar, **ERP aparecerá inmediatamente debajo de CRM** dentro de
`Suites`, con estas entradas iniciales:

- `Overview` → `/app/erp/overview`
- `Product Catalog` → `/app/erp/product-catalog`

La primera vista de Product Catalog no mostrará todavía todos los productos
directamente. Mostrará los **catálogos de la empresa** y permitirá crear, por
ejemplo:

- Catálogo de productos.
- Catálogo de servicios.
- Catálogos adicionales por línea de negocio, canal o país cuando el contrato
  lo permita.

Al abrir un catálogo se entra en la gestión detallada de la Fase 9.3:
productos, variantes, ofertas, proveedores, precios, estados, búsqueda,
filtros, ordenación y detalle.

## Componentes permitidos y frontera con Rivera

Rivera es una fuente visual y de componentes de referencia. No se editará
`src/template/rivera` ni se copiarán páginas, fixtures o lógica de negocio del
template. La suite ERP compondrá la UI con primitives LoopDev ya adoptadas:

| Necesidad ERP | Componente LoopDev autorizado |
| --- | --- |
| Marco y ancho de página | `PageContainer` |
| Encabezado, breadcrumbs y acciones | `PageHeader` |
| KPIs de Overview | `StatCard` |
| Secciones y estados de carga | `DataCard`, `LoadingState`, `EmptyState` |
| Listado tabular | `DataTable` |
| Búsqueda y filtros | `SearchInput`, `Select`, `Combobox` y primitives de `src/components/ui` |
| Estados de producto/oferta | `StatusBadge` |
| Creación y edición | `AppDrawer` / `ResponsiveDrawer` y formularios comunes |
| Detalle contextual | `AppDrawer`, `RecordWorkspace` o primitives Platform existentes |
| Confirmaciones | `ConfirmDialog` |
| Ilustración de Launchpad | Nueva composición propia en `src/loopdev/components/illustrations`, reutilizando primitives SVG existentes; no modificar Rivera |

### Estándar transversal de formularios

Todo formulario de mutación de LoopDev debe seguir el patrón de Create Contact:

- `AppDrawer` con `mode`, `eyebrow`, `headerMeta`, `layoutMode` y `responsive`
  consistentes;
- lifecycle explícito con estado dirty, confirmación de descarte y restauración
  de foco;
- footer con acciones Cancel/Save coherentes y submit accesible por `form`;
- secciones visuales mediante `FormSection`/`FormSectionHeader`;
- validación y errores visibles dentro del formulario, sin confirmaciones nativas;
- attachments y relaciones enviados dentro de la misma operación cuando el
  dominio los soporte.

Este estándar se aplica inicialmente a crear catálogo/producto, Lead,
Opportunity y Task, y será obligatorio para nuevas superficies ERP y CRM.

Antes de implementar cada superficie se debe comprobar si existe un primitive
LoopDev equivalente. Los componentes de `src/template/rivera` solo se pueden
usar como referencia visual o mediante un wrapper explícito si ya forman parte
de una API pública aprobada; nunca se debe importar lógica de sus páginas,
fixtures o stores.

## Principios de ownership

1. **Products define el maestro comercial.** Es propietario de la identidad,
   clasificación, variantes, ofertas, proveedores, precios publicados,
   disponibilidad comercial y versiones.
2. **Los consumidores no duplican el catálogo.** Communications puede buscar y
   compartir una oferta, CRM puede asociarla a una oportunidad y Billing puede
   facturarla, pero ninguno redefine el producto.
3. **El núcleo es sector-agnóstico.** Las capacidades específicas de seguros,
   retail o salud viven en extensiones, atributos tipados y módulos de dominio.
4. **Product no equivale a contrato.** Una póliza contratada, una venta, una
   cita clínica o una línea de pedido son transacciones/entitlements de otros
   dominios que referencian una versión concreta de la oferta.
5. **Local-first primero.** La Fase 9 implementará contratos, adapter local,
   fixtures y superficies; Supabase, Storage, RLS y motores externos quedan
   detrás de la frontera futura.

## Modelo canónico

```text
Party / Organization
  └── participa en ProductOffering mediante ProductPartyRole

Product
  └── ProductVariant
       └── ProductOffering
            ├── Price / PriceBook
            ├── Availability
            ├── Eligibility
            ├── ProductPartyRole
            └── ProductVersion
```

### Entidades y responsabilidades

| Entidad | Responsabilidad |
| --- | --- |
| `Product` | Definición estable del bien o servicio: nombre, categoría, tipo, descripción y estado. |
| `ProductVariant` | Configuración concreta: cobertura, talla, duración, modalidad, capacidad o atributos. |
| `ProductOffering` | Cómo se comercializa una variante: canal, mercado, vigencia, condiciones y estado de venta. |
| `ProductPartyRole` | Relación tipada con organizaciones y profesionales participantes. |
| `PriceBook` / `PriceEntry` | Lista de precios, moneda, impuestos, descuentos y vigencia. |
| `Availability` | Canales, ubicaciones, fechas, capacidad y restricciones de comercialización. |
| `Eligibility` | Reglas o criterios que determinan quién puede adquirir o contratar una oferta. |
| `ProductVersion` | Historial inmutable de condiciones publicadas; evita modificar retroactivamente operaciones existentes. |
| `Category` / `AttributeDefinition` | Clasificación y atributos tipados extensibles, sin campos sectoriales en el núcleo. |

## Proveedores y participantes

El modelo no tendrá campos específicos como `insuranceCompany` o
`manufacturer`. Todas las organizaciones y profesionales se representan como
`Party`/`Organization` y se conectan mediante roles:

- `provider`: proveedor principal del producto o servicio;
- `supplier`: suministrador o distribuidor;
- `manufacturer`: fabricante;
- `brand`: marca;
- `insurer`: aseguradora;
- `seller`: entidad que lo comercializa;
- `performer`: profesional o entidad que presta el servicio;
- `owner`: propietario de la definición comercial.

Una oferta puede tener varios participantes con fechas de vigencia, prioridad,
territorio y condiciones propias.

## Ejemplos de proyección por industria

### Seguros

```text
Product: Seguro de salud
Offering: Sanitas Más Salud — modalidad familiar
ProductPartyRole:
  insurer   -> Sanitas
  seller    -> Estar Protegidos
Variant:
  cobertura, capitales, franquicia, duración y modalidad de pago
```

ASISA, Sanitas y otras aseguradoras pueden ofrecer variantes del mismo tipo de
producto sin duplicar el concepto base. El cálculo de prima y underwriting
serán capacidades futuras, no lógica embebida en el catálogo.

### Retail

```text
Product: Zapatilla deportiva modelo X
Variant: talla 42, color negro
ProductPartyRole:
  manufacturer -> Nike
  brand        -> Nike
  supplier     -> Mayorista ABC
  seller       -> Retailer
```

Inventario, almacenes, logística y devoluciones referenciarán la variante y la
versión de oferta, pero no serán responsabilidad del catálogo.

### Clínica dental o de salud

```text
Product: Implante dental
Offering: Implante de titanio + cirugía + revisión
ProductPartyRole:
  provider  -> Clínica Dental Salud
  performer -> Dra. García
  manufacturer -> Fabricante del implante
```

La agenda, historia clínica y ejecución del tratamiento son dominios externos;
Products solo mantiene la definición comercial y sus condiciones.

## Consumidores previstos

- **Communications 360:** búsqueda, tarjetas compartibles, recomendaciones y
  asociación de productos/ofertas a conversaciones.
- **CRM:** Opportunity Lines, presupuestos, interés del Lead y productos
  asociados a clientes.
- **Marketing Studio:** campañas, segmentos y contenido asociado a ofertas.
- **Billing/Finance:** líneas facturables, impuestos y referencias de precio.
- **Orders/Sales:** pedidos, contratos y entitlements adquiridos.
- **Inventory/Procurement:** stock, compras, proveedores y movimientos.
- **Document Intelligence:** documentos de producto, condiciones y extracción
  de atributos, cuando exista esa suite.

Estos consumidores usarán `CatalogAdapter` o contratos equivalentes y no
accederán a stores internos de Products.

## Alcance de la Fase 9

### Fase 9.0 — Base de suite ERP

- [ ] Registrar ERP en el Launchpad como suite habilitada con tarjeta,
  ilustración, descripción, versión y estado.
- [ ] Añadir ERP al sidebar debajo de CRM.
- [ ] Registrar las rutas `/app/erp/overview` y
  `/app/erp/product-catalog`.
- [ ] Crear Overview y Product Catalog con estados loading, empty, error y
  forbidden.
- [ ] Crear el selector de catálogos de empresa antes de mostrar la gestión
  interna de productos.
- [ ] Cubrir navegación, breadcrumbs, foco, responsive y deep links.

### Fase 9.1 — Contrato y modelo global

- [ ] Definir contratos tipados para `Catalog`, `Product`, `ProductVariant`,
  `ProductOffering`, roles de Party, precios, disponibilidad, elegibilidad y
  versionado.
- [ ] Definir la relación empresa → múltiples catálogos, con tipo
  `products`, `services` o una extensión futura controlada.
- [ ] Consolidar y extender los contratos locales existentes de
  `CatalogItem`, `Offer`, `CatalogVariant`, `PriceBook` y `PriceEntry`.
- [ ] Implementar adapter/store local determinista con aislamiento por
  organización y workspace.
- [ ] Implementar gestión de categorías y atributos tipados extensibles.
- [ ] Implementar relación multi-proveedor mediante `ProductPartyRole`.
- [ ] Implementar listado, búsqueda, filtros, ordenación, detalle y estados
  loading/empty/error/forbidden.
- [ ] Implementar creación, edición, archivado, publicación y versionado local.
- [ ] Exponer consumo de catálogo desde Communications 360 sin duplicar
  entidades.
- [ ] Mantener compatibilidad de CRM con `productKey` mientras migra a
  `catalogItemId`, `offerId` y `variantId`.
- [ ] Cubrir adapters, hooks y superficies con tests de contrato y estados de
  concurrencia.
- [ ] Documentar el mapping futuro a Supabase sin ejecutar migraciones.

## Fuera de alcance de la Fase 9

- Motor de pricing complejo, underwriting o cálculo actuarial.
- Inventario físico, almacenes, compras, logística o fulfillment.
- Pedidos, contratos, pólizas, facturación o pagos.
- Agenda clínica, historia clínica o ejecución asistencial.
- Integraciones reales con aseguradoras, marketplaces o proveedores externos.
- Supabase, Storage remoto, RLS productivo o workers.
- Edición de componentes o páginas del template Rivera.

## Criterios de cierre

La fase solo se considerará cerrada cuando la suite ERP esté habilitada en
Launchpad y sidebar, las dos rutas funcionen con deep link, la empresa pueda
crear y abrir catálogos de productos y servicios, y exista un catálogo local
consumible desde al menos CRM y Communications. También deben existir
proveedores representados por roles, ofertas versionadas, fixtures de
seguros/retail/salud, aislamiento por tenant, tests verdes y una frontera
backend documentada. La validación sectorial debe demostrar que el núcleo no
contiene campos exclusivos de una industria.
