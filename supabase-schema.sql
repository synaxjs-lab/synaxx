-- SYNAX persistent state store
-- Run this once in the Supabase SQL Editor.
create table if not exists public.synax_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- The SYNAX server uses the service-role key server-side, so public clients do not need direct table access.
alter table public.synax_state enable row level security;



create table if not exists public.synax_sessions (
  token text primary key,
  user_id text not null check (user_id in ('person_1', 'person_2', 'admin')),
  session_start bigint not null,
  last_active bigint not null,
  allowed_seconds bigint not null,
  is_expired boolean not null default false,
  active boolean not null default false,
  ended_at bigint
);

alter table public.synax_sessions enable row level security;
