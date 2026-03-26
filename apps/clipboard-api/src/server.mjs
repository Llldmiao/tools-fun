import http from "node:http";
import { URL } from "node:url";

import {
  MAX_CLIPBOARD_ITEMS,
  assertRoomId,
  parseClipboardPayload
} from "@tools-fun/shared";
import { createClipboardStore } from "./store.mjs";

function json(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

function withCors(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "origin"
  };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createClipboardServer({
  dbPath,
  port = 8787,
  host = "127.0.0.1",
  corsOrigin = "http://127.0.0.1:5173"
}) {
  const store = createClipboardStore({ dbPath });
  const roomStreams = new Map();

  function broadcast(roomId, event) {
    const listeners = roomStreams.get(roomId);
    if (!listeners) return;

    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const res of listeners) {
      res.write(payload);
    }
  }

  function addStream(roomId, res) {
    const listeners = roomStreams.get(roomId) ?? new Set();
    listeners.add(res);
    roomStreams.set(roomId, listeners);
  }

  function removeStream(roomId, res) {
    const listeners = roomStreams.get(roomId);
    if (!listeners) return;
    listeners.delete(res);
    if (listeners.size === 0) {
      roomStreams.delete(roomId);
    }
  }

  const server = http.createServer(async (req, res) => {
    const originHeaders = withCors(corsOrigin);
    if (!req.url || !req.method) {
      json(res, 400, { error: "Bad request." }, originHeaders);
      return;
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204, originHeaders);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? `${host}:${port}`}`);

    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, { ok: true }, originHeaders);
      return;
    }

    const routeMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/(items|stream)$/);
    if (!routeMatch) {
      json(res, 404, { error: "Not found." }, originHeaders);
      return;
    }

    try {
      const roomId = assertRoomId(routeMatch[1]);
      const resource = routeMatch[2];

      if (req.method === "GET" && resource === "items") {
        const items = store.listItems(roomId, MAX_CLIPBOARD_ITEMS);
        json(res, 200, { items }, originHeaders);
        return;
      }

      if (req.method === "POST" && resource === "items") {
        const body = await readJsonBody(req);
        const payload = parseClipboardPayload(body);
        const item = store.insertItem(roomId, payload.content);
        broadcast(roomId, { type: "item_created", item });
        json(res, 201, { item }, originHeaders);
        return;
      }

      if (req.method === "GET" && resource === "stream") {
        res.writeHead(200, {
          ...originHeaders,
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive"
        });
        res.write(": connected\n\n");

        addStream(roomId, res);

        const heartbeat = setInterval(() => {
          res.write(": heartbeat\n\n");
        }, 15000);

        req.on("close", () => {
          clearInterval(heartbeat);
          removeStream(roomId, res);
        });
        return;
      }

      json(res, 405, { error: "Method not allowed." }, originHeaders);
    } catch (error) {
      const statusCode = error instanceof SyntaxError ? 400 : 422;
      json(res, statusCode, { error: error.message }, originHeaders);
    }
  });

  return {
    store,
    async start() {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.off("error", reject);
          resolve(undefined);
        });
      });
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      return {
        host,
        port: actualPort,
        url: `http://${host}:${actualPort}`
      };
    },
    async stop() {
      for (const listeners of roomStreams.values()) {
        for (const res of listeners) {
          res.end();
        }
      }
      roomStreams.clear();
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(undefined);
        });
      });
      store.close();
    }
  };
}
