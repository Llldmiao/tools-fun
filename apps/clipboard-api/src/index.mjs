import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClipboardServer } from "./server.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dbPath = resolve(root, "data", "clipboard.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });

const host = process.env.CLIPBOARD_API_HOST ?? "127.0.0.1";
const port = Number(process.env.CLIPBOARD_API_PORT ?? "8787");
const corsOrigin = process.env.CLIPBOARD_WEB_ORIGIN ?? "http://127.0.0.1:5173";

const app = createClipboardServer({ dbPath, host, port, corsOrigin });
const details = await app.start();

console.log(`Clipboard API listening on ${details.url}`);

async function shutdown() {
  await app.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
