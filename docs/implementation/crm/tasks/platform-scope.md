# Platform Scope: Tasks Module

**Módulo:** `tasks`  
**Run ID:** `MOD-TASKS-20260915-001`  

## Alcance Multiplataforma

| Plataforma | Soporte | Componentes / Adaptadores |
| :--- | :---: | :--- |
| **Desktop Web** | ✅ | Formulario completo, panel lateral en CRM Workspace, lista en Customer 360 |
| **Mobile Web** | ✅ | Tarjetas táctiles compactas, modal de creación rápida, checkbox con feedback |
| **iOS / Android (PWA/Capacitor)** | ✅ | Soporte nativo de touch targets (>44px), modo offline con fallback local |

## Dependencias de Capacidad
- `PlatformAuthPort` / `TenantContextPort` (Aislamiento por `organization_id`)
- `ActivityTimelinePort` (Emisión de eventos automáticos al completar tareas)
