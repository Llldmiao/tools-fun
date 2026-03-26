import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

import {
  MAX_CLIPBOARD_ITEMS,
  assertRoomId,
  formatClipboardItem,
  sanitizeClipboardContent
} from "@tools-fun/shared";

export function createClipboardStore({ dbPath }) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS clipboard_items (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clipboard_items_room_created
      ON clipboard_items (room_id, created_at DESC);
  `);

  const insertStmt = db.prepare(`
    INSERT INTO clipboard_items (id, room_id, content, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const listStmt = db.prepare(`
    SELECT id, room_id, content, created_at
    FROM clipboard_items
    WHERE room_id = ?
    ORDER BY created_at DESC, rowid DESC
    LIMIT ?
  `);

  return {
    insertItem(roomId, rawContent) {
      const normalizedRoomId = assertRoomId(roomId);
      const content = sanitizeClipboardContent(rawContent);
      const item = {
        id: randomUUID(),
        roomId: normalizedRoomId,
        content,
        createdAt: new Date().toISOString()
      };

      insertStmt.run(item.id, item.roomId, item.content, item.createdAt);
      return item;
    },

    listItems(roomId, limit = MAX_CLIPBOARD_ITEMS) {
      const normalizedRoomId = assertRoomId(roomId);
      const rows = listStmt.all(normalizedRoomId, limit);
      return rows.map(formatClipboardItem);
    },

    close() {
      db.close();
    }
  };
}
