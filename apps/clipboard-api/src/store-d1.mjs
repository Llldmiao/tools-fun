import {
  MAX_CLIPBOARD_ITEMS,
  assertRoomId,
  formatClipboardItem,
  sanitizeClipboardContent
} from "../../../packages/shared/src/index.mjs";

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
       ORDER BY created_at DESC, rowid DESC
       LIMIT ?`
    )
    .bind(normalizedRoomId, limit)
    .all();

  return (result.results ?? []).map(formatClipboardItem);
}
