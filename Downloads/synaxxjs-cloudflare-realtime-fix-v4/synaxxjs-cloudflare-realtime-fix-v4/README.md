# SYNAXJS — Cloudflare-specific project

This repository is a Cloudflare deployment variant of the original SYNAXJS project.

## Important
- `server.ts` is the original Node/Railway server and is intentionally preserved unchanged.
- Cloudflare uses `server.cloudflare.ts` for the API, `worker/index.ts` as the Worker entry point, and `worker/realtime.ts` as the Durable Object realtime server.
- Persistent state and call signaling use Supabase.
- WebSocket chat/events use a Cloudflare Durable Object at `/ws`.

## Supabase
Create a fresh Supabase project and run `supabase-schema.sql` in the SQL Editor.

Then add these as Cloudflare Worker secrets/variables:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Do not expose the secret to Vite/frontend code.

## Cloudflare deployment
Connect this GitHub repository to Cloudflare Workers Builds.

Build command:
`npm run build`

Deploy command:
`npx wrangler deploy`

Wrangler uses `wrangler.jsonc`, which points to `worker/index.ts`.

## Quick verification after deployment
1. `https://YOUR-WORKER-DOMAIN/api/health`
2. `https://YOUR-WORKER-DOMAIN/api/public/identities`
3. Login as a user
4. Test chat messaging in two browsers
5. Test typing/read/reaction/edit/delete/pin
6. Test upload
7. Test admin controls
8. Test WebRTC signaling

The Cloudflare version is intentionally separate from the original Railway deployment.
