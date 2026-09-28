# Cloudflare build verification

Expected:
- Vite builds `dist/` successfully.
- Wrangler uses `worker/index.ts` as the Worker entry point.
- `server.cloudflare.ts` is bundled into the Worker through `httpServerHandler`.
- `worker/realtime.ts` becomes the `SynaxRealtimeHub` Durable Object.
- `/api/*` is handled by the Worker, not served as static files.
- `/ws` is handled by the Durable Object.
- all persistent state uses Supabase.
