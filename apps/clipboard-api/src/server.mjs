import http from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, dirname, extname, resolve } from "node:path";
import { URL } from "node:url";

import {
  MAX_CLIPBOARD_ITEMS,
  assertRoomId,
  getClipboardItemTypeForMimeType,
  parseClipboardPayload,
  sanitizeClipboardFileName,
  sanitizeClipboardFileSize,
  resolveClipboardMimeType,
  sanitizeClipboardStorageKey
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

async function readFormDataBody(req, url) {
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req,
    duplex: "half"
  });
  return request.formData();
}

function createStorageKey(roomId, fileName) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const extension = extname(fileName).slice(0, 16).toLowerCase();
  const baseName = basename(fileName, extname(fileName))
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";

  return `rooms/${roomId}/${year}/${month}/${day}/${randomUUID()}-${baseName}${extension}`;
}

function resolveStoragePath(rootDir, storageKey) {
  const target = resolve(rootDir, storageKey);
  if (target !== rootDir && !target.startsWith(`${rootDir}/`)) {
    throw new Error("Storage key is invalid.");
  }
  return target;
}

function setDownloadHeaders(res, mimeType, fileName, size) {
  const disposition = mimeType.startsWith("image/") ? "inline" : "attachment";
  res.writeHead(200, {
    "content-type": mimeType,
    "content-length": String(size),
    "content-disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    "cache-control": "private, max-age=604800, immutable"
  });
}

export function createClipboardServer({
  dbPath,
  port = 8787,
  host = "127.0.0.1",
  corsOrigin = "http://127.0.0.1:5173"
}) {
  const store = createClipboardStore({ dbPath });
  const roomStreams = new Map();
  const uploadsDir = resolve(dirname(dbPath), "uploads");

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

    const fileRoute = url.pathname.match(/^\/api\/files\/(.+)$/);
    if (req.method === "GET" && fileRoute) {
      try {
        const storageKey = sanitizeClipboardStorageKey(decodeURIComponent(fileRoute[1]));
        const item = store.getItemByStorageKey(storageKey);
        if (!item || !item.storageKey || !item.fileName || !item.mimeType || item.size == null) {
          json(res, 404, { error: "File not found." }, originHeaders);
          return;
        }

        const filePath = resolveStoragePath(uploadsDir, storageKey);
        const fileBuffer = await readFile(filePath);
        setDownloadHeaders(res, item.mimeType, item.fileName, fileBuffer.byteLength);
        res.end(fileBuffer);
      } catch (error) {
        const statusCode = error && typeof error === "object" && "code" in error && error.code === "ENOENT" ? 404 : 422;
        json(res, statusCode, { error: statusCode === 404 ? "File not found." : error.message }, originHeaders);
      }
      return;
    }

    const routeMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/(items|stream|uploads)$/);
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
        const item = store.insertItem(roomId, payload);
        broadcast(roomId, { type: "item_created", item });
        json(res, 201, { item }, originHeaders);
        return;
      }

      if (req.method === "POST" && resource === "uploads") {
        const formData = await readFormDataBody(req, url);
        const file = formData.get("file");
        if (!(file instanceof File)) {
          throw new Error("A file is required.");
        }

        const fileName = sanitizeClipboardFileName(file.name);
        const mimeType = resolveClipboardMimeType(file.type, file.name);
        const size = sanitizeClipboardFileSize(file.size);
        const type = getClipboardItemTypeForMimeType(mimeType);
        const payload = parseClipboardPayload({
          type,
          fileName,
          mimeType,
          size,
          storageKey: createStorageKey(roomId, fileName)
        });
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const storagePath = resolveStoragePath(uploadsDir, payload.storageKey);

        await mkdir(dirname(storagePath), { recursive: true });
        await writeFile(storagePath, fileBuffer);

        json(
          res,
          201,
          {
            upload: {
              fileName: payload.fileName,
              mimeType: payload.mimeType,
              size: payload.size,
              storageKey: payload.storageKey,
              type
            }
          },
          originHeaders
        );
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
      await mkdir(uploadsDir, { recursive: true });
      await new Promise((resolvePromise, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.off("error", reject);
          resolvePromise(undefined);
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
      await new Promise((resolvePromise, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolvePromise(undefined);
        });
      });
      store.close();
      await rm(uploadsDir, { recursive: true, force: true });
    }
  };
}
