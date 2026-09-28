# Cloudflare realtime/time hardening

- Added optimistic message rendering with clientMessageId reconciliation.
- Removed the per-request full `synax_state` refresh from the Express API middleware.
- Added short TTL caching for state and authenticated sessions.
- Added a dedicated `/api/time` endpoint.
- Reduced message reconciliation polling to reconnect/visibility driven recovery.
- Added WebSocket read/delivery persistence through the Durable Object.
- Added WebSocket ping/pong auto-response.
- Added reconnect backoff.
- Made the UI timer derive remaining seconds from the corrected server clock.
- Standardized displayed times on Asia/Kolkata.
- Tightened the presence heartbeat grace window to 8 seconds.
