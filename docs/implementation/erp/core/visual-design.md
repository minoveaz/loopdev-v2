# ERP Core — Diseño visual

> **Fuente visual normativa del gate `01-visual-design`.** Los SVG son evidencia
> revisable, no una especificación de implementación. La aprobación anterior
> cubría el formulario en drawer; el Product Owner aprobó sustituirlo por
> páginas completas y añadir coste de compra de referencia. @loopdev-io
> aprobó conceptualmente esta revisión el 2026-10-24; la comparación de runtime
> sigue pendiente.

## Entradas y aprobación

- Definición funcional: [`design.md`](design.md), aprobada con las enmiendas `CR-ERP-PRODUCTS-MODULE`, `CR-ERP-PRODUCT-MASTER-MODEL` y `CR-ERP-PRODUCTS-FIRST-RELEASE`.
- Arquitectura: [`architecture-design.md`](architecture-design.md), aprobada para el gate visual, con la misma enmienda registrada.
- Contrato multiplataforma: [`MULTIPLATFORM_DELIVERY_CONTRACT.md`](../../../03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md).
- Fuentes de componentes y shell: [`PLATFORM_V2_UI_REFERENCE.md`](../../../03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md), [`PLATFORM_V2_SHELL_REFERENCE.md`](../../../03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md).
- Decisión de alcance visual: el módulo visible se llama **Productos**. El runtime actual sigue usando la ruta legacy `/app/erp/product-catalog`; la ruta canónica `/app/erp/products` es una propuesta de migración, no runtime existente. Ventas, compras, inventario, finanzas e integraciones siguen propuestas; no se representan como MVP aprobado.
- Composiciones revisables: [overview](wireframes/erp-overview.svg), [lista de Productos](wireframes/erp-products.svg), [edición completa de producto](wireframes/erp-product-form-page.svg), [edición completa de SKU](wireframes/erp-sku-editor-page.svg), [ficha completa de producto](wireframes/erp-product-record-page.svg), [alta rápida de referencias](wireframes/erp-reference-quick-drawer.svg), [gestión de categorías](wireframes/erp-product-categories.svg) y [detalle comercial secundario](wireframes/erp-commercial-detail.svg). El índice de catálogos no es la entrada del módulo.
- Estado de aprobación conceptual de esta revisión: `approved` el 2026-10-24. @loopdev-io confirmó que la decisión de páginas completas y el coste de referencia bastan para aprobar conceptualmente las composiciones actualizadas y pasar al plan mínimo. Comparación de runtime: `NOT_RUN`.

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
implementación aprobada. El Product Owner aprobó posteriormente el conjunto
visual completo el 2026-10-24; ese registro prevalece sobre la nota de revisión
inicial de esta sección.

## Alcance visual confirmado y límites

| Clasificación | Alcance |
|---|---|
| Confirmado | ERP transversal para pymes; **Products** y categorías son el primer release en desktop/mobile web. Su lista unificada de productos/servicios es la entrada de trabajo, sin índice previo de catálogos. El maestro distingue terminados, materias primas/componentes y servicios; clase, compra, venta y control de inventario son dimensiones independientes. El producto base tiene una categoría principal y cada SKU variante una categoría propia; el abastecimiento se hereda en las variantes. La creación, edición y ficha de producto/SKU usan páginas completas. |
| Confirmado por @loopdev-io | Incluir coste de compra unitario de referencia por producto/SKU, no contable. No es valoración de inventario, coste de fabricación ni margen. |
| Confirmado por @loopdev-io | Usar drawers solo para altas/ediciones rápidas de datos auxiliares; la gestión completa del árbol de categorías sigue en una vista dedicada. |
| Confirmado por fuente | `/app/erp/overview`, `/app/erp/product-catalog` y `/app/erp/product-catalog/:catalogId` siguen siendo rutas runtime legacy; la navegación y el contenido real se confirman en `src/routes/LoopdevRoutes.tsx`, `src/loopdev/pages/erp/Overview.tsx` y `ProductCatalog.tsx`. |
| Propuesta para build | `/app/erp/products` como ruta canónica; mantener un redirect/compatibilidad para las rutas legacy. La migración no se incluye en este gate visual. |
| Resuelto para este release | Locale/canales legacy se conservan como provenance y se difiere su destino. La moneda comercial pertenece a `PriceBook`; `Offer` no tiene moneda independiente. No se elimina ni migra data sin inventario autorizado y dry-run. La categoría propia de cada SKU debe reflejarse en el plan/build. |
| Propuesta visual | Componer páginas completas con navegación por secciones y drawers ligeros para gestión rápida de referencias; mostrar coste y atributos físicos con semántica explícita. |
| No aprobado / fuera de estos wireframes | Pantallas de ventas/pedidos, compras, almacén, finanzas, conexión Shopify, sincronización o storefront. Los pilotos MiauCraft e Inhand no convierten esas capacidades en alcance aprobado. |
| No demostrado | Operación completa de Products en mobile web, runtime de persistencia/auditoría o equivalencia de permisos. iOS/Android están diferidos, no planificados para este release. |

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
creación de subcategoría. No se dibuja borrado físico. El ciclo de vida
archive/restore, la asignación preservada, el bloqueo por hijos activos y el
reparentado sin ciclos siguen las reglas confirmadas de `domain-model.md`.

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

La creación y edición usan una página completa dentro del AppShell, con
breadcrumb, retorno a Products, título/estado, secciones y acciones de guardar
o cancelar. En desktop, `FormSectionNav` organiza identidad, clasificación,
coste de compra, datos físicos y SKUs; el formulario usa el ancho disponible
sin un overlay que tape la lista. En mobile web las secciones se apilan, la
navegación no fuerza scroll horizontal y la acción principal permanece visible
sin cubrir campos ni teclado.

Los campos de identidad incluyen nombre, clave interna generada, categoría,
marca, etiquetas y descripciones. La clase es independiente de usos de compra,
venta e inventario; el sourcing se define en el producto y se hereda en sus
SKUs. Para artículos físicos se muestran barcode, peso, dimensiones
estructuradas y atributos descriptivos; qué valores viven en producto base o
SKU queda abierto al análisis de dominio.

El bloque “Coste de compra de referencia” representa un importe unitario con
moneda explícita, solo en el contexto del producto sin SKUs o del SKU
correspondiente. Es estimativo: no es valoración contable/de inventario, no
calcula margen ni sustituye compras/proveedores. El acceso se muestra como
protegido; la matriz de permisos concreta y la herencia/default de coste deben
resolverse antes del build. Los selectores de clase/categoría/abastecimiento
usan primitivas LoopDev; los usos usan checkboxes independientes. Validación
junto al campo y resumen enfocable, con texto/icono además del color.

El patrón de `ContactForm` demuestra primitives y comportamientos reutilizables,
no que el formulario ERP actual ya los use. El wireframe muestra una
composición propuesta; no presupone sticky section navigation o lifecycle
adicional más allá de los componentes verificados.

**Evidencia:** [wireframe desktop y mobile](wireframes/erp-product-form-page.svg).
**Ejemplo ficticio:** “Arnés Trail”; datos, importes y SKUs son ilustrativos,
no representan registros reales de MiauCraft.

### Editar variante / SKU — `VIS-ERP-FLOW-06`

La edición de un SKU presenta primero la categoría general del producto como
contexto y ofrece un control independiente para la categoría propia del SKU.
El control no hereda automáticamente la categoría del producto ni la de otro
SKU; el sourcing sí se muestra como valor heredado y no editable en esta
superficie. La activación vuelve a validar SKU, categoría activa y producto
padre. Restaurar un SKU siempre lo devuelve a `draft`; no se reactiva al
restaurarlo.

Desktop y mobile web usan una página completa para crear/editar el SKU, con
breadcrumb al producto padre y las mismas operaciones semánticas. La página
muestra la categoría general como contexto, pero requiere asignar una categoría
propia al SKU; el sourcing sigue heredado. También ofrece coste unitario de
compra y atributos físicos de la unidad gestionada. Defaults, herencia de
coste/medidas y normalización de unidades quedan abiertos; las etiquetas
visuales no implican contrato implementado. Los controles táctiles mantienen
al menos 44×44 px y las categorías general y propia se distinguen con labels
explícitos, no solo por color.

**Evidencia:** [wireframe desktop y mobile](wireframes/erp-sku-editor-page.svg).
**Estados:** definidos en `view-state-matrix.md`; el SVG representa un SKU en
edición conceptual y no evidencia runtime.

![Formulario de producto o servicio en desktop y mobile](wireframes/erp-product-form.svg)

### Ficha de producto y configuración comercial — `VIS-ERP-VIEW-07`

La ficha de lectura usa página completa, con resumen, secciones de identidad,
clasificación, datos físicos, coste protegido y SKUs. La columna derecha agrupa
el precio de referencia, el coste protegido y una vista previa compacta de la
galería de imágenes. “Abrir galería” conduce a una página completa dedicada al
producto: permite gestionar imágenes generales y específicas de sus SKUs, y
reutilizar recursos de la biblioteca de la organización. Si el producto no
tiene SKUs, las cargas se asocian directamente a su galería sin pedir un
destino; en productos con SKUs, el selector permite asignar imágenes generales
o específicas de una variante. Ofertas y listas de precios permanecen
separadas de la referencia de coste; no se agregan Shopify, stock, pedidos o
gestión de compras. El coste solo se renderiza a un usuario con permiso
explícito; de lo contrario se omite su valor y se explica que es un dato
restringido. La vista del producto es el punto de acceso a las páginas de SKU y
a la edición.

**Evidencia:** [ficha completa desktop y mobile](wireframes/erp-product-record-page.svg).
El [detalle comercial compacto](wireframes/erp-commercial-detail.svg) queda
como preview secundario; no sustituye la página completa.

### Alta rápida de referencias — `VIS-ERP-FLOW-08`

Desde los campos de categoría o marca se puede abrir un `AppDrawer` liviano
para crear una referencia y seleccionarla al volver, preservando el draft del
producto. Cancelar vuelve al formulario sin perder sus valores. La gestión
completa del árbol de categorías permanece en la vista dedicada aprobada
(`VD-ERP-013`); el drawer no reordena ni reemplaza el árbol. La gestión completa
de marcas/etiquetas y si existe una página de configuración dentro de Products
siguen abiertas; no se crea un módulo genérico de configuración ERP.

**Evidencia:** [alta rápida desktop y mobile](wireframes/erp-reference-quick-drawer.svg).

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
| `>=1200px` | Shell con navegación amplia o colapsada; overview con KPI en tres columnas y dos zonas; lista tabular; ficha, editor de producto y editor de SKU en páginas completas. | Teclado completo, hover solo como ayuda; `AppDrawer` se limita a referencias rápidas. | `PLATFORM_V2_SHELL_REFERENCE.md`, `tailwind.config.ts`, wireframes. |
| `768–1199px` | Shell mini-sidebar; grillas se reducen; páginas de formulario pasan a una columna con navegación de sección compacta. | No reducir hit-area para salvar densidad; filtros pueden pasar a una segunda fila. | Shell (`md` a `nav`) y wireframes como propuesta. |
| `<768px` | Sidebar como drawer; una columna; artículo como card; detalle y formularios son páginas con retorno visible; drawer rápido ocupa la superficie completa. | Área objetivo mínima 44×44 CSS px; mismo significado, acción principal visible, navegación móvil y foco/dirty-state preservados. | `PLATFORM_V2_SHELL_REFERENCE.md`; wireframes; comportamiento ERP requiere prueba. |
| iOS / Android | Sin composición nativa para este release; superficies diferidas. | No se afirma paridad nativa; mantener contratos compartidos si se aprueba una fase futura. | Scope `deferred`; aprobado por Product Owner. |

## Accesibilidad e internacionalización

- **Teclado:** orden de foco de breadcrumb → título/acción → filtros → lista → paginación; `Enter` abre un producto/servicio y `Escape` cierra la superficie superior. Una tarjeta clicable no contiene botones clicables anidados. Las tablas exponen encabezados, sort y acciones con nombre accesible.
- **Páginas y formularios:** breadcrumb y retorno mantienen el contexto; navegación por secciones es operable con teclado y lector de pantalla. Cada control tiene label visible; `aria-invalid`/`aria-describedby` vinculan error y descripción. Confirmar descarte de draft ante navegación; el resumen de errores recibe foco tras submit inválido.
- **Drawers auxiliares:** usar `AppDrawer`/Sheet para portal, foco atrapado por la primitiva, Escape y restauración de foco al opener; al cerrar se restaura el formulario padre sin perder el draft. No anidar drawers.
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
| Ficha/edición de producto y SKU | `PageContainer`, `PageHeader`, `AppBreadcrumbs`, `FormSection`, `FormSectionNav`, `ConfirmDialog` | `REUSE`; páginas completas para contenido amplio y rutas de deep link/refresh. | `PLATFORM_V2_UI_REFERENCE.md`, `PageContainer.tsx`, `FormSectionNav.tsx`, `LoopdevRoutes.tsx`. |
| Alta/edición rápida de referencias | `AppDrawer`, `ConfirmDialog`, `FormSection` | `REUSE`; overlay corto con foco restaurado y preservación del draft padre. | `AppDrawer.tsx`; tests `app-drawer.test.tsx`. |
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
| Página de producto/SKU | `shared` | `PageContainer`, `PageHeader`, `AppBreadcrumbs`, `FormSection`, `FormSectionNav` | Platform | Contenido amplio, enlaces profundos, refresh y secciones accesibles. | Platform UI/Shell reference; ruta actual y formulario CRM. |
| Drawer de alta rápida | `shared` | `AppDrawer`, `ConfirmDialog` | Platform | Crear una referencia sin abandonar el draft padre; no administra jerarquías completas. | Implementación y `app-drawer.test.tsx`. |
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
| VD-ERP-FORM-002 | Crear/editar y consultar la ficha completa de producto/SKU en páginas completas; drawers únicamente para alta/edición rápida de referencias auxiliares. | Selección explícita de @loopdev-io el 2026-10-24: “Sí: páginas completas y drawers para gestión rápida”. | Reemplaza el formulario principal en drawer y requiere rutas con deep-link, refresh, back y preservación de drafts. |
| VD-ERP-COST-001 | Mostrar coste de compra unitario de referencia por producto/SKU; no es coste contable, valoración de inventario ni margen. | Selección explícita de @loopdev-io el 2026-10-24: “Coste de compra unitario de referencia por producto/SKU, no contable”. | Representar importe/moneda por separado del precio de venta; acceso protegido y reglas de herencia/permisos pendientes. |
| VD-ERP-DATA-001 | Categoría y marca permiten alta rápida desde sus campos; la gestión del árbol de categorías permanece en vista dedicada. | Selección explícita de @loopdev-io para usar drawers en la gestión rápida de datos auxiliares; `VD-ERP-013` ya confirma la vista del árbol. | No implica aprobación de un módulo genérico de configuración ni resuelve entidad/retención de marcas y etiquetas. |

## Validación en dos niveles

### Aprobación conceptual — antes de implementación

- **Alcance y jerarquía:** revisar que la fuente visual cubre solo Products y categorías, además del coste de compra de referencia, y que no convierte ventas/compras/inventario/Shopify en MVP.
- **Composición:** revisar cards, tabla móvil, páginas completas de producto/SKU, ficha completa, alta rápida de referencias y la propuesta de evitar drawers anidados.
- **Estados y recuperación:** revisar loading, empty, error, forbidden, conflict, offline, pending y success por superficie en `view-state-matrix.md`.
- **Reuso:** revisar inventario de fuentes, zonas y hallazgos (selector nativo, duplicación de sección, modo de drawer, falta de loading/error en Overview y discrepancia de formularios).
- **Responsive/accesibilidad:** revisar navegación, target táctil, foco, contraste, lectura no-color e i18n/RTL.
- **Aprobador/fecha/decisión/evidencia:** @loopdev-io aprobó conceptualmente la revisión completa el 2026-10-24; el registro se conserva en `01-visual-design.json`. La comparación visual de runtime sigue `NOT_RUN`.

### Comparación runtime — después de implementación

- **Rutas/viewport:** `/app/erp/overview` y la futura `/app/erp/products` (lista, detalle y formularios) en desktop >=1200px, tablet 768–1199px y móvil <768px, tema light/dark; comparar también la redirección desde `/app/erp/product-catalog`.
- **Capturas y diff:** no existen aún; runtime no iniciado.
- **Comparación con esta fuente:** `NOT_RUN` hasta implementación aprobada.
- **Desviaciones:** registrar cada diferencia con aprobación/owner antes de cerrar `08-verify`.
- **Estado:** `NOT_RUN`.

## Decisiones y dependencias visuales

| ID | Decisión | Owner | Default propuesto | Impacto | Aprobación necesaria |
|---|---|---|---|---|---|
| VD-ERP-001 | Alcance del primer release (`ERP-OD-006`). | Product Owner (@loopdev-io) | Products/categorías únicamente; Shopify, Inhand y demás módulos diferidos. | Cierra vistas y operaciones en esta release. | Resuelto por `CR-ERP-PRODUCTS-FIRST-RELEASE`, aprobado 2026-10-24. |
| VD-ERP-002 | Preview compacto y configuración comercial: drawer único o overlay anidado. | Product Owner + Platform | El drawer es solo preview/acción breve; la ficha y edición principal usan página completa. | Evita doble trap/stack de foco y reserva ancho para el detalle. | La regla contra drawers anidados sigue confirmada; la revisión visual completa está pendiente. |
| VD-ERP-003 | Tarjeta móvil de artículo en vez de tabla horizontal. | Product Owner + Platform | Card por artículo en móvil; misma operación/semántica que desktop. | Requiere operación-parity tests en mobile web. | Confirmado por aprobación conceptual completa del 2026-10-24. |
| VD-ERP-004 | Paginación remota y posible extensión de `DataTable`. | Platform + ERP | Reusar `TablePagination` y cursor del contrato; no extender Platform sin evidencia del audit. | Un dataset grande no debe cargar completo en memoria. | Resolver en platform-reuse/API audit antes de implementar; no bloquea scope ni aprobación del plan. |
| VD-ERP-005 | Aplicabilidad de iOS y Android. | Product Owner + Platform | Diferir ambos sin wireframes ni claim de paridad. | Define scope nativo futuro. | Resuelto: este release es web escritorio/móvil; volver a discovery en otra fase. |
| VD-ERP-006 | Formularios Products y uso del contrato visual compartido. | Platform + ERP | Reusar `Form`/`FormSection`/lifecycle actuales; no crear primitives nuevos. | El formulario legacy usa estado local y debe converger con patrón compartido. | Aprobación visual confirma la composición; auditar y planificar pruebas/cambio sin duplicar controles. |
| VD-ERP-007 | El runtime usa Geist mientras la fuente visual aprobada define Inter/JetBrains Mono. | Platform owner | Mantener tipografía global aprobada; no aplicar cambio local solo a ERP. | La UI implementada no puede coincidir con la fuente aprobada hasta que Platform resuelva el drift. | **Bloqueo de implementación visual:** Platform debe confirmar el cambio global o aprobar explícitamente una desviación antes del renderer. |
| VD-ERP-008 | Locale/moneda real del cliente. | Product Owner + cliente futuro | Fixtures ficticios `es-ES/EUR`; configuración de organización, sin impuesto/country assumption. | Afecta formatos y fiscalidad de integraciones futuras. | Diferido: no bloquear Products/categories; resolver antes de Shopify/Inhand/ventas. |
| VD-ERP-009 | Enlaces canónicos de composición visual no existentes en el protocolo CRM. | Platform | Basar esta composición en UI/shell references y source/test evidence actuales. | Riesgo de enlazar documentación inexistente. | No bloquea este módulo; corregir enlaces como mantenimiento de Platform. |
| VD-ERP-010 | Locale/canales de `OrganizationCatalog` (`ERP-OD-008`). | Product Owner + ERP/Platform | Preservar como provenance; moneda pertenece a `PriceBook`; `Offer` no tiene moneda propia. | No perder datos de migración. | Resuelto para este release; destino deferred. |
| VD-ERP-011 | Ruta `/app/erp/products` y deep links legacy. | Product Owner + Platform | Products directo; compatibilidad/redirección desde `/app/erp/product-catalog`; no usar `catalogId` como límite de negocio. | Navegación, refresh, bookmarks, CRM links y mobile back. | Confirmado por aprobación conceptual del Products direct-list flow; validar en route/runtime audit. |
| VD-ERP-012 | Categoría propia por variante/SKU. | Product Owner + ERP domain | Producto base categoría general; cada SKU con su categoría; drafts pueden omitir y activación la exige. | El formulario/lista debe exponer ambas asignaciones. | Resuelto en `domain-model.md`; incorporar a contrato y tests. |
| VD-ERP-014 | La interacción para asignar categoría a cada SKU no estaba dibujada. | Product Owner + ERP domain | Vista de edición de SKU con categoría general en solo lectura y selección propia. | Evita interpretar la categoría del producto como herencia de SKU. | Addendum aprobado explícitamente por @loopdev-io el 2026-10-24. |
| VD-ERP-DATA-002 | Gestión completa de marcas/etiquetas y atributos auxiliares: referencias controladas, libres o mixtas; navegación a catálogo completo. | Product Owner + ERP domain | Alta rápida en drawer desde el formulario; categoría mantiene manager dedicado. | Afecta unicidad, scope, archivado, filtros, permisos y migración de strings legacy. | Requiere definir si marcas/etiquetas son catálogos administrados y si necesitan una página de gestión dentro de Products. |
| VD-ERP-COST-002 | Permiso y visibilidad del coste de referencia; herencia/default de producto a SKU; moneda, fuente e historial. | Product Owner + ERP domain/access | Coste pertenece a la unidad comprable: producto si no tiene SKUs, SKU cuando se gestiona separadamente; se oculta sin permiso explícito. | Cambia modelo, DTO, persistencia, auditoría, autorización y layout de detalle. | Rerun domain/access/API/sync antes del plan; no reutilizar `catalog.read` por inferencia. |
| VD-ERP-PHYSICAL-001 | Propiedad y herencia de peso/dimensiones entre producto base y SKU; unidades válidas. | Product Owner + ERP domain | Capturar valores estructurados en la entidad física gestionada y exponer unidad explícita. | Afecta validación, conversiones, logística futura e importación de datos. | Resolver en domain/API antes del build; el SVG solo presenta la composición propuesta. |
## Handoff

- **Requisitos visuales listos para revisión:** la revisión actual muestra lista, árbol de categorías, páginas completas de producto/SKU, ficha completa, referencias rápidas y preview comercial en desktop/mobile web. El Overview sigue como compatibilidad, no dashboard funcional.
- **Decisiones confirmadas:** página completa para producto/SKU, coste unitario de compra de referencia no contable, alta rápida de referencias en drawer y gestión jerárquica de categorías en vista dedicada.
- **Riesgos/dependencias:** coste sensible necesita policy propia; reglas de herencia/currency/unidades y el inventario de marcas/etiquetas requieren análisis de dominio/acceso/API/sync antes de planificar build.
- **Preguntas abiertas:** administración completa de marcas/etiquetas; acceso, moneda, source/history y defaults del coste; propiedad de dimensiones; migración real y auditoría Platform.
- **Estado:** `approved with open domain/access decisions` — las composiciones están aprobadas conceptualmente; coste, permisos, atributos y configuración auxiliar deben resolverse como tareas del plan. La comparación runtime permanece `NOT_RUN`.
