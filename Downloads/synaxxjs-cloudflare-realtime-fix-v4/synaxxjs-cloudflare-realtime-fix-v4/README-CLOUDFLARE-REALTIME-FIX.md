# SYNAXJS Cloudflare Realtime + Time Performance Build

This is a Cloudflare-specific copy of SYNAXJS. The original `server.ts` Railway server is preserved and is not used as the Cloudflare Worker entrypoint.

## What this build changes

### Messaging
- Text messages render optimistically before the Supabase write finishes.
- Every send gets a `clientMessageId` so retries are idempotent and do not duplicate a message.
- Server persistence remains canonical in `synax_messages`.
- Durable Object WebSockets deliver new messages immediately to connected clients.
- Read state is sent over the WebSocket when possible, with one HTTP fallback if the socket is unavailable.
- Message reconciliation runs on reconnect/visibility changes and only polls while the WebSocket is disconnected.
- WebSocket reconnects use backoff rather than hammering the Worker every few seconds.
- Online recipients get a background delivered-state update after a message is broadcast.

### Time and presence
- The authoritative timer remains in Supabase through `synax_user_usage`.
- `/api/time` is a lightweight endpoint and reuses the authenticated request's time calculation.
- Browser countdown rendering uses the server clock offset instead of trusting the local clock.
- Presence heartbeats are reduced to one every 5 seconds while the chat is focused/visible.
- Presence broadcasts use a small per-user delta instead of rereading both user rows on every heartbeat.
- India Standard Time (`Asia/Kolkata`) is used for displayed message, last-seen, and admin log times.

### Cloudflare realtime
- `/ws` is handled by `SynaxRealtimeHub`, a Durable Object.
- WebSocket hibernation is used.
- Automatic ping/pong responses keep idle connections healthy without waking the Durable Object for every ping.
- Supabase secret keys are sent as `apikey`; legacy JWT service-role keys also get the legacy Bearer header.

## Supabase requirements

Run the complete `supabase-schema.sql` in the Supabase project used by this Worker. The schema includes:

- `synax_state`
- `synax_sessions`
- `synax_call_signals`
- `synax_messages`
- `synax_user_usage`
- the `synax-uploads` storage bucket

## Cloudflare secrets

Set these as Worker secrets/variables:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Never put the secret key in a `VITE_*` variable or commit it to Git. Supabase documents `sb_secret_*` keys as backend-only keys and recommends sending them in the `apikey` header. 

## Cloudflare build settings

Build command:

```text
npm run build
```

Deploy command:

```text
npx wrangler deploy
```

Worker entrypoint:

```text
worker/index.ts
```

No Railway application port is required for the Worker deployment.
