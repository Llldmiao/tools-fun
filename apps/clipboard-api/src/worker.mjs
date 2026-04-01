import {
  CLIPBOARD_RETENTION_DAYS,
  assertRoomId,
  parseClipboardPayload
} from "../../../packages/shared/src/index.mjs";
import { RoomDurableObject } from "./room-do.mjs";
import { deleteExpiredClipboardItems, insertClipboardItem, listClipboardItems } from "./store-d1.mjs";

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
  return pathname.match(/^\/api\/rooms\/([^/]+)\/(items|stream)$/);
}

function roomStub(env, roomId) {
  const id = env.ROOMS.idFromName(roomId);
  return env.ROOMS.get(id);
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
          const item = await insertClipboardItem(env.DB, normalizedRoomId, payload.content);

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
    await deleteExpiredClipboardItems(env.DB);
  }
};

export { RoomDurableObject };
