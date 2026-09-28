import fs from "node:fs";

const required = [
  "package.json",
  "server.ts",
  "server.cloudflare.ts",
  "worker/index.ts",
  "worker/realtime.ts",
  "wrangler.jsonc",
  "supabase-schema.sql",
  "src/services/api.ts",
  "src/services/socket.ts",
  "index.html",
];

const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error("Missing required files:", missing.join(", "));
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const wrangler = JSON.parse(fs.readFileSync("wrangler.jsonc", "utf8"));

if (pkg.scripts?.build !== "vite build") {
  throw new Error("Cloudflare build script must be: vite build");
}
if (wrangler.main !== "./worker/index.ts") {
  throw new Error("wrangler main must be ./worker/index.ts");
}
if (wrangler.assets?.binding !== "ASSETS") {
  throw new Error("ASSETS binding is missing");
}
if (!wrangler.durable_objects?.bindings?.some((b) => b.name === "SYNAX_REALTIME_HUB")) {
  throw new Error("SYNAX_REALTIME_HUB Durable Object binding is missing");
}

console.log("SYNAX Cloudflare project structure: OK");
