import {
  CLIPBOARD_RETENTION_DAYS,
  assertRoomId,
  getClipboardItemTypeForMimeType,
  parseClipboardPayload,
  sanitizeClipboardFileName,
  sanitizeClipboardFileSize,
  resolveClipboardMimeType,
  sanitizeClipboardStorageKey
} from "../../../packages/shared/src/index.mjs";
import { RoomDurableObject } from "./room-do.mjs";
import {
  deleteExpiredClipboardItems,
  insertClipboardItem,
  listClipboardItems,
  listExpiredClipboardFileKeys
} from "./store-d1.mjs";

function json(payload, init = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(payload), {
    ...init,
    headers
  });
}

function matchRoomRoute(pathname) {
  return pathname.match(/^\/api\/rooms\/([^/]+)\/(items|stream|uploads)$/);
}

function roomStub(env, roomId) {
  const id = env.ROOMS.idFromName(roomId);
  return env.ROOMS.get(id);
}

function requireFilesBucket(env) {
  if (!env.FILES) {
    throw new Error("R2 bucket binding FILES is not available in this environment.");
  }
  return env.FILES;
}

function createStorageKey(roomId, fileName) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop().toLowerCase()}` : "";
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";

  return `rooms/${roomId}/${year}/${month}/${day}/${crypto.randomUUID()}-${baseName}${extension}`;
}

function fileResponse(object, fileName) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", object.httpMetadata?.contentType ?? "application/octet-stream");
  }
  const mimeType = headers.get("content-type") ?? "application/octet-stream";
  const disposition = mimeType.startsWith("image/") ? "inline" : "attachment";
  headers.set("content-disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  headers.set("cache-control", "private, max-age=604800, immutable");

  return new Response(object.body, { headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        runtime: "cloudflare-worker",
        mode: "bootstrap",
        retentionDays: CLIPBOARD_RETENTION_DAYS
      });
    }

    const fileRoute = url.pathname.match(/^\/api\/files\/(.+)$/);
    if (request.method === "GET" && fileRoute) {
      try {
        const storageKey = sanitizeClipboardStorageKey(decodeURIComponent(fileRoute[1]));
        const filesBucket = requireFilesBucket(env);
        const object = await filesBucket.get(storageKey);
        if (!object) {
          return json({ error: "File not found." }, { status: 404 });
        }

        const fileName = object.customMetadata?.fileName ?? "download";
        return fileResponse(object, fileName);
      } catch (error) {
        return json(
          { error: error instanceof Error ? error.message : "Request failed." },
          { status: 422 }
        );
      }
    }

    const roomRoute = matchRoomRoute(url.pathname);
    if (roomRoute) {
      const [, roomId, resource] = roomRoute;

      try {
        const normalizedRoomId = assertRoomId(roomId);

        if (resource === "items" && request.method === "GET") {
          const items = await listClipboardItems(env.DB, normalizedRoomId);
          return json({ items });
        }

        if (resource === "items" && request.method === "POST") {
          const body = await request.json();
          const payload = parseClipboardPayload(body);
          const item = await insertClipboardItem(env.DB, normalizedRoomId, payload);

          await roomStub(env, normalizedRoomId).fetch("https://room.internal/__broadcast", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              type: "item_created",
              item
            })
          });

          return json({ item }, { status: 201 });
        }

        if (resource === "uploads" && request.method === "POST") {
          const formData = await request.formData();
          const file = formData.get("file");
          if (!(file instanceof File)) {
            throw new Error("A file is required.");
          }

          const fileName = sanitizeClipboardFileName(file.name);
          const mimeType = resolveClipboardMimeType(file.type, file.name);
          const size = sanitizeClipboardFileSize(file.size);
          const type = getClipboardItemTypeForMimeType(mimeType);
          const storageKey = createStorageKey(normalizedRoomId, fileName);
          const payload = parseClipboardPayload({
            type,
            fileName,
            mimeType,
            size,
            storageKey
          });

          const filesBucket = requireFilesBucket(env);
          await filesBucket.put(payload.storageKey, file.stream(), {
            httpMetadata: {
              contentType: payload.mimeType
            },
            customMetadata: {
              fileName: payload.fileName,
              roomId: normalizedRoomId,
              createdAt: new Date().toISOString()
            }
          });

          return json(
            {
              upload: {
                fileName: payload.fileName,
                mimeType: payload.mimeType,
                size: payload.size,
                storageKey: payload.storageKey,
                type
              }
            },
            { status: 201 }
          );
        }

        if (resource === "stream" && request.method === "GET") {
          return roomStub(env, normalizedRoomId).fetch(request);
        }

        return json({ error: "Method not allowed." }, { status: 405 });
      } catch (error) {
        const status = error instanceof SyntaxError ? 400 : 422;
        return json(
          {
            error: error instanceof Error ? error.message : "Request failed."
          },
          { status }
        );
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found." }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller, env) {
    const expiredKeys = await listExpiredClipboardFileKeys(env.DB);
    if (expiredKeys.length > 0) {
      const filesBucket = requireFilesBucket(env);
      await filesBucket.delete(expiredKeys);
    }
    await deleteExpiredClipboardItems(env.DB);
  }
};

export { RoomDurableObject };
