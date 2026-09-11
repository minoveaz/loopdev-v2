# Communications

Definición de producto de `Communications Core`, una capacidad transversal de LoopDev, y de `CRM Communications Inbox`, su primer consumidor operativo.

Communications no es una suite independiente en esta fase. Su owner transitorio es `crm`, sin que CRM sea propietario arquitectónico de proveedores, credenciales, webhooks, conversaciones, delivery, consentimiento o auditoría. La evolución hacia una suite o dominio independiente requiere una decisión de portfolio y de tracks aprobada.

## Definición transversal

- [Communications Core definition](COMMUNICATIONS_CORE_DEFINITION.md)

## Módulos en definición

- [Communications Core](communications-core/COMMUNICATIONS_CORE_UX_SPEC.md): paquete formal `proposed` para capacidades conversacionales, proveedores y políticas compartidas.
- [CRM Communications Inbox](crm-communications-inbox/CRM_COMMUNICATIONS_INBOX_UX_SPEC.md): paquete formal `proposed` para la primera experiencia operativa sobre WhatsApp Cloud.
- [Chatwoot -> LoopDev reference guide](crm-communications-inbox/CHATWOOT_LOOPDEV_REFERENCE_GUIDE.md): matriz de patrones operativos, adaptaciones y limites de portabilidad.

## Estado

La definición transversal y sus dos paquetes están `approved`. La aprobación no autoriza cambios directos en rutas, componentes, migraciones, proveedores, secretos, envío productivo ni RLS: cada Issue debe confirmar Definition of Ready y partir desde `develop` en su rama dedicada.

## Modelo de responsabilidad de superficies

La experiencia local-first del Inbox mantiene tres superficies contextuales, con una sola abierta a la vez:

1. **Chat**: comunicación directa con el cliente. El composer siempre es una respuesta saliente y muestra explícitamente el destinatario, el canal y el estado de entrega. Las notas internas nunca se envían desde esta superficie.
2. **Conversation Operations** (owner: Communications): estado de la conversación, ownership y handoff, colaboradores, watchers, presencia, drafting, lock/takeover/release del composer, notas internas específicas de la conversación y audit trail.
3. **CRM Context** (owner: CRM): contacto, lead, opportunity, Customer 360, tareas/actividades, notas CRM/timeline y quick actions CRM. Las notas CRM son distintas de las notas internas de la conversación.

Operations y CRM Context se abren desde el header del chat como drawer/sheet en desktop y mobile. Cerrar cualquiera conserva selección, filtros, borradores, scroll y el hilo.

La separación está implementada en la fase local-first 8G; no agrega Supabase, proveedores ni persistencia backend.

## Evidencia relacionada

- Contrato inicial: `packages/contracts/src/communications/communications.ts`.
- Persistencia y RLS: `supabase/migrations/20260829000000_communications_core_foundation.sql` y `supabase/migrations/20260902000000_crm_security_hardening.sql`.
- Webhook de WhatsApp Cloud: `supabase/functions/loopdev-whatsapp-webhook/index.ts`.
- Track de definición: `tracks/planned/crm/2026-08-29-communications-core-crm-inbox-definition.md`.
- [Handoff Docker/Supabase](COMMUNICATIONS_CORE_DOCKER_SUPABASE_HANDOFF.md): procedimiento único para validar cada fase en un entorno con runtime de base de datos.
