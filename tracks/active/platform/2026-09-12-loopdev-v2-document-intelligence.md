---
id: loopdev-v2-document-intelligence
title: Document Intelligence - Capacidad transversal y banco de trabajo operativo
status: active
created: 2026-09-12
updated: 2026-09-12
owner: platform
lead: User
branch: document_intelligence
branches:
  - document_intelligence
phase: 1
pull_requests: []
issues: []
packages: []
release: internal-product
areas:
  - platform
  - ai
  - document-intelligence
  - tools
  - crm
  - communications
dependencies:
  - loopdev-v2-crm-frontend
blocked_by: []
supersedes: []
---

# Document Intelligence - Capacidad transversal y banco de trabajo operativo

## Outcome

Incorporar **Document Intelligence** a LoopDev v2 como una **capacidad transversal de plataforma y utilidad operativa** (*AI document processing engine*), implementada de forma nativa sobre el sistema de diseño y arquitectura de LoopDev v2 (frontend-first, `Page -> hook -> adapter -> local store/fixtures`, Tailwind v3 y primitives compartidos).

Document Intelligence **no es una suite de negocio** (no tiene tarjeta en el Launchpad). Se presenta en dos superficies principales que comparten la misma secuencia operativa y componentes modulares:
1. **Superficie Standalone (Páginas de Herramienta)**:
   - **Resumen e Histórico Global** (`/app/tools/document-intelligence`): Registro histórico centralizado de todas las extracciones realizadas en Loopdev (origen directo o suites), métricas operativas y botón **"Iniciar extracción"**.
   - **Workspace Operativo Split-Screen** (`/app/tools/document-intelligence/:extractionId`): Espacio de trabajo a pantalla completa con flujo secuencial (Dropzone -> Preview interactivo -> Loader detallado -> Transición LogoSpinner -> Split-Screen con documento a la izquierda y campos extraídos a la derecha con confirmación).
2. **Superficie Contextual (`DocumentExtractionDrawer`)**:
   - Montada sobre `AppDrawer` de plataforma (`size="lg"`).
   - Diseñada para activarse como acción contextual dentro de suites consumidoras:
     - **Communications (WhatsApp / Chat)**: cuando un cliente envía una foto de su documento en una conversación, el operador pulsa *"Extraer datos con Document Intelligence"*.
     - **CRM Contacts**: alta rápida o verificación de identidad desde el formulario de contacto.
   - **Mantiene exactamente los mismos pasos, estados y experiencia que el Workbench** (Dropzone/archivo precargado -> Preview con zoom/giro/crop -> Loader secuencial de pasos -> Transición LogoSpinner de 3s -> Campos organizados con badges de confianza), con el botón de acción final **"Aplicar al contacto"**, el cual mapea y rellena automáticamente los datos del cliente en el CRM (`firstName`, `lastName`, `documentNumber`, `birthDate`, etc.) y actualiza la identidad a `verified` sin abandonar el contexto de la suite.

*Nota de gobernanza*: La plantilla Rivera (`src/template/rivera/`) no se modifica en absoluto. Se utiliza únicamente como referencia visual auditada y se reutilizan los primitives compartidos ya existentes en `src/components/common/` y `src/components/ui/`.
*Nota de alcance*: Las validaciones de reglas de negocio y sus configuraciones quedan explícitamente fuera de esta fase.

---

## Principios y reglas de diseño

1. **Ubicación en Sidebar (Tools)**:
   - En el Sidebar principal se ubica en:
     ```text
     Launchpad
     Suites
       ├ CRM
       └ ERP
     Tools
       └ Document Intelligence (/app/tools/document-intelligence)
     Workspace
       └ Settings
     ```
2. **Reutilización de Files Platform**:
   - Consumo de `futureConsumers.ts` de Files Platform configurado con:
     `consumer: "document-intelligence"`, `temporary: true`, `retentionDays: 7`.
3. **Flujo de Proceso Determinista y Reutilizable (Standalone y Drawer)**:
   - Tanto la página de pantalla completa (`ExtractionWorkspace`) como el Drawer lateral (`DocumentExtractionDrawer`) consumen el mismo hook de orquestación (`useExtractionSession`) y los mismos componentes modulares, cambiando únicamente el modo de layout (`workspace` vs `drawer`).
4. **Selector de 3 Opciones de Organización**:
   - `aseguradora-1`: Nombre(s), Primer apellido, Segundo apellido separados.
   - `aseguradora-2`: Nombre(s) y Apellidos completos agrupados.
   - `icao-internacional`: Formato internacional de viaje con bloque MRZ.
   - Sincronización automática de nombres/apellidos entre formatos sin duplicar ni perder información.
5. **Frontend-First y Arquitectura Desacoplada**:
   - Adapter local determinista con fixtures realistas (DNI anverso/reverso, Pasaporte, Licencia).
   - Inferencia simulada de forma creíble con pasos de modelo y tiempos controlados.
   - Sin archivos monolíticos: componentes pequeños y de responsabilidad única.

---

## Descomposición modular detallada de la arquitectura

### 1. Capa de Dominio (`src/loopdev/domains/document-intelligence/`)
- `adapter/types.ts`: Modelos canónicos (`ExtractionRecord`, `IdentityDocumentFields`), inputs de mutación, filtros y envelopes de respuesta (`ExtractionPage`, `ExtractionMutationResult`).
- `adapter/index.ts`: Interfaz estricta `DocumentIntelligenceAdapter` y exportación del contrato.
- `adapter/local.ts`: Store en memoria determinista con simulación reactiva de mutaciones y lecturas.
- `data/fixtures.ts`: Muestras de prueba de documentos reales (DNI español, Pasaporte, Carnet de conducir) con datos redactados.
- `data/export-profiles.ts`: Catálogo tipado de las 3 opciones de organización y funciones puras de transformación/sincronización de apellidos (`splitSurnames`, `buildSurnames`, `formatFieldsForProfile`).
- `hooks/use-document-intelligence.ts`: Hook para listar extracciones del histórico global, paginación, filtros y recarga.
- `hooks/use-extraction-session.ts`: Hook especializado que maneja la máquina de estados operativa para una sesión activa (`intake -> preview -> processing -> transition -> extracted`), reutilizado 100% por el Workbench y el Drawer.
- `index.ts`: Punto de entrada barrel del dominio.

### 2. Capa de Componentes Modulares (`src/loopdev/components/document-intelligence/`)
- **Visor interactivo de documentos**:
  - `DocumentViewer.tsx`: Contenedor orquestador del visor (soporta `mode="full" | "compact"`).
  - `DocumentViewerToolbar.tsx`: Barra de controles accesible (modos de ajuste, zoom +/- con reset, rotación 90°, botón recortar y abrir pestaña).
  - `DocumentViewerViewport.tsx`: Canvas interactivo con captura de puntero para Pan, transformación CSS y render de imagen/PDF.
  - `CropDialog.tsx`: Diálogo modal sobre canvas con slider de escala para pre-recorte antes de la inferencia.
- **Ingesta y Progreso**:
  - `DocumentDropzone.tsx`: Área accesible drag & drop, selección de archivo, pegado de portapapeles y botón *"Usar fixture"*.
  - `ExtractionProgressLoader.tsx`: Vista de avance secuencial de los 4 pasos del modelo con checklist animado y barra de progreso.
  - `ExtractionTransitionSpinner.tsx`: Superficie limpia de transición de ~3 segundos centrada con `LogoSpinner`.
- **Panel de Revisión y Campos Extraídos**:
  - `ExtractionReviewPanel.tsx`: Contenedor del panel derecho / inferior (cabecera, selector de formato y barra inferior de acciones).
  - `ExtractionProfileSelector.tsx`: Selector desplegable con las 3 opciones de organización y descripciones dinámicas.
  - `ExtractionFieldsGrid.tsx`: Grid de campos correspondientes al perfil activo (responsive para workspace y drawer).
  - `ExtractionFieldItem.tsx`: Campo individual de formulario (input o textarea MRZ) con badge de confianza coloreado y botón de copiado individual.
  - `ExtractionActionsBar.tsx`: Barra inferior con acciones de reintentar y **Confirmar / Aplicar extracción**.
- **Histórico Global**:
  - `ExtractionsMetrics.tsx`: Fila superior de tarjetas `StatCard` con indicadores acumulados.
  - `ExtractionsTable.tsx`: Tabla de datos con paginación, ordenación, badges de estado y acciones por fila.
- **Superficie Contextual Lateral**:
  - `DocumentExtractionDrawer.tsx`: Envoltorio basado en `AppDrawer` (`size="lg"`) que orquesta toda la secuencia para integrarse en Communications y CRM Contacts.

### 3. Capa de Páginas (`src/loopdev/pages/tools/document-intelligence/`)
- `Overview.tsx`: Compone `PageHeader`, `ExtractionsMetrics`, filtros y `ExtractionsTable`.
- `ExtractionWorkspace.tsx`: Lee el `:extractionId` de la URL, consume `useExtractionSession` y renderiza el flujo en modo workspace split-screen.

---

## Fases de ejecución

### Fase 1 — Contratos de Dominio y Perfiles de Organización
- [x] Crear `src/loopdev/domains/document-intelligence/adapter/types.ts` (con soporte para `sourceSuite?: "standalone" | "crm" | "communications"`, `IdentityDocumentFields`, `ExtractionRecord`).
- [x] Crear `src/loopdev/domains/document-intelligence/adapter/index.ts`.
- [x] Crear `src/loopdev/domains/document-intelligence/data/export-profiles.ts` (las 3 opciones: Aseguradora 1, Aseguradora 2, ICAO y funciones de split/build de apellidos).
- [x] Crear `src/loopdev/domains/document-intelligence/data/fixtures.ts`.
- [x] Crear `src/loopdev/domains/document-intelligence/adapter/local.ts` con store en memoria y métodos de simulación.
- [x] Crear `src/loopdev/domains/document-intelligence/hooks/use-document-intelligence.ts`.
- [x] Crear `src/loopdev/domains/document-intelligence/hooks/use-extraction-session.ts` (máquina de estados común para Workbench y Drawer).
- [x] Exportar barril `src/loopdev/domains/document-intelligence/index.ts`.

### Fase 2 — Visor de Documentos e Ingesta Modulares
- [x] Implementar `DocumentViewerToolbar.tsx`, `DocumentViewerViewport.tsx` y `DocumentViewer.tsx`.
- [x] Implementar `CropDialog.tsx`.
- [x] Implementar `DocumentDropzone.tsx`.

### Fase 3 — Rutas, Navegación y Pantalla de Histórico Global (Overview)
- [x] Añadir la sección `Tools -> Document Intelligence` en `src/loopdev/navigation.ts`.
- [x] Registrar las rutas en `src/routes/LoopdevRoutes.tsx`:
  - `/app/tools/document-intelligence`
  - `/app/tools/document-intelligence/:extractionId`
- [x] Implementar `ExtractionsMetrics.tsx` y `ExtractionsTable.tsx`.
- [x] Implementar `src/loopdev/pages/tools/document-intelligence/Overview.tsx`.

### Fase 4 — Componentes del Flujo de Extracción y Workspace Standalone
- [x] Implementar `ExtractionProgressLoader.tsx` (feedback de 4 pasos).
- [x] Implementar `ExtractionTransitionSpinner.tsx` (transición de 3s con `LogoSpinner`).
- [x] Implementar `ExtractionFieldItem.tsx`, `ExtractionFieldsGrid.tsx`, `ExtractionProfileSelector.tsx` y `ExtractionActionsBar.tsx`.
- [x] Implementar `ExtractionReviewPanel.tsx`.
- [x] Implementar `src/loopdev/pages/tools/document-intelligence/ExtractionWorkspace.tsx` con layout split-screen responsive.

### Fase 5 — Superficie Contextual en Drawer (`DocumentExtractionDrawer`) e Integraciones
- [x] Implementar `DocumentExtractionDrawer.tsx` sobre `AppDrawer` (`size="lg"`):
  - Acepta `open`, `onOpenChange`, documento inicial opcional (`initialFile?: File | Blob | string`) y callback de aplicación (`onApplyExtractedData: (fields: IdentityDocumentFields) => void`).
  - Ejecuta exactamente los mismos pasos: Dropzone (o preview directo si viene archivo) -> Preview interactivo con toolbar compacta -> Loader por pasos -> Transición de 3s con LogoSpinner -> Campos extraídos con botón principal **"Aplicar al contacto"**.
- [x] Conectar el Drawer en **Communications** (ejemplo: acción en mensajes con imagen/PDF en el hilo de chat de WhatsApp para extraer y actualizar la ficha del cliente).
- [x] Conectar el Drawer en **CRM Contacts** (botón *"Escanear DNI / Pasaporte"* en el alta/edición de contacto).

### Fase 6 — Verificación y Tests
- [x] Validar navegación completa de extremo a extremo en Standalone (Overview -> Iniciar extracción -> Dropzone/Fixture -> Preview -> Loader -> Spinner -> Split-Screen -> Confirmar -> Histórico).
- [x] Validar flujo contextual del Drawer en Communications y Contacts con pre-rellenado automático.
- [x] Pruebas unitarias de perfiles de exportación y split/build de apellidos.
- [x] Comprobar Typecheck, Lint y Build de producción.

---

## Criterios de aceptación

1. Acceso en el Sidebar bajo `Tools -> Document Intelligence` sin tarjeta en el Launchpad.
2. Pantalla 1 lista todas las extracciones del sistema (indicando suite origen: standalone, crm, communications) y permite pulsar "Iniciar extracción".
3. Al pulsar "Iniciar extracción" se navega a una URL única `/app/tools/document-intelligence/:extractionId`.
4. El dropzone permite subir un archivo o usar una muestra de prueba.
5. El preview permite manipular la visualización (zoom, pan, giro, recorte) antes de extraer.
6. El loader muestra los pasos de análisis del modelo y luego la transición de 3s con `LogoSpinner`.
7. El panel final muestra el split-screen con las 3 opciones de organización de campos y el botón de confirmación.
8. El `DocumentExtractionDrawer` replica con total fidelidad la misma secuencia para flujos contextuales (Communications y Contacts), permitiendo aplicar los datos directamente a la ficha del contacto.
9. Arquitectura modular y desacoplada sin duplicación de lógica ni componentes monolíticos.
10. `src/template/rivera/` permanece intacto sin ninguna modificación.
