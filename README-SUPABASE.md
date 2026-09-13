# SYNAX production persistence setup

This version moves SYNAX state out of the Vercel container's local filesystem and into Supabase Postgres.

## 1. Create the Supabase table

Open Supabase -> SQL Editor and run `supabase-schema.sql`.

## 2. Create the Vercel environment variables

In Vercel -> SYNAX -> Settings -> Environment Variables, add:

- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service-role key

Use the service-role key **only** as a Vercel server-side environment variable. Never put it in React, `VITE_*` variables, `.env` committed to GitHub, or browser code.

## 3. Redeploy

Push the project to GitHub and redeploy the Vercel project. The server will load the persisted SYNAX state from the `synax_state` row.

The server also creates the public `synax-uploads` Storage bucket automatically on startup when the service-role key is configured.

## 4. Test

Open `/api/health` on the deployed domain. It should return JSON with `ok: true` and `persistence: "supabase"`.

Then test admin login, user login, chat, logout/login, and calls from two browsers.

### Current architecture note

WebSocket/WebRTC signaling remains in the SYNAX server. Supabase is used for persistent state and file storage, not as a replacement for WebRTC.


## Required: session table for Vercel

Run the following schema in the Supabase SQL Editor before deploying the Vercel authentication fix. The app uses `public.synax_sessions` as the authoritative shared session store so login tokens are not lost when requests are handled by different Vercel container instances.

```sql
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
```
