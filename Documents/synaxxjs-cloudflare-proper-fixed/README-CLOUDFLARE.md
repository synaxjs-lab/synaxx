# SYNAXJS — Cloudflare build

This folder is a Cloudflare-specific build derived from the original SYNAXJS project.
The original `server.ts` and Railway deployment model are retained for reference; Cloudflare uses
`worker/index.ts` + `worker/realtime.ts` + `server.cloudflare.ts`.

## Supabase

Create a NEW Supabase project if you want a clean test database.

1. Open Supabase SQL Editor.
2. Run `supabase-schema.sql` completely.
3. Copy the Project URL.
4. Create/use a server-side secret key.
5. In Cloudflare Worker Variables/Secrets add:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`

Never put the secret in `VITE_*` variables or frontend source.

## Cloudflare

Recommended Git-connected Worker settings:

Build command:
    npm run build

Deploy command:
    npx wrangler deploy

Wrangler reads `wrangler.jsonc`.

The Worker serves the Vite SPA through `ASSETS`, handles `/api/*` with the Cloudflare-compatible Express server,
and routes `/ws` to the `SynaxRealtimeHub` Durable Object.

## Local checks

    npm install
    npm run build

Optional local Worker:

    npx wrangler dev

## First tests after deployment

    /api/health
    /api/public/identities

Then test:
- login
- chat history
- send message between both users
- reactions/edit/delete/pin
- presence
- file/image upload
- admin panel
- voice/video call signaling

The new Supabase project starts empty; the API seeds `synax_state` on first startup.
