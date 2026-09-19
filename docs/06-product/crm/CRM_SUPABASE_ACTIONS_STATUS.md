# CRM Supabase actions status

Estado de las acciones auditadas en la rama actual. Este documento registra
bloqueos de implementación, no convierte contratos incompletos en evidencia de
runtime.

| Área | Desktop | Mobile | Estado y acción restante |
| --- | --- | --- | --- |
| Oportunidades CRM | Adaptador Supabase con reapertura, conflicto temporal, historial y conversión idempotente | Adaptador Supabase con reapertura terminal, razón, conflicto temporal e historial; conversión avanzada aún depende del flujo expuesto | Ejecutar pruebas de integración contra Supabase local y cubrir conversión móvil idempotente antes de release |
| Notas | `supabaseNotesAdapter`: listar, crear, actualizar y borrar sobre `crm_notes`; fallback sólo para tenant local | REST sobre `crm_notes` con relaciones CRM, versionado optimista, conflictos y borrado consistente; fallback sólo para tenant local | Implementado y validado con typecheck y 12 tests. Falta validar Auth/RLS y adjuntos cuando Storage esté habilitado |
| Tareas | Contrato/UI existentes | Reutiliza `SupabaseTasksAdapter`, pero falta evidencia de recorrido móvil CRM completo | Verificar operaciones CRUD, concurrencia, permisos y journey desktop/mobile contra Supabase local |
| Comunicaciones | No hay adaptador CRM Supabase completo identificado en esta slice | No hay adaptador móvil de comunicaciones identificado | Bloqueado: definir el consumidor/adaptador Platform Communications, sus contratos y evidencia antes de inventar endpoints |

## Acciones restantes

- Levantar Supabase local y ejecutar pruebas de integración para oportunidades.
- Añadir pruebas de contrato para `reopenOpportunity` y conversión idempotente en
  ambos renderers.
- Validar Notes con una sesión Auth real y RLS; los adjuntos siguen bloqueados
  mientras Storage permanezca desactivado en el perfil local.
- Registrar y verificar el adaptador Communications cuando exista un contrato y
  consumidor runtime.