CREATE TABLE IF NOT EXISTS clipboard_items (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clipboard_items_room_created
  ON clipboard_items (room_id, created_at DESC);
