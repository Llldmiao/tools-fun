CREATE TABLE clipboard_items_v2 (
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

INSERT INTO clipboard_items_v2 (
  id,
  room_id,
  type,
  content,
  file_name,
  mime_type,
  size,
  storage_key,
  created_at
)
SELECT
  id,
  room_id,
  COALESCE(type, 'text') AS type,
  content,
  file_name,
  mime_type,
  size,
  storage_key,
  created_at
FROM clipboard_items;

DROP TABLE clipboard_items;

ALTER TABLE clipboard_items_v2 RENAME TO clipboard_items;

CREATE INDEX idx_clipboard_items_room_created
  ON clipboard_items (room_id, created_at DESC);

CREATE INDEX idx_clipboard_items_storage_key
  ON clipboard_items (storage_key);
