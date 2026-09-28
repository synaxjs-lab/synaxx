# SYNAXJS Cloudflare runtime fix

This build is based on the original SYNAXJS project with the Cloudflare-specific runtime adapter.

Fixes included:
- Defines the Cloudflare upload middleware with `multer.memoryStorage()` before `/api/upload` is registered.
- Restores the original call-signaling helpers used by `/api/call/signal` and `/api/call/signals`.
- Keeps the original Railway `server.ts` intact.
- Keeps the Cloudflare Worker entrypoint and Durable Object realtime layer.

Required Cloudflare variables:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
