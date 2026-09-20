-- Communications inbox state required by the desktop/mobile adapter.
-- The canonical communication_* model remains the only persisted source.

alter table public.communication_conversations
  add column if not exists starred boolean not null default false,
  add column if not exists unread_count integer not null default 0 check (unread_count >= 0),
  add column if not exists last_read_at timestamptz,
  add column if not exists version integer not null default 1 check (version > 0),
  add column if not exists preview text,
  add column if not exists collaboration jsonb not null default '{}'::jsonb,
  add column if not exists audit_trail jsonb not null default '[]'::jsonb;

alter table public.communication_messages
  add column if not exists content_type text not null default 'text',
  add column if not exists content_metadata jsonb,
  add column if not exists author_id uuid references auth.users(id) on delete set null,
  add column if not exists author_name text,
  add column if not exists idempotency_key text,
  add constraint communication_messages_content_type_check
    check (content_type in ('text', 'document', 'audio', 'image', 'video', 'location', 'link', 'catalog_item'));

alter table public.communication_internal_notes
  add column if not exists idempotency_key text,
  add column if not exists author_name text;

create unique index if not exists communication_messages_idempotency_idx
  on public.communication_messages(organization_id, conversation_id, idempotency_key)
  where idempotency_key is not null;
create unique index if not exists communication_internal_notes_idempotency_idx
  on public.communication_internal_notes(organization_id, conversation_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists communication_conversations_unread_idx
  on public.communication_conversations(organization_id, unread_count, updated_at desc);

create or replace function public.communication_touch_conversation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.communication_conversations
  set preview = coalesce(new.body, preview),
      last_activity_at = new.created_at,
      updated_at = now(),
      version = version + 1
  where id = new.conversation_id
    and organization_id = new.organization_id;
  return new;
end;
$$;

drop trigger if exists communication_messages_touch_conversation on public.communication_messages;
create trigger communication_messages_touch_conversation
after insert on public.communication_messages
for each row execute function public.communication_touch_conversation();

create or replace function public.communication_count_inbound_message()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.direction = 'inbound' then
    update public.communication_conversations
    set unread_count = unread_count + 1
    where id = new.conversation_id
      and organization_id = new.organization_id
      and (last_read_at is null or new.created_at > last_read_at);
  end if;
  return new;
end;
$$;

drop trigger if exists communication_messages_count_inbound on public.communication_messages;
create trigger communication_messages_count_inbound
after insert on public.communication_messages
for each row execute function public.communication_count_inbound_message();

comment on column public.communication_conversations.collaboration is 'Canonical JSON state for assignee, collaborators, watchers, presence, drafting, locks and handoff.';
comment on column public.communication_conversations.audit_trail is 'Append-only communication conversation audit events.';
