# SYNAX Cloudflare Performance / Realtime Fix

This build keeps the original SYNAX UI and API surface but moves Cloudflare-sensitive state out of Worker globals.

## Required Supabase migration
Run the complete `supabase-schema.sql` in the new Supabase project. It adds:
- `synax_messages` for canonical chat storage
- `synax_user_usage` for cross-isolate time/presence state

## What this fixes
- Message send is immediately rendered from the API response.
- `clientMessageId` makes transient retries idempotent.
- A 2.5-second reconciliation poll recovers missed realtime events.
- WebSocket Supabase authentication supports `sb_secret_*` keys correctly.
- Presence and active-use time are stored in Supabase instead of a per-isolate Map.
- Time uses server clock offset correction and the UI displays India time for message timestamps.
- Editing, deleting, pinning, reactions, read state, admin message view, and chat history clear use the canonical message table.

## Cloudflare variables
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`


Performance hardening in this build includes: optimistic text rendering with clientMessageId reconciliation, cached session/state reads, no per-request full state hydration, a dedicated lightweight /api/time endpoint, server-clock-based countdown rendering, WebSocket-driven read/delivery updates, visibility-aware reconciliation, and backoff reconnects.
