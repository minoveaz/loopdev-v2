-- Preserve audit identity when an Auth user is removed.
-- actor_id remains the live reference while the user exists; the snapshot
-- fields keep historical attribution after the FK is detached.
alter table public.crm_timeline_events
  add column if not exists actor_email text,
  add column if not exists actor_display_name text,
  add column if not exists actor_detached_at timestamptz;

-- Backfill existing events before users can be removed. The append-only
-- trigger is suspended only for this controlled metadata backfill.
drop trigger if exists crm_timeline_events_append_only on public.crm_timeline_events;
update public.crm_timeline_events event
set actor_email = auth_user.email,
    actor_display_name = coalesce(
      nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
      nullif(auth_user.raw_user_meta_data ->> 'name', ''),
      auth_user.email
    )
from auth.users auth_user
where event.actor_id = auth_user.id
  and (event.actor_email is null or event.actor_display_name is null);

create or replace function public.crm_snapshot_timeline_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_record record;
begin
  if new.actor_id is not null then
    select email,
           coalesce(
             nullif(raw_user_meta_data ->> 'full_name', ''),
             nullif(raw_user_meta_data ->> 'name', ''),
             email
           ) as display_name
    into actor_record
    from auth.users
    where id = new.actor_id;

    if actor_record.email is not null then
      new.actor_email := actor_record.email;
      new.actor_display_name := actor_record.display_name;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.crm_snapshot_timeline_actor() from public;

drop trigger if exists crm_timeline_events_actor_snapshot on public.crm_timeline_events;
create trigger crm_timeline_events_actor_snapshot
before insert on public.crm_timeline_events
for each row execute function public.crm_snapshot_timeline_actor();

create or replace function public.prevent_crm_timeline_event_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and old.actor_id is not null
     and new.actor_id is null
     and old.actor_email is not distinct from new.actor_email
     and old.actor_display_name is not distinct from new.actor_display_name
     and old.actor_detached_at is null then
    new.actor_detached_at := now();
    return new;
  end if;
  raise exception 'crm_timeline_events is append-only';
end;
$$;

revoke all on function public.prevent_crm_timeline_event_mutation() from public;

drop trigger if exists crm_timeline_events_append_only on public.crm_timeline_events;
create trigger crm_timeline_events_append_only
before update or delete on public.crm_timeline_events
for each row execute function public.prevent_crm_timeline_event_mutation();