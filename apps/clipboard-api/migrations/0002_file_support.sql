ALTER TABLE clipboard_items ADD COLUMN type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE clipboard_items ADD COLUMN file_name TEXT;
ALTER TABLE clipboard_items ADD COLUMN mime_type TEXT;
ALTER TABLE clipboard_items ADD COLUMN size INTEGER;
ALTER TABLE clipboard_items ADD COLUMN storage_key TEXT;

CREATE INDEX IF NOT EXISTS idx_clipboard_items_storage_key
  ON clipboard_items (storage_key);
