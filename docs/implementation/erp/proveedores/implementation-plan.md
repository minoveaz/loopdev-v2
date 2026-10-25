# ERP Proveedores — Plan de implementación

## Inputs y estado

| Campo | Valor |
|---|---|
| Slice | `supplier-directory` |
| Run | `MOD-PROVEEDORES-20261025-001` |
| Producto/diseño | `discovery.md`; `architecture-design.md`; `visual-design.md` v1.1 aprobado |
| Track | ERP Products; las transacciones P2P siguen en sus módulos propietarios |
| Aprobador | Usuario aprobó dirección funcional/visual y las tareas no dependientes de reglas fiscales, con aprobación por tarea |
| Entorno | `minoveaz/loopdev-v2`; branch checkout; `feature/erp-proveedores`; HEAD `ffd9bd16d01438f8dc3efd25be4b646861988476`; working tree modificado |
| Runtime | Ninguna ruta Supplier ni runtime verificado; no se afirma implementación |
| Plataformas | Desktop web y mobile web; iOS/Android fuera del slice |

## Alcance y supuestos

Incluye directorio Supplier, maestro P2P, SupplierItem manual y el enlace
explícito a Product o variante. CSV y las transacciones de PO, recepción,
factura y pago se conservan en el ledger como capacidades fuera de este slice,
sin tareas de implementación. Se reutilizan Platform/Rivera; no se autoriza
crear una UI, persistencia ni permisos paralelos. La ubicación acordada es
`ERP > Proveedores`, independiente de CRM y del catálogo de Products. No se
migrarán automáticamente registros legacy `ProductPartyRole`; cualquier
reconciliación requiere alcance y aprobación separados.

## Inventario actual y arquitectura destino

- No existe ruta Supplier ni dominio/adapter Supplier. Existe `ProductPartyRole`
  local, pero no es un maestro Supplier y no se migrará automáticamente.
- Products ofrece identidad canónica, variantes, adaptadores y permisos
  `catalog.read`/`catalog.write`; el modelo core excluye términos Supplier del
  permiso Products. Se requiere grant Supplier explícito y RLS propio. La
  política aprobada asigna lectura a la misma población lectora de Products y
  gestión a su población escritora, sin ampliar `catalog.read`; la auditoría
  obligatoria debe verificar el patrón técnico de grants, RLS y audit append-only.
- Reutilizar `PageContainer`, `PageHeader`, `DataTable`, `SurfaceCard`,
  `StatusBadge`, `SearchInput`, `FilterDropdown`, `FormSection`, `Select`,
  `Command`, `Popover`, `Calendar`, `Dialog` y estados comunes. Mobile web
  conserva las mismas operaciones en cards; no crear controles genéricos nuevos.
- Contrato compartido precede a dominio/adapters y a los renderers desktop y
  mobile. Product sigue siendo dueño de Product/variant; Procurement,
  Inventory y Finance son dueños de las transacciones posteriores.
- Tax/bank reales: persistencia protegida y server-authoritative; sin clear
  cache, `localStorage`, lectura/escritura offline ni cola sensible. Fixtures
  únicamente sintéticas.

## Breakdown ordenado (draft, no autorizado para ejecución)

| ID | Tipo | Plataformas | Dependencias | Definición de terminado |
|---|---|---|---|---|
| `SUPPLIER-MANDATORY-AUDITS` | audit | shared, desktop_web, mobile_web | — | Evidencia de environment-truth, platform-reuse, legacy-flow, route/runtime, surface-state, accessibility/i18n, security/rollback, architecture-boundary, responsibility y refactor-safety. |
| `SUPPLIER-ROUTE-AUDIT` | audit | desktop_web, mobile_web | `SUPPLIER-MANDATORY-AUDITS` | Ruta/sidebar confirmadas y direct route, refresh, back y autorización comprobados. |
| `SUPPLIER-DIRECTORY-CONTRACT` | shared_contract | shared | auditorías | Contrato del directorio, estados, errores, permisos, scope y operaciones compartido por renderers. |
| `SUPPLIER-DIRECTORY-DOMAIN` | backend | shared | `SUPPLIER-DIRECTORY-CONTRACT` | Identidad, lifecycle, duplicados, organización, versión y errores cubiertos por pruebas. |
| `SUPPLIER-P2P-CONTRACT` | shared_contract | shared | auditorías | Contrato P2P sin inventar reglas fiscales por país; datos sensibles protegidos. |
| `SUPPLIER-COUNTRY-TAX-RULES` | backend | shared | — | **Bloqueada** hasta revisión Finance/Legal de España, EE. UU. y Colombia. |
| `SUPPLIER-P2P-DOMAIN` | backend | shared | `SUPPLIER-P2P-CONTRACT`, `SUPPLIER-COUNTRY-TAX-RULES` | Contactos, direcciones, defaults y payee instructions validados/auditados; storage protegido. |
| `SUPPLIER-ASSORTMENT-CONTRACT` | shared_contract | shared | auditorías | Contrato de SupplierItem, draft/link, Product/variante, conversiones y errores. |
| `SUPPLIER-ASSORTMENT-DOMAIN` | backend | shared | `SUPPLIER-ASSORTMENT-CONTRACT` | Draft sin link permitido; compra requiere Product/variante same-org y conversión >0; Product canónico no se modifica. |
| `SUPPLIER-DIRECTORY-DESKTOP` / `SUPPLIER-DIRECTORY-MOBILE` | renderer | desktop_web / mobile_web | contrato, domain y route audit | Todas las operaciones del directorio y estados visuales comparten semántica. |
| `SUPPLIER-P2P-DESKTOP` / `SUPPLIER-P2P-MOBILE` | renderer | desktop_web / mobile_web | contrato y domain P2P | Formularios responsive; verifier owner/admin distinto del editor; sin persistencia sensible offline. |
| `SUPPLIER-ASSORTMENT-DESKTOP` / `SUPPLIER-ASSORTMENT-MOBILE` | renderer | desktop_web / mobile_web | contrato, domain y route audit | Mismas operaciones y reglas Product/variante en ambas superficies. |
| `SUPPLIER-DIRECTORY-TESTS`, `SUPPLIER-P2P-TESTS`, `SUPPLIER-ASSORTMENT-TESTS` | test | desktop_web, mobile_web | renderers y domain | Roles, tenant, duplicados, conflictos, verification y links cubiertos con pruebas enfocadas. |
| `SUPPLIER-CSV-BOUNDARY` | audit | shared | — | Sin UI/operaciones CSV en el slice; reabrir solo con aprobación separada. |
| `SUPPLIER-P2P-BOUNDARY` | audit | shared | — | PO/recepción/factura/pago siguen en Procurement/Inventory/Finance. |

## Matriz de interacción de suites

| Módulo | Trigger / datos compartidos | Permiso/evento | Evidencia planificada |
|---|---|---|---|
| Products | Vincular SupplierItem a Product/variante canónica; Product puede tener múltiples SupplierItems | Supplier grants; Product no se modifica desde Supplier | Contract tests same-org, parent/variant y link |
| Procurement | Seleccionar Supplier activo y snapshot de términos en futura orden | Permiso Procurement; operación fuera del slice | Contrato consumer separado |
| Inventory | Registrar receipt y stock movement propios | Permiso Inventory; Supplier no guarda recepción real | Contrato consumer separado |
| Finance | Leer tax/payment setup y seleccionar payee verificado para pago futuro | Supplier reader/manage + owner/admin verifier; audit Platform | Tests de acceso y verification; transacciones fuera del slice |
| Platform | Files/Notes/Activity/Tasks/Relations/Document Intelligence solo por use case aprobado | Heredan acceso del Supplier; no abren acceso al parent | Platform reuse audit; no se incluyen paneles en MVP |

## Validación y evidencia

- Antes de build: `npm run validate:delivery-ledgers`,
  `npm run validate:module-runs`, `npm run validate:multiplatform`,
  `npm run validate:delivery-evidence`, `npm run test:delivery`.
- Implementación futura: pruebas de dominio y de componente enfocadas;
  `npm run typecheck` y `npm run build` si se modifican fuentes. Journey E4
  solo si el alcance/riesgo aprobado lo requiere.
- Cierre requiere evidencia observable por operación/plataforma. El plan no
  convierte `missing` en `implemented`; no hay screenshots/runtime Supplier.

## Riesgos, bloqueos y siguiente paso

1. Finance/Legal debe concretar campos fiscales por país; solo bloquea tax
   profile y el trabajo P2P que depende de ese perfil; no se inventarán
   requisitos legales para España, EE. UU. o Colombia.
2. La política de acceso está aprobada. El audit técnico debe verificar grant
   Supplier, aislamiento por organización y auditoría append-only antes de
   mutaciones; no ampliar `catalog.read`.
3. La ruta/sidebar queda decidida como `ERP > Proveedores`; el audit de ruta
   aún debe verificar convenciones, navegación directa, refresh, back y autorización.
4. Los registros legacy `ProductPartyRole` permanecen intactos y separados;
   no hay migración automática en este slice.
5. El usuario autorizó por tarea el trabajo no dependiente de reglas fiscales.
   El primer batch ejecutable contiene las auditorías obligatorias y los
   audits de límites CSV/P2P; las tareas con dependencias se habilitan al
   completar sus prerequisitos. El perfil fiscal sigue bloqueado hasta la
   evidencia de Finance/Legal.

**Estado de fase:** `partial` — alcance parcial aprobado por tarea y preparado
para build; los requisitos fiscales dependientes siguen bloqueados.
