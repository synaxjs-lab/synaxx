# SYNAXJS Cloudflare V3 Fix

This version keeps the original application and Cloudflare Worker architecture, but fixes a Supabase authentication issue with the new `sb_secret_*` API keys.

Supabase's current API-key guidance requires publishable/secret keys to be sent through the `apikey` header; they are not JWTs and should not be sent as `Authorization: Bearer ...`.

The worker now:
- supports `SUPABASE_SECRET_KEY`, legacy `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_SECRET_KEYS` JSON
- sends opaque `sb_secret_*` keys only in `apikey`
- keeps Bearer auth only for legacy JWT-style service-role keys
- makes storage-bucket creation non-blocking at startup
- exposes the backend's actual initialization error in the frontend instead of replacing it with a generic message
