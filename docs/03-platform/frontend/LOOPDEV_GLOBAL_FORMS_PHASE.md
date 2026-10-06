---
title: LoopDev global forms phase
status: in-progress
owner: platform
updated: 2026-09-11
scope: transversal-frontend
---

# Fase transversal — Sistema global de formularios

> Estado de implementación: infraestructura compartida disponible en `src/components/common/useFormLifecycle.ts`, `FormSectionHeader.tsx` y `FormSection.tsx`. Contacts, Leads, Opportunities, Tasks, Notes, Task Templates, Automations y Operations ya tienen adopción local del ciclo o de sus primitives visuales. La convergencia completa de superficies y tests transversales sigue pendiente.

Esta fase define un comportamiento único para cualquier formulario de LoopDev,
independientemente de si se presenta en un drawer, modal, página completa, wizard o edición
inline. CRM y Communications son los primeros consumidores, pero el contrato pertenece a
Platform y debe poder reutilizarse en Settings, Catalog, Operations, Projects y la futura
aplicación móvil.

## Objetivo

Separar el ciclo de vida y las reglas de edición de la superficie visual:

```text
Form Runtime / Controller
  -> campos y schema del dominio
  -> Form Surface
       ├── Drawer
       ├── Dialog / Modal
       ├── Page
       ├── Wizard
       └── Inline edit
```

El mismo formulario debe conservar el mismo comportamiento de valores iniciales, dirty state,
validación, cancelación, confirmación, guardado, errores, conflictos, accesibilidad y foco al
cambiar de superficie.

## Próximo bloque de experiencia visual

Estos siete incrementos quedan incorporados como backlog obligatorio de la fase:

- [ ] Progreso real por sección calculado desde el estado del formulario.
- [ ] Errores visibles en el encabezado de cada sección, con contador y navegación al primer error.
- [ ] Navegación sticky entre secciones para formularios largos.
- [ ] Secciones colapsables opcionales para contenido secundario o avanzado.
- [ ] Indicador común de cambios no guardados en header y footer.
- [ ] Estados visuales de sección: neutral, en progreso, completo y con errores.
- [ ] Variante compacta para formularios pequeños.

El componente `FormSectionHeader` debe ser la base de estas capacidades. El header superior
del drawer debe evolucionar en paralelo para mostrar contexto (`CRM / Contact`), modo
(`New`, `Editing`, `Read-only`), estado dirty, progreso y metadatos sin competir con el título.

## Contrato responsive

La densidad y el tamaño de la superficie son conceptos separados:

```ts
type FormLayoutMode = "compact" | "standard" | "expanded";
type FormResponsiveMode = "auto" | "fixed";
```

`compact` es para acciones rápidas e inline edit, `standard` para drawers y modales, y
`expanded` para formularios largos, páginas completas y wizards. Con `responsive="auto"` se
usa la siguiente adaptación:

| Desktop | Mobile |
| --- | --- |
| compact | compact |
| standard | compact |
| expanded | standard |

En móvil se conserva el mismo contrato funcional y solo se adapta la presentación: una columna,
header reducido, metadata secundaria oculta, navegación horizontal y footer accesible.

## Alcance funcional obligatorio

### Ciclo de vida

- [ ] Soportar modos `create`, `edit`, `read-only`, `duplicate` y `draft`.
- [ ] Definir estados `idle`, `editing`, `validating`, `saving`, `saved`, `error`, `conflict`
  y `discard-confirmation`.
- [ ] Comparar valores iniciales y actuales con normalización explícita.
- [ ] Resetear al valor inicial, descartar cambios y restaurar valores guardados.
- [ ] Impedir doble submit y bloquear acciones incompatibles durante el guardado.
- [ ] Cerrar o navegar después del éxito según la política de la superficie.

### Superficies y navegación

- [ ] Usar el mismo runtime en drawer, dialog, página completa, wizard e inline edit.
- [ ] Mantener el mismo `Cancel`, `Save`, `Discard` y copy de confirmación.
- [ ] Confirmar cambios no guardados al cerrar, usar `Escape`, cambiar de registro o navegar.
- [ ] Añadir guard de navegación y `beforeunload` cuando el navegador lo permita.
- [ ] Soportar formularios anidados sin que un `Escape` cierre la superficie equivocada.
- [ ] Restaurar el foco al elemento que abrió el formulario.
- [ ] Mantener scroll, foco y sección activa en formularios largos.

### Validación y errores

- [ ] Validación síncrona y asíncrona mediante schemas tipados.
- [ ] Errores por campo, por sección y a nivel de formulario.
- [ ] Errores provenientes del adapter/backend con mapping tipado.
- [ ] Resumen de errores enfocable al enviar un formulario inválido.
- [ ] Scroll automático al primer error sin romper la posición del usuario.
- [ ] Diferenciar validación, permisos, red, conflicto, policy y error inesperado.
- [ ] No ocultar errores ni convertir fallos en estados de éxito.

### Concurrencia y persistencia

- [ ] Enviar `expectedUpdatedAt` o `version` cuando la entidad sea mutable.
- [ ] Mostrar conflicto explícito y conservar los cambios locales del usuario.
- [ ] Permitir recargar, revisar diferencias y reintentar según la política del dominio.
- [ ] Usar `idempotencyKey` en comandos que puedan repetirse.
- [ ] Preparar drafts locales para formularios largos o recuperables.
- [ ] Definir autosave únicamente en formularios donde el dominio lo justifique.
- [ ] Nunca confiar en permisos, ownership o scopes decididos solo por el cliente.

### Campos y composición

- [ ] Campos de texto, número, moneda, teléfono, email, URL y contraseña.
- [ ] Textarea, rich text y contenido con contador o límite.
- [ ] Select, multi-select, combobox, búsqueda remota y referencia autorizada.
- [ ] Date, time, datetime, date range y timezone.
- [ ] Checkbox, radio, switch, segmented control y grupos de opciones.
- [ ] Upload, attachments, preview, progreso, validación de tamaño/tipo y eliminación.
- [ ] Campos dependientes y cascadas como país → región → ciudad.
- [ ] Repetidores, arrays, líneas de oportunidad y colecciones editables.
- [ ] Secciones colapsables, tabs internas y layouts responsive.
- [ ] Campos condicionales, visibilidad por permisos y modo read-only.
- [ ] Formularios multi-step con progreso, navegación, validación por paso y resumen final.

### Plataforma y experiencia

- [ ] Contrato común de `loading`, `disabled`, `read-only`, `forbidden`, `empty` y `error`.
- [ ] Soporte de teclado, labels, descriptions, `aria-invalid`, `aria-describedby` y foco.
- [ ] Compatibilidad con light/dark theme, densidad y tokens visuales.
- [ ] Localization de labels, errores, formatos, moneda, fechas y timezone.
- [ ] Responsive real para desktop, tablet y mobile.
- [ ] Reduced motion y comportamiento estable durante transiciones.
- [ ] Copy consistente para crear, editar, guardar, cancelar, descartar y reintentar.
- [ ] Tests de contrato para todos los estados transversales.

## API de Platform propuesta

```text
useFormRuntime()
FormRuntimeProvider
FormSurface
DrawerFormSurface
DialogFormSurface
PageFormSurface
WizardFormSurface
FormActions
UnsavedChangesGuard
FormErrorSummary
FormConflictState
```

El runtime controla comportamiento y estado. Las superficies solo controlan layout, scroll,
portal, responsive y slots visuales. Los dominios aportan schema, valores, comandos y copy
específico de negocio.

## Revisión de Rivera

Rivera se utilizará como referencia visual y fuente de patrones, no como fuente de contratos,
persistencia ni componentes de dominio. Rivera es frontend-only y usa mock data/localStorage;
no se deben copiar sus páginas, modelos ni recetas de backend.

| Necesidad | Patrón o primitive a reutilizar/componer | Decisión LoopDev |
| --- | --- | --- |
| Modal corto | `Dialog`, `AlertDialog` | Componer `DialogFormSurface` y `UnsavedChangesGuard` |
| Drawer contextual | Sheet/drawer de Rivera | Usar `src/components/platform/AppDrawer.tsx` como shell canónico |
| Página completa | Layout de formulario de Rivera | Componer `PageFormSurface` sobre el Shell de LoopDev |
| Campos base | Input, Textarea, Label, Button | Usar `src/components/ui` y tokens LoopDev |
| Selectores | Select, Popover, Command, Combobox | Componer referencias autorizadas detrás de adapters |
| Fechas | Calendar y Popover | Añadir timezone, locale y contratos de fecha |
| Opciones | Checkbox, RadioGroup, Switch, Toggle | Mantener semántica y estados accesibles |
| Formularios | Form, FormField, FormControl, FormMessage | Mantener React Hook Form + schemas tipados |
| Estados | Alert, Skeleton, Progress, Toast | Unificar loading, error, progreso y éxito |
| Superficies | Card, ScrollArea, Tabs, Separator | Usar solo como composición; no crear shells por dominio |
| Identidad | Avatar y Badge | Reutilizar en campos relacionales y previews |

### No reutilizar directamente

- Páginas completas de Rivera.
- Formularios acoplados a mock data o `localStorage`.
- Validaciones visuales sin contrato de dominio.
- Modales o drawers específicos de una aplicación Rivera.
- Estados de éxito que no representen persistencia real.
- Componentes que decidan permisos, tenant, ownership o autorización.

## Consumidores iniciales

1. Contacts: creación y edición de contacto.
2. Leads: creación, edición, assignment y conversión.
3. Opportunities: creación, líneas, edición y reapertura.
4. Tasks y Task Templates.
5. CRM Operations, Automations y Custom Fields.
6. Communications Settings y futuras acciones de Operations.
7. Catalog, Settings y futuras suites fuera de CRM.

## Evidencia de salida

- [ ] Existe un runtime agnóstico al contenedor.
- [ ] Drawer, modal y página comparten el mismo comportamiento observable.
- [ ] Contacts migra a la implementación global y permite editar todos sus campos autorizados.
- [ ] Hay tests comunes de dirty state, cancelación, validación, conflicto y foco.
- [ ] Rivera queda documentado como referencia de patrones, con decisiones de reutilización explícitas.
- [ ] Los formularios existentes no duplican confirmaciones, footer ni lógica de cierre.
- [ ] El contrato queda listo para sustituir adapters locales por Supabase sin cambiar las superficies.
