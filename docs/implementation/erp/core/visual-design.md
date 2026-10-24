# ERP Core — Diseño visual

> **Fuente visual normativa del gate `01-visual-design`.** Los SVG son evidencia
> revisable, no una especificación de implementación. Aprobación conceptual
> explícita registrada el 2026-10-24; la comparación de runtime sigue pendiente.

## Entradas y aprobación

- Definición funcional: [`design.md`](design.md), aprobada con la enmienda `CR-ERP-PRODUCTS-MODULE`; la nueva superficie visual requiere revisión.
- Arquitectura: [`architecture-design.md`](architecture-design.md), aprobada para el gate visual, con la misma enmienda registrada.
- Contrato multiplataforma: [`MULTIPLATFORM_DELIVERY_CONTRACT.md`](../../../03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md).
- Fuentes de componentes y shell: [`PLATFORM_V2_UI_REFERENCE.md`](../../../03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md), [`PLATFORM_V2_SHELL_REFERENCE.md`](../../../03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md).
- Decisión de alcance visual: el módulo visible se llama **Productos**. El runtime actual sigue usando la ruta legacy `/app/erp/product-catalog`; la ruta canónica `/app/erp/products` es una propuesta de migración, no runtime existente. Ventas, compras, inventario, finanzas e integraciones siguen propuestas; no se representan como MVP aprobado.
- Composiciones revisables: [overview](wireframes/erp-overview.svg), [lista de Productos](wireframes/erp-products.svg), [formulario de producto/servicio](wireframes/erp-product-form.svg) y [detalle/configuración comercial](wireframes/erp-commercial-detail.svg). Se elimina el índice de catálogos como entrada del módulo.
- Estado de aprobación conceptual: `approved` el 2026-10-24; comparación de runtime: `NOT_RUN`.

## Revisión tras el rechazo visual

La primera versión de los SVG fue rechazada por no representar con fidelidad
el frontend de LoopDev. Esta revisión sustituye la paleta dibujada a mano por
una instantánea HSL de los tokens light de `src/index.css`, cambia el sidebar
oscuro por el sidebar blanco real, usa `sidebar-accent` para la navegación ERP
activa y elimina los bordes de card que no existen en `SurfaceCard`. Las
etiquetas de navegación ahora reflejan las secciones registradas por
`loopdevNavigation` y `loopdevNavigationContract`; los drawers usan el overlay
`black/80` de `SheetOverlay`.

El SVG es un artefacto conceptual estático: no cambia código de producción ni
afirma que el runtime use Inter/JetBrains Mono. Muestra el tema light; la
comparación de runtime en light/dark sigue pendiente para después de una
implementación aprobada. La aprobación conceptual permanece pendiente tras
esta corrección.

## Alcance visual confirmado y límites

| Clasificación | Alcance |
|---|---|
| Confirmado | ERP transversal para pymes; **Productos** es el nombre visible del módulo y su lista unificada de productos/servicios es la entrada de trabajo, sin índice previo de catálogos. El maestro distingue terminados, materias primas/componentes y servicios; clase, compra, venta y control de inventario son dimensiones independientes. Cada producto tiene una categoría principal jerárquica; su abastecimiento puede ser comprar, fabricar o ambos y se hereda en las variantes. |
| Confirmado por fuente | `/app/erp/overview`, `/app/erp/product-catalog` y `/app/erp/product-catalog/:catalogId` siguen siendo rutas runtime legacy; la navegación y el contenido real se confirman en `src/routes/LoopdevRoutes.tsx`, `src/loopdev/pages/erp/Overview.tsx` y `ProductCatalog.tsx`. |
| Propuesta para build | `/app/erp/products` como ruta canónica; mantener un redirect/compatibilidad para las rutas legacy. La migración no se incluye en este gate visual. |
| Abierto | Cómo se asignan locale y canales que estaban en `OrganizationCatalog` a sus dominios destino. La moneda comercial pertenece a cada `PriceBook`; `Offer` no tiene moneda independiente y el campo legacy debe retirarse/migrarse. La agrupación quedó confirmada como dato legado solo para migración; no se elimina ni migra data en esta fase. La categoría propia de cada SKU también está confirmada y debe reflejarse en los formularios/listas del plan. |
| Propuesta visual | Mejorar jerarquía, responsive, semántica del drawer y consistencia de formularios sin añadir capacidades de negocio. |
| No aprobado / fuera de estos wireframes | Pantallas de ventas/pedidos, compras, almacén, finanzas, conexión Shopify, sincronización o storefront. Los pilotos MiauCraft e Inhand no convierten esas capacidades en alcance aprobado. |
| No demostrado | Operación completa de ERP en mobile web, runtime de sincronización, clientes iOS/Android o equivalencia de permisos. |

Los datos de los SVG —incluidos los nombres y SKU de ejemplo— son ficticios y
solo sirven para revisar jerarquía y densidad. La muestra visual usa `es-ES` y
EUR como formato de demostración; no fija país, moneda ni configuración real de
ningún cliente.

## Inventario de baseline Rivera / LoopDev

La auditoría contrasta CSS, Tailwind, componentes v2, rutas y tests existentes
con la tipografía oficial confirmada por el Product Owner: **Inter** para UI y
**JetBrains Mono** para datos técnicos. El protocolo CRM vigente define esas
familias, pero el runtime actual carga y aplica **Geist / Geist Mono** desde
`index.html`, `tailwind.config.ts` y `src/index.css`. Este gate usa la tipografía
oficial en su fuente visual y registra Geist como divergencia de implementación
que Platform debe reconciliar; no cambia el runtime ni crea un sistema paralelo.

| Categoría | Baseline observado | Fuente/evidencia actual |
|---|---|---|
| Tokens y tema | Variables semánticas HSL para fondo, foreground, primary, accent, estados, bordes, input, ring y sidebar; variantes light/dark. No usar colores de dominio ad hoc. | `src/index.css` (`:root`, `.dark`) y `tailwind.config.ts` (`theme.extend.colors`). |
| Tipografía oficial | Inter para UI/display; JetBrains Mono para identificadores técnicos. Es la tipografía normativa de los wireframes ERP. | Confirmación del Product Owner y `docs/06-product/crm/CRM_UI_COMPONENT_PROTOCOL.md` (tipografía); wireframes activos de CRM. |
| Divergencia del runtime | El código de la aplicación aún carga Geist/Geist Mono y usa 15px/1.55 en body; esto describe la implementación actual, no el baseline visual oficial. | `index.html` (Google Fonts), `src/index.css` (`@layer base`) y `tailwind.config.ts` (`fontFamily`). Debe reconciliarlo Platform. |
| Radios | `--radius: 0.5rem`; `lg=var(--radius)`, `md=calc(var(--radius)-2px)`, `sm=calc(var(--radius)-4px)`. La composición usa también radios utilitarios existentes, no radios nuevos por pantalla. | `src/index.css`; `tailwind.config.ts`; `src/components/ui/input.tsx`. |
| Bordes y foco | `border`, `border-strong`, `input` y `ring` semánticos; inputs actuales exponen foco visible con ring de 2px. | `src/index.css`; `src/components/ui/input.tsx`; `src/components/ui/button.tsx`. |
| Sombras | `--shadow-xs/sm/md/lg` apuntan al mismo `--shadow-modern`; no simular una escala de elevación nueva. | `src/index.css`; `src/components/common/DataCard.tsx`, `StatCard.tsx`. |
| Espaciado | Escala Tailwind estándar en incrementos de 0.25rem, usada en page/container, cards y formularios (`gap-4`, `p-4`, `p-5`, `md:p-6`). CRM describe un grid base de 4px; la escala es compatible, pero su token `--lpd-space-*` no se verifica en el código activo. | `tailwind.config.ts`; `src/components/common/PageContainer.tsx`, `FormSection.tsx`; discrepancia en `CRM_UI_COMPONENT_PROTOCOL.md`. |
| Primitivas | Input, Select, Textarea, Checkbox, Button, Alert, Tabs, Dialog/Sheet; common `PageContainer`, `PageHeader`, `DataCard`, `StatCard`, `DataTable`, `EmptyState`, `LoadingState`, `StatusBadge`, `SearchInput`, `AppDrawer`, `FormSection` y `FormSectionHeader`. | `docs/03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md`, barrels `src/components/common/index.ts` y `src/components/ui/`, y usos en `ProductCatalog.tsx`, `Overview.tsx`, `ContactForm.tsx`. |
| Formularios compartidos | `Form`, `FormField`, `FormControl`, `FormMessage` (React Hook Form), `FormSection`, `FormSectionNav`, `AppDrawer`, lifecycle dirty/discard y foco restaurado existen. `ContactForm` los compone y tests verifican validación, error, descarte y foco. | `src/components/ui/form.tsx`, `FormSection.tsx`, `FormSectionNav.tsx`, `ContactForm.tsx`, `ContactFormDrawer.tsx`; `src/test/crm/contacts/contacts-form.test.tsx`, `src/test/platform/app-drawer.test.tsx`. |
| CRM density | `DataTable` ofrece `compact` (default) y `comfortable`; no existe la opción `spacious` en su tipo actual. El protocolo CRM enumera tres niveles y tipografía distinta a la fuente activa. | `src/components/common/DataTable.tsx`; discrepancia anotada en `CRM_UI_COMPONENT_PROTOCOL.md`. |
| Breakpoints | `xs=400px`, `md=768px`, `nav=1200px`, `2xl=1400px`; el shell móvil usa drawer bajo `md`, mini-sidebar entre `md` y `nav`, y navegación amplia desde `nav`. | `tailwind.config.ts`; `PLATFORM_V2_SHELL_REFERENCE.md`; `src/components/layout/AppShell.tsx`. |

### Instantánea de tokens light usada por los SVG

Los SVG refieren estos valores por nombre semántico (`var(--...)`); la
instantánea coincide con `:root` en `src/index.css`. No se introducen colores
de marca ni una paleta local alternativa.

| Token | Valor HSL de fuente | Uso en la composición |
|---|---|---|
| `background` / `foreground` | `220 30% 98.8%` / `222 32% 11%` | Canvas y texto principal. |
| `card` / `card-muted` | `0 0% 100%` / `220 26% 97.6%` | Superficies elevadas y áreas de baja jerarquía. |
| `primary` / `primary-soft` | `234 80% 58%` / `234 92% 96.5%` | Acciones primarias y tintes de iconos/selección. |
| `muted` / `muted-foreground` | `220 20% 96%` / `222 12% 46%` | Controles secundarios, fondos suaves y texto auxiliar. |
| `accent` / `gold` | `158 70% 42%` / `38 92% 52%` | Acentos de datos existentes, sin asignar significado nuevo. |
| `success` / `warning` / `info` / `destructive` | `158 70% 40%` / `36 96% 52%` / `210 92% 52%` / `350 78% 56%` | Estados semánticos, acompañados por etiqueta textual. |
| `border` / `border-strong` | `220 22% 92%` / `220 20% 85%` | Divisores y borde de inputs. |
| `sidebar-background` / `sidebar-foreground` | `0 0% 100%` / `222 18% 32%` | Sidebar integrado en tema claro. |
| `sidebar-accent` / `sidebar-accent-foreground` | `220 22% 96%` / `222 28% 16%` | Grupo ERP expandido y ruta activa; no se usa `primary` para simular el estado activo. |

`SurfaceCard` aplica `border-0 bg-card` y `--shadow-modern`; `StatCard` añade
su franja superior, y `DataCard` usa un divisor de borde en la cabecera. Los
SVG aproximan la sombra del primitive mediante `feDropShadow`. El sidebar y la
ruta activa siguen `Sidebar.tsx`; el overlay del drawer sigue `SheetOverlay`
en `src/components/ui/sheet.tsx`. Evidencia: `src/index.css`,
`src/components/common/SurfaceCard.tsx`, `StatCard.tsx`, `DataCard.tsx`,
`src/components/layout/Sidebar.tsx` y `packages/contracts/src/navigation.ts`.

### Auditoría de formularios ERP y diferencias de fuente

| Hallazgo observado | Evidencia | Decisión visual / riesgo |
|---|---|---|
| El formulario de la página Products legacy usa `AppDrawer`, inputs/selects compartidos, `FormSectionHeader` y `useState`; no consume el runtime RHF `Form`/`FormField` ni `FormSection` usado por `ContactForm`. | `ProductCatalog.tsx` (`CatalogDrawer`, `ItemDrawer`, `CatalogCommercialManager`) frente a `ContactForm.tsx`. | Componer el formulario objetivo de Productos con los primitives actuales y el patrón compartido de lifecycle. No declarar la implementación actual convergida solo porque lo diga `PRODUCT_CATALOG_GLOBAL_TRACK.md`. Reconciliar esa documentación al plan/build. |
| La página comercial contiene un `<select>` HTML nativo para escoger Price Book. | `ProductCatalog.tsx`, rama `section === "priceBooks"`. | El wireframe usa el `Select` LoopDev accesible; reemplazar el control nativo en una futura tarea de implementación. No crear otro selector. |
| El detalle repite dos veces la sección “Participants and eligibility”. | `CatalogItemDetailDrawer` en `ProductCatalog.tsx`. | El objetivo muestra una sola sección; la duplicación es deuda visual detectada, no una característica que se apruebe. |
| El drawer de detalle declara `mode="Editing"` aunque muestra datos de solo lectura; la gestión abre otro `AppDrawer` encima. | `CatalogItemDetailDrawer` y `CatalogCommercialManager` en `ProductCatalog.tsx`. | La composición objetivo identifica detalle como `Read-only` y evita overlays anidados: un único drawer con navegación interna a “Manage”. Requiere aprobación conceptual por cambiar interacción. |
| La página Overview consulta OrganizationCatalog sin estado explícito de loading/error; la página Products legacy sí contiene estados de carga/error. | `Overview.tsx` y `ProductCatalog.tsx`. | Los estados requeridos se especifican en la matriz; el overview debe consumir `LoadingState`/`DataCard`/`Alert` con recuperación explícita, sin representar errores como cero ni presentar conteos de catálogos como conteos de productos. |
| `DataTable` filtra/ordena/pagina un dataset completo en cliente; no ofrece contrato de cursor remoto. | `src/components/common/DataTable.tsx`. | Reutilización directa para la fuente local actual. No inferir que resuelve la paginación futura; decidir extensión de Platform tras aprobar API/dataset remoto. |
| No se encontraron tests de página/formulario de `ProductCatalog`; sí hay test de adapter del catálogo y tests form/drawer de CRM. | `src/test/catalog/catalog-adapter.test.ts`; búsqueda en `src/test/`. | Los wireframes son concepto, no evidencia de comportamiento ERP. Incluir pruebas de renderer/estados como trabajo de build/verify. |

## Vistas y wireframes

### ERP Overview — `VIS-ERP-VIEW-01`

Usa el `PageHeader` actual con una acción primaria “Gestionar productos”,
seguido de métricas de productos/servicios y dos `DataCard` (“Base de
Productos” y “Registros recientes”). En móvil los KPI y tarjetas se apilan en
una columna; la acción permanece visible sin competir con el título. El empty
state ofrece “Crear producto o servicio”. El wireframe representa el objetivo
de agregar productos a nivel de organización, aunque los registros legacy hoy
estén separados por `OrganizationCatalog`; usa solo datos ficticios y no
afirma que el Overview actual ya lo provea. No se añade gráfico o métrica de
ventas sin contrato/datos aprobados.

**Evidencia:** [wireframe desktop y mobile](wireframes/erp-overview.svg).
**Estado actual:** la página real consulta `OrganizationCatalog`, no una lista
de productos agregada; tampoco representa loading/error correctamente. El
wireframe de éxito no da esos comportamientos por implementados.

![ERP Overview en desktop y mobile](wireframes/erp-overview.svg)

### Productos — lista principal

La ruta del módulo abre directamente una lista unificada de productos y
servicios: no hay paso previo por un índice de catálogos. En desktop, el
`PageHeader`, las acciones “Nuevo producto” y “Categorías” (“Gestionar” en
móvil), la
búsqueda y los filtros de clase y categoría preceden a `DataTable` en densidad
`compact`. La acción “Categorías” abre una vista dedicada dentro de Productos;
“Volver a Productos” regresa a la lista sin drawer anidado. Acciones de fila y bulk
se mantienen en menús/selection-bar compartidos. En móvil, cada registro se
presenta como tarjeta con las mismas acciones; no se exige scroll horizontal
para acceder a nombre, SKU, clase, categoría y estado. No se incluyen los
semielaborados. No se muestra filtro por agrupación: `OrganizationCatalog` es
solo origen de migración y no una frontera del listado destino.

**Evidencia:** [wireframe desktop y mobile](wireframes/erp-products.svg).
**Alcance:** la paginación mostrada es conceptual; el adapter actual carga
artículos por `catalogId`. Agregación entre grupos y paginación remota requieren
contrato y no se declaran soportadas.

![Lista de Productos en desktop y mobile](wireframes/erp-products.svg)

### Gestión del árbol de categorías — `VIS-ERP-VIEW-06`

La gestión abre como vista dedicada dentro de Productos, decisión confirmada
por el Product Owner (`VD-ERP-013`). En desktop se muestran el árbol y el
detalle de la categoría seleccionada en paralelo: la jerarquía se conserva
mediante indentación y conectores, y las cantidades se presentan como texto
además de cualquier tratamiento visual. La cabecera ofrece retorno explícito a
Productos y creación de categoría; la selección expone acciones de edición y
creación de subcategoría. No se dibuja borrado físico ni se fija una regla de
reparentado: el ciclo de vida y el comportamiento de categorías en uso quedan
para `02-domain`.

En mobile web el árbol y el detalle se apilan, mantienen el mismo contexto de
selección y usan controles de al menos 44×44 px; no se requiere scroll
horizontal. El retorno a Productos es visible. La búsqueda y la jerarquía
mantienen nombres y contadores textuales para lectores de pantalla; el foco
debe volver al elemento que abrió una edición y el nombre de la categoría
seleccionada debe anunciarse al cambiar la selección. La ruta concreta y la
preservación de filtros/drafts al volver se validan al definir navegación y
dominio; el wireframe no afirma implementación. Los contadores son datos
ficticios y muestran asignaciones directas; no definen si en el producto final
se agregarán asignaciones de descendientes.

**Evidencia:** [wireframe desktop y mobile](wireframes/erp-product-categories.svg).
**Estados:** loading, empty, error, forbidden, conflict, offline, pending y
success están especificados en `view-state-matrix.md`; el SVG representa el
estado success conceptual.

### Crear / editar producto o servicio — `VIS-ERP-FLOW-04`

La superficie usa `AppDrawer` `xl`, tamaño completo en móvil, cabecera breve
con contexto/mode/dirty state, sección visible con `FormSection` y footer
sticky con Cancelar/Guardar. El contenido se agrupa según clase:
identidad/clasificación, detalles y usos operativos, precios/comercialización,
distribución y, para artículos físicos, atributos como SKU, barcode, material
y dimensiones. El selector de clase/categoría/abastecimiento usa
`Select`/`Combobox`; los usos de compra, venta y control de inventario usan
`Checkbox` independientes. El abastecimiento (comprar, fabricar o ambos) se
define en el producto; las variantes heredan la regla y cada variante que se
gestione por separado tiene su propio SKU. Los demás atributos no crean
variantes. No se diseña ejecución de fabricación en este alcance.
Validación aparece junto al campo y en un resumen enfocable, sin depender de
color. El formulario móvil es de una columna.

El patrón de `ContactForm` demuestra primitives y comportamientos reutilizables,
no que el formulario ERP actual ya los use. El wireframe no presupone los
incrementos pendientes del sistema global (sticky section nav, conteo de
progreso o resumen automático de errores) hasta que tengan evidencia de
implementación.

**Evidencia:** [wireframe desktop y mobile](wireframes/erp-product-form.svg).
**Ejemplo ficticio:** “Arnés Trail”, `MC-ARN-042`, EUR 24,90; no representa un
registro real de MiauCraft.

![Formulario de producto o servicio en desktop y mobile](wireframes/erp-product-form.svg)

### Detalle y configuración comercial — `VIS-ERP-FLOW-05`

El detalle conserva identidad, clase, categoría, usos, regla de abastecimiento,
estado, disponibilidad y configuración comercial; `Offers`, `Variants` y
`Price books` se muestran una sola vez. La regla de abastecimiento heredada
por variantes se presenta como información del maestro, no como control de
inventario o ejecución de fabricación.
“Manage” cambia la vista dentro del mismo drawer, con navegación de regreso y
tabs/secciones internas, evitando un segundo modal/drawer apilado. La gestión
mantiene inputs/Select compartidos, confirmación destructiva y error accesible.
No se agregan integraciones Shopify, inventario, stock o pedidos a esta vista.

**Evidencia:** [wireframe desktop y mobile](wireframes/erp-commercial-detail.svg).
**Decisión abierta:** aprobar o corregir el patrón de drawer único antes de
usar esta composición como base de implementación.

![Detalle y configuración comercial en desktop y mobile](wireframes/erp-commercial-detail.svg)

## Estados visuales y recuperación

La matriz normativa está en [`view-state-matrix.md`](view-state-matrix.md).
Los estados deben mostrar texto e iconografía/contexto además del color. Se
reutilizan `LoadingState`, `DataCard` (skeleton/empty/error), `EmptyState`,
`Alert`, `StatusBadge` y feedback de botón. Un estado de permiso denegado nunca
se presenta como una lista vacía; un conflicto conserva el draft y expone la
acción de recargar/comparar cuando el contrato futuro lo permita. Offline y
“pendiente de sincronizar” son estados de diseño para el adapter futuro y no
afirman que exista sync hoy.

## Responsive y multiplataforma

| Viewport | Composición | Interacción | Evidencia |
|---|---|---|---|
| `>=1200px` | Shell con navegación amplia o colapsada; overview con KPI en tres columnas y dos zonas; lista de productos tabular; drawer lateral. | Teclado completo, hover solo como ayuda, acciones por menú y foco retenido/restaurado. | `PLATFORM_V2_SHELL_REFERENCE.md`, `tailwind.config.ts`, wireframes. |
| `768–1199px` | Shell mini-sidebar; grillas se reducen; formularios siguen en una columna cuando la superficie no da ancho suficiente. | No reducir hit-area para salvar densidad; filtros pueden pasar a una segunda fila. | Shell (`md` a `nav`) y wireframes como propuesta. |
| `<768px` | Sidebar como drawer; una columna; artículo como card; formulario y detalle como drawer/full-screen; footer fijo dentro de superficie sin cubrir el último campo. | Área objetivo mínima 44×44 CSS px para acciones táctiles; mismo significado, acciones críticas visibles; back cierra detalle o vuelve a lista según ruta. | `PLATFORM_V2_SHELL_REFERENCE.md`; wireframes; comportamiento ERP requiere prueba. |
| iOS / Android | Sin composición nativa aprobada; no diseñar ni afirmar clientes. | Mantener contratos semánticos compartidos; definir safe areas/gestos/owner si se aprueba cliente nativo. | Scope `planned`; decisión abierta VD-ERP-005. |

## Accesibilidad e internacionalización

- **Teclado:** orden de foco de breadcrumb → título/acción → filtros → lista → paginación; `Enter` abre un producto/servicio y `Escape` cierra la superficie superior. Una tarjeta clicable no contiene botones clicables anidados. Las tablas exponen encabezados, sort y acciones con nombre accesible.
- **Drawer y formularios:** usar `AppDrawer`/Sheet para portal, foco atrapado por la primitiva, Escape y restauración de foco al opener; confirmar descarte si `dirty`. Cada control tiene label visible; `aria-invalid`/`aria-describedby` vinculan error y descripción. El resumen de errores recibe foco tras submit inválido, si se implementa.
- **Screen reader:** loading `role=status`/`aria-live=polite`; errors con `role=alert`; empty con texto accionable; estado de sync/pending con copy explícito. Badges incluyen palabras (`Active`, `Draft`, `Archived`) y no solo puntos/color.
- **Contraste:** usar tokens semánticos con light/dark; validar contraste WCAG 2.2 AA para texto, iconos/estados y focus ring en runtime. Esta auditoría no midió valores de contraste ni afirma aprobación.
- **Touch:** controles funcionales tienen 44×44 CSS px en móvil, mediante la composición/área táctil si el primitive compacto es menor. `Input` actual tiene 40px y el botón puede ser menor; la aceptación visual debe comprobar la hit-area real.
- **Movimiento:** reducir/desactivar lift, shimmer y desplazamientos cuando `prefers-reduced-motion`; estados no dependen de animación.
- **i18n / RTL:** strings pasan por `useT`; formatos numéricos, fecha y moneda usan locale/tenant, con ejemplo `es-ES`. Usar propiedades lógicas (`start/end`, `ps/pe`) y comprobar que tablas/botones conservan orden semántico en RTL.

## Reutilización Rivera / LoopDev

| Necesidad | Primitiva/componente verificado | Decisión | Evidencia |
|---|---|---|---|
| Shell, navegación y fallback | `AppShell`, `LoopdevSidebar`, `LoopdevRoutes`, `RouteFallback` | `REUSE`; no crear shell ERP ni rutas paralelas. | `PLATFORM_V2_SHELL_REFERENCE.md`, `src/routes/LoopdevRoutes.tsx`. |
| Ancho y encabezado | `PageContainer`, `PageHeader`, `AppBreadcrumbs` | `REUSE`; `wide` para overview/lista y `narrow` solo para estados focales. | Implementaciones en `src/components/common/`; uso actual Overview/ProductCatalog. |
| KPI y superficies | `StatCard`, `DataCard`, `SurfaceCard` | `REUSE`; no añadir charts hasta aprobar métricas/datos. | `Overview.tsx`, `StatCard.tsx`, `DataCard.tsx`. |
| Registro de producto/servicio | `DataTable`, `StatusBadge`, `SurfaceCard` | `REUSE` para tabla/estado/superficie; campos y acciones de producto son `MODULE_SPECIFIC`. | `DataTable.tsx`, `StatusBadge.tsx`, `SurfaceCard.tsx`; la página legacy construye la lista inline. |
| Búsqueda, filtros y tabla | `SearchInput`, `Select`, `DataTable`, `TablePagination`, `BulkSelectionBar` | `REUSE` para el adapter local; anotar contrato solo-client y no prometer cursor remoto. | `ProductCatalog.tsx`, `DataTable.tsx`, `SearchInput.tsx`. |
| Detalle/edición | `AppDrawer`, `ConfirmDialog`, `FormSection`, `FormSectionHeader`, `FormSectionNav` | `REUSE`; evitar overlay anidado y reusar lifecycle/focus/dirty. | `AppDrawer.tsx`; tests `app-drawer.test.tsx`; patrón `ContactFormDrawer.tsx`. |
| Campos de formulario | `Form`, `FormField`, `FormControl`, `FormLabel`, `FormMessage`, `Input`, `Select`, `Textarea`, `Checkbox` | `REUSE`; field sets y validaciones de producto/servicio son `MODULE_SPECIFIC`. La página actual aún usa estado local en vez del patrón RHF. | `src/components/ui/form.tsx`, `ProductCatalog.tsx`, `ContactForm.tsx`. |
| Carga, empty y error | `LoadingState`, `EmptyState`, `DataCard`, `Alert` | `REUSE`; overview necesita estados explícitos; forbidden/conflict se componen con semántica textual. No crear estado paralelo. | `LoadingState.tsx`, `EmptyState.tsx`, `DataCard.tsx`, `ui/alert.tsx`. |
| Notes, Files, Activity y Tasks en futuros workspaces ERP | Capacidades Platform existentes | `REUSE` cuando un módulo aprobado las consuma; prohibido crear editores/uploaders/feed/timeline de ERP en paralelo. No forman una zona de estas vistas actuales. | `PLATFORM_V2_UI_REFERENCE.md`, barrels Platform/Files y contratos compartidos. |
| Campos de oferta, variante y price book | Contratos técnicos actuales del catálogo y primitives anteriores | `MODULE_SPECIFIC`; mantenerlos bajo Products, no dentro de formularios genéricos de Platform. | `src/loopdev/domains/catalog/`, adapter tests y `CatalogCommercialManager`. |
| Selector de Price Book | `Select` LoopDev | `REUSE`; el `<select>` nativo actual es una divergencia a corregir, no otro primitive a conservar. | `ProductCatalog.tsx` línea del bloque “Price entries”; directriz visual Rivera. |

### Matriz por zona

| Zona | Clasificación | Primitiva o contrato | Owner | Motivo | Evidencia |
|---|---|---|---|---|---|
| Shell, topbar, sidebar, skip-link | `shared` | `AppShell`, `Sidebar`, `Topbar`, rutas LoopDev | Platform | El ERP vive dentro del shell autenticado; no replica navegación. | `PLATFORM_V2_SHELL_REFERENCE.md`. |
| Breadcrumb, encabezado, contenedor | `shared` | `PageHeader`, `AppBreadcrumbs`, `PageContainer` | Platform | Jerarquía y ancho comunes a páginas. | `Overview.tsx`, `ProductCatalog.tsx`. |
| KPI de overview | `shared` | `StatCard` | Platform | Cards de métrica con skeleton y tonos existentes. | `StatCard.tsx`; Overview actual. |
| Fundación y preparación | `shared` | `DataCard`, `EmptyState`, `Alert` | Platform | Superficies/estados genéricos; los mensajes/datos ERP los aporta la suite. | `DataCard.tsx`, `EmptyState.tsx`, `Overview.tsx`. |
| Toolbar/filtros | `shared` | `SearchInput`, `Select`, `Button` | Platform | Controles de búsqueda/filtro usados por listas; no crear filtros nativos. | `ProductCatalog.tsx`; `src/components/common`. |
| Fila de producto/servicio | `shared` | `DataTable`, `StatusBadge` | Platform | Tabla, orden local, selección/acciones y densidad compacta; datos y columnas ERP. | `DataTable.tsx`, route legacy de Products. |
| Card de producto/servicio móvil | `MODULE_SPECIFIC` | Componer `SurfaceCard`/`ClickableSurfaceCard` | ERP Products | La lista móvil conserva campos relevantes sin forzar tabla horizontal; no existe API de row-card genérica verificada. | Wireframe `erp-products.svg`; decisión conceptual pendiente. |
| Drawer y confirmación | `shared` | `AppDrawer`, `ConfirmDialog` | Platform | Foco, scroll, dirty-close y surface responsive centralizados. | Implementación y `app-drawer.test.tsx`. |
| Secciones y navegación de formulario | `shared` | `FormSection`, `FormSectionHeader`, `FormSectionNav` | Platform | Jerarquía común; usar solo capacidades verificadas, sin asumir backlog futuro. | Implementación; `ContactFormDrawer.tsx`. |
| Campos y validación ERP | `MODULE_SPECIFIC` | RHF `Form*` + primitives UI actuales | ERP Products (campos); Platform (primitives) | Identidad, atributos, precio y canales son reglas de producto; no justifican copiar controles. | `ContactForm.tsx`, `ProductCatalog.tsx`, contratos legacy catalog. |
| Tabs, precio/oferta/variante | `MODULE_SPECIFIC` | Contrato técnico actual + `Tabs`/`Select` UI | ERP Products | Composición y validación comercial pertenecen al módulo Productos. | `CatalogCommercialManager`; `src/loopdev/domains/catalog`. |
| Alertas de error, conflict y forbidden | `shared` | `Alert`, `DataCard`, `EmptyState` | Platform | Reusar semántica común; mensaje/recuperación dependen de la operación. | `ui/alert.tsx`, `DataCard.tsx`. |
| Notes, Files, Activity, Tasks | `shared` | Barrels Platform y Files | Platform | Futuras vistas de registro consumirán la capacidad; esta fase no crea widget ERP duplicado. | `PLATFORM_V2_UI_REFERENCE.md`. |

No se propone crear primitivas globales nuevas en este gate. Las composiciones
específicas de inventario, pedidos, compras o conexión de canales quedan
`BLOCKED` hasta que el Product Owner apruebe módulos y flujos.

## Decisiones confirmadas

| ID | Decisión | Evidencia | Consecuencia |
|---|---|---|---|
| VD-ERP-FONT-001 | La tipografía oficial de LoopDev es Inter para UI y JetBrains Mono para datos técnicos. | Confirmación explícita de @loopdev-io y `docs/06-product/crm/CRM_UI_COMPONENT_PROTOCOL.md`. | Los cinco wireframes usan Inter/JetBrains Mono. El runtime todavía carga Geist/Geist Mono; se registra como drift de Platform y no se corrige parcialmente dentro de ERP. |
| VD-ERP-REUSE-001 | Reutilizar el Shell, tokens de color, superficies y primitives actuales; no importar páginas ni lógica de Rivera ni abrir un sistema paralelo. | `PLATFORM_V2_UI_REFERENCE.md`, `PLATFORM_V2_SHELL_REFERENCE.md` y código/tests citados arriba. | El cambio visual mantiene la composición y controles compartidos; las reglas comerciales pertenecen al módulo Products. |
| ERP-DEC-005 | El maestro de Productos distingue terminados, materias primas/componentes y servicios; usos de compra/venta/inventario son independientes; cada producto tiene categoría principal jerárquica; terminados permiten buy/make/both, materias primas/componentes solo buy por ahora y servicios no tienen sourcing; las variantes heredan el sourcing de su producto con SKU propio. Los semielaborados esperan a Fabricación. | Confirmación de @loopdev-io y `CR-ERP-PRODUCT-MASTER-MODEL`; decisiones posteriores registradas en `domain-model.md`. | La lista filtra por clase/categoría; formulario y detalle muestran clase, categoría, usos y abastecimiento solo cuando aplica, sin implicar capacidades de inventario o fabricación implementadas. |
| VD-ERP-013 | La gestión del árbol de categorías usa una vista dedicada dentro de Productos con retorno visible a la lista. | Confirmación explícita de @loopdev-io: “Vista dedicada dentro de Productos, con retorno a la lista (Recomendado)”. | Se wireframea árbol y detalle en paralelo en desktop y apilados en mobile web; no se crean drawers anidados. |

## Validación en dos niveles

### Aprobación conceptual — antes de implementación

- **Alcance y jerarquía:** revisar que la fuente visual cubre solo rutas actuales y que no convierte ventas/compras/inventario/Shopify en MVP.
- **Composición:** revisar cards, tabla móvil, formulario en drawer y la propuesta de evitar drawers anidados.
- **Estados y recuperación:** revisar loading, empty, error, forbidden, conflict, offline, pending y success por superficie en `view-state-matrix.md`.
- **Reuso:** revisar inventario de fuentes, zonas y hallazgos (selector nativo, duplicación de sección, modo de drawer, falta de loading/error en Overview y discrepancia de formularios).
- **Responsive/accesibilidad:** revisar navegación, target táctil, foco, contraste, lectura no-color e i18n/RTL.
- **Aprobador/fecha/decisión/evidencia:** @loopdev-io aprobó el gate visual conceptual el 2026-10-24; evidencia y fingerprint están en `01-visual-design.json`. La comparación visual de runtime sigue `NOT_RUN`.

### Comparación runtime — después de implementación

- **Rutas/viewport:** `/app/erp/overview` y la futura `/app/erp/products` (lista, detalle y formularios) en desktop >=1200px, tablet 768–1199px y móvil <768px, tema light/dark; comparar también la redirección desde `/app/erp/product-catalog`.
- **Capturas y diff:** no existen aún; runtime no iniciado.
- **Comparación con esta fuente:** `NOT_RUN` hasta implementación aprobada.
- **Desviaciones:** registrar cada diferencia con aprobación/owner antes de cerrar `08-verify`.
- **Estado:** `NOT_RUN`.

## Decisiones abiertas

| ID | Decisión | Owner | Default propuesto | Impacto | Aprobación necesaria |
|---|---|---|---|---|---|
| VD-ERP-001 | Qué módulos integran el primer release ERP transversal (`ERP-OD-006`). | Product Owner (@loopdev-io) | Limitar esta fuente visual a overview + Products; no dibujar módulos candidatos como aprobados. | Determina las próximas vistas y si MiauCraft activa capacidades de canal/inventario/órdenes. | Confirmar el alcance para cada módulo antes de ampliar wireframes o aprobar un plan. |
| VD-ERP-002 | Detalle + configuración comercial: ¿un drawer con navegación interna o se acepta overlay anidado? | Product Owner + Platform | Un `AppDrawer`; “Manage” cambia el contenido y ofrece volver al detalle. | Evita doble trap/stack de foco, reduce confusión en mobile. | Aprobar el patrón de drawer único o indicar alternativa. |
| VD-ERP-003 | ¿Se aprueba la tarjeta móvil de artículo en vez de la tabla horizontal? | Product Owner + Platform | Card por artículo en móvil; la misma operación/semántica que la tabla desktop. | Afecta densidad y paridad de operaciones móviles; no cambia el modelo. | Aprobar diseño responsivo y exigir tests de operación en mobile web. |
| VD-ERP-004 | ¿La paginación remota requerirá extensión del `DataTable` cuando exista API? | Platform + ERP | Mantener uso local actual; no decidir extensión ni afirmar soporte remoto en el gate visual. | Dataset grande y cursor remoto pueden requerir otro contrato compartido. | Resolver junto con API y pruebas de cursor, no bloquear la composición visual actual. |
| VD-ERP-005 | Aplicabilidad/owner de iOS y Android. | Product Owner + Platform | Ambas permanecen `planned`, sin wireframes nativos ni claim de paridad. | Define scope nativo, safe areas, navegación y evidencia. | Asignar owner y decidir aplicabilidad antes de plan/build multiplataforma. |
| VD-ERP-006 | Convergencia de formularios de producto/servicio con contrato global y documentación de estado. | Platform + ERP | Consumir `Form`/`FormSection`/lifecycle actuales; no crear nuevos primitives; revisar contra la fase global pendiente. | Reduce divergencia entre Products y CRM; requiere tests del formulario ERP. | Confirmar estándar de adopción y reconciliar `PRODUCT_CATALOG_GLOBAL_TRACK.md` con fuente. |
| VD-ERP-007 | ¿Cuándo y dónde se migra el runtime compartido de Geist/Geist Mono a la tipografía oficial Inter/JetBrains Mono? | Platform | Alinear `index.html`, Tailwind y `src/index.css` en una tarea transversal antes de que ERP dependa de la tipografía aprobada. | El cambio afecta todas las suites y la comparación visual; una migración solo en ERP crearía inconsistencias. | Asignar owner/prioridad y aprobar el cambio global en el plan Platform; este gate no altera producción. |
| VD-ERP-008 | Locale/moneda del primer cliente y formatos de precio. | Product Owner + MiauCraft owner | Fixtures ficticios `es-ES/EUR`; configuración real procede de datos de organización y queda abierta. | Labels, formato de precio/impuesto y mercados. | Confirmar mercados/monedas antes de diseñar flujos de venta o impuestos. |
| VD-ERP-009 | ¿Cuál es la ubicación canónica del sistema visual normativo? El protocolo CRM enlaza `docs/01-foundations/VISUAL_COMPOSITION_SYSTEM.md` y `docs/02-frontend/COMPONENT_COMPOSITION_PROTOCOL.md`, que no existen en este checkout. | Platform | Mantener Inter/JetBrains como decisión confirmada por el Product Owner y CRM protocol; no inferir reglas ausentes de esos enlaces. | Los demás valores visuales deben basarse en fuente actual hasta que haya fuente canónica localizada. | Corregir los enlaces o identificar la fuente oficial antes de una migración global de tokens/typography. |
| VD-ERP-010 | ¿Dónde viven locale y canales que estaban en `OrganizationCatalog`? (`ERP-OD-008`). | Product Owner + ERP/Platform | La moneda comercial pertenece a cada `PriceBook`; la agrupación es solo legado de migración. Preservar locale/canales hasta asignar owners destino. | Afecta precios, ofertas, canales y migración de datos; no debe perderse información actual. | Asignar locale/canales en `02-domain`/`04-api`; retirar/migrar `Offer.currency` según la decisión confirmada `DOM-ERP-018`. |
| VD-ERP-011 | ¿Se aprueba `/app/erp/products` como ruta canónica y la redirección de deep links legacy? | Product Owner + Platform | Mantener `/app/erp/product-catalog` temporalmente y redirigir a la lista Products. Un `catalogId` legado no debe convertirse en filtro del modelo destino; definir una transición compatible sin preservar la agrupación como frontera de negocio. | Afecta navegación, refresh, bookmarks, acceso directo, CRM links y mobile back. | Confirmar destino, tratamiento de query/deep-link legacy y duración de compatibilidad antes del build. |
| VD-ERP-012 | ¿Las variantes heredan la categoría principal del producto y carecen de una categoría propia? (`ERP-A-003`). | Product Owner + ERP domain | Resuelto: el producto base tiene categoría general; cada variante/SKU tiene categoría propia; un borrador puede omitirla, pero se exige antes de activar. | Determina el ownership del dato y requiere que la edición de categorías contemple tanto el producto base como los SKU. | Actualizar el diseño de formularios/listas de variantes en la fase de plan; el wireframe aprobado no evidencia todavía esa interacción. |
## Handoff

- **Requisitos visuales listos para revisión:** cinco vistas/flows wireframeados (overview, lista Products, gestión de categorías, formulario y detalle); la lista Products es la entrada directa y no existe un paso visual por índice de catálogos. Los wireframes reflejan las clases, usos, categorías y abastecimiento confirmados, incluidos ambos patrones responsive para la gestión del árbol. Estados, reuso, compatibilidad legacy y gaps de evidencia están documentados.
- **Decisiones visuales confirmadas:** `VD-ERP-013` y aprobación conceptual del conjunto por @loopdev-io el 2026-10-24. `VD-ERP-012` se resolvió en la fase de dominio; las preguntas abiertas VD-ERP-001 a VD-ERP-011 quedan registradas para sus fases correspondientes.
- **Riesgos/dependencias:** agregación de productos entre grupos legacy sin contrato; route migration; selector nativo y drawers apilados en la página actual; sección duplicada; Overview sin loading/error; divergencia de formularios; tabla cliente-only; scope ERP de primer release sin decidir.
- **Preguntas abiertas:** VD-ERP-001 a VD-ERP-011.
- **Estado:** `complete` — cinco vistas y estados responsive documentados; aprobación conceptual registrada. El análisis especializado `02-domain`–`05-sync` está completado con pendientes explícitos. La comparación visual de runtime permanece `NOT_RUN`; no iniciar `module-plan` hasta resolver los bloqueos documentados.
