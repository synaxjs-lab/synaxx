# Cloudflare dependency fix

Cloudflare's build was failing before the project build because the package.json requested
`@cloudflare/workers-types@^4.20260920.0`, a version that does not exist in the npm registry.

This copy pins the currently published v5 package to:

`@cloudflare/workers-types@5.20260926.1`

Cloudflare's current documentation recommends Workers Types v5+ (or generating types with `wrangler types`).
