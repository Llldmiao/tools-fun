import {
  CLIPBOARD_RETENTION_DAYS,
  MAX_CLIPBOARD_ITEMS,
  assertRoomId,
  formatClipboardItem,
  parseClipboardPayload
} from "../../../packages/shared/src/index.mjs";

const RETENTION_MS = CLIPBOARD_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function retentionCutoffIso(now = Date.now()) {
  return new Date(now - RETENTION_MS).toISOString();
}

export async function insertClipboardItem(db, roomId, rawPayload) {
  const normalizedRoomId = assertRoomId(roomId);
  const payload = parseClipboardPayload(rawPayload);
  const item =
    payload.type === "text"
      ? {
          id: crypto.randomUUID(),
          roomId: normalizedRoomId,
          type: "text",
          content: payload.content,
          fileName: null,
          mimeType: null,
          size: null,
          storageKey: null,
          createdAt: new Date().toISOString()
        }
      : {
          id: crypto.randomUUID(),
          roomId: normalizedRoomId,
          type: payload.type,
          content: null,
          fileName: payload.fileName,
          mimeType: payload.mimeType,
          size: payload.size,
          storageKey: payload.storageKey,
          createdAt: new Date().toISOString()
        };

  await db
    .prepare(
      `INSERT INTO clipboard_items (
         id, room_id, type, content, file_name, mime_type, size, storage_key, created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      item.id,
      item.roomId,
      item.type,
      item.content,
      item.fileName,
      item.mimeType,
      item.size,
      item.storageKey,
      item.createdAt
    )
    .run();

  return formatClipboardItem(item);
}

export async function listClipboardItems(db, roomId, limit = MAX_CLIPBOARD_ITEMS) {
  const normalizedRoomId = assertRoomId(roomId);
  const result = await db
    .prepare(
      `SELECT id, room_id, type, content, file_name, mime_type, size, storage_key, created_at
       FROM clipboard_items
       WHERE room_id = ?
         AND created_at >= ?
       ORDER BY created_at DESC, rowid DESC
       LIMIT ?`
    )
    .bind(normalizedRoomId, retentionCutoffIso(), limit)
    .all();

  return (result.results ?? []).map(formatClipboardItem);
}

export async function deleteExpiredClipboardItems(db) {
  return db
    .prepare(
      `DELETE FROM clipboard_items
       WHERE created_at < ?`
    )
    .bind(retentionCutoffIso())
    .run();
}

export async function listExpiredClipboardFileKeys(db) {
  const result = await db
    .prepare(
      `SELECT storage_key
       FROM clipboard_items
       WHERE created_at < ?
         AND storage_key IS NOT NULL`
    )
    .bind(retentionCutoffIso())
    .all();

  return (result.results ?? [])
    .map((row) => row.storage_key)
    .filter((value) => typeof value === "string" && value.length > 0);
}
