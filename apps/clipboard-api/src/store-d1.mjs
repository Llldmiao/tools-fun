import {
  CLIPBOARD_RETENTION_DAYS,
  MAX_CLIPBOARD_ITEMS,
  assertRoomId,
  formatClipboardItem,
  sanitizeClipboardContent
} from "../../../packages/shared/src/index.mjs";

const RETENTION_MS = CLIPBOARD_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function retentionCutoffIso(now = Date.now()) {
  return new Date(now - RETENTION_MS).toISOString();
}

export async function insertClipboardItem(db, roomId, rawContent) {
  const normalizedRoomId = assertRoomId(roomId);
  const content = sanitizeClipboardContent(rawContent);
  const item = {
    id: crypto.randomUUID(),
    roomId: normalizedRoomId,
    content,
    createdAt: new Date().toISOString()
  };

  await db
    .prepare(
      `INSERT INTO clipboard_items (id, room_id, content, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(item.id, item.roomId, item.content, item.createdAt)
    .run();

  return item;
}

export async function listClipboardItems(db, roomId, limit = MAX_CLIPBOARD_ITEMS) {
  const normalizedRoomId = assertRoomId(roomId);
  const result = await db
    .prepare(
      `SELECT id, room_id, content, created_at
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
