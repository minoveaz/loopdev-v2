create table if not exists public.organization_invitation_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists organization_invitation_tokens_lookup
  on public.organization_invitation_tokens(token_hash, expires_at)
  where used_at is null;

alter table public.organization_invitation_tokens enable row level security;
revoke all on public.organization_invitation_tokens from anon, authenticated;
grant all on public.organization_invitation_tokens to service_role;
