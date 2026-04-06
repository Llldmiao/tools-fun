import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

import {
  MAX_CLIPBOARD_ITEMS,
  assertRoomId,
  formatClipboardItem,
  parseClipboardPayload
} from "@tools-fun/shared";

export function createClipboardStore({ dbPath }) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS clipboard_items (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT,
      file_name TEXT,
      mime_type TEXT,
      size INTEGER,
      storage_key TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clipboard_items_room_created
      ON clipboard_items (room_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_clipboard_items_storage_key
      ON clipboard_items (storage_key);
  `);

  const columns = db.prepare("PRAGMA table_info(clipboard_items)").all();
  const columnNames = new Set(columns.map((column) => String(column.name)));
  if (!columnNames.has("type")) {
    db.exec("ALTER TABLE clipboard_items ADD COLUMN type TEXT NOT NULL DEFAULT 'text'");
  }
  if (!columnNames.has("file_name")) {
    db.exec("ALTER TABLE clipboard_items ADD COLUMN file_name TEXT");
  }
  if (!columnNames.has("mime_type")) {
    db.exec("ALTER TABLE clipboard_items ADD COLUMN mime_type TEXT");
  }
  if (!columnNames.has("size")) {
    db.exec("ALTER TABLE clipboard_items ADD COLUMN size INTEGER");
  }
  if (!columnNames.has("storage_key")) {
    db.exec("ALTER TABLE clipboard_items ADD COLUMN storage_key TEXT");
  }

  const insertStmt = db.prepare(`
    INSERT INTO clipboard_items (
      id, room_id, type, content, file_name, mime_type, size, storage_key, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const listStmt = db.prepare(`
    SELECT id, room_id, type, content, file_name, mime_type, size, storage_key, created_at
    FROM clipboard_items
    WHERE room_id = ?
    ORDER BY created_at DESC, rowid DESC
    LIMIT ?
  `);
  const getByStorageKeyStmt = db.prepare(`
    SELECT id, room_id, type, content, file_name, mime_type, size, storage_key, created_at
    FROM clipboard_items
    WHERE storage_key = ?
    LIMIT 1
  `);

  return {
    insertItem(roomId, rawPayload) {
      const normalizedRoomId = assertRoomId(roomId);
      const payload = parseClipboardPayload(rawPayload);
      const item =
        payload.type === "text"
          ? {
              id: randomUUID(),
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
              id: randomUUID(),
              roomId: normalizedRoomId,
              type: payload.type,
              content: null,
              fileName: payload.fileName,
              mimeType: payload.mimeType,
              size: payload.size,
              storageKey: payload.storageKey,
              createdAt: new Date().toISOString()
            };

      insertStmt.run(
        item.id,
        item.roomId,
        item.type,
        item.content,
        item.fileName,
        item.mimeType,
        item.size,
        item.storageKey,
        item.createdAt
      );
      return formatClipboardItem(item);
    },

    listItems(roomId, limit = MAX_CLIPBOARD_ITEMS) {
      const normalizedRoomId = assertRoomId(roomId);
      const rows = listStmt.all(normalizedRoomId, limit);
      return rows.map(formatClipboardItem);
    },

    getItemByStorageKey(storageKey) {
      const row = getByStorageKeyStmt.get(storageKey);
      return row ? formatClipboardItem(row) : null;
    },

    close() {
      db.close();
    }
  };
}
