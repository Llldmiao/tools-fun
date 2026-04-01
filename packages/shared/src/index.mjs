export const MAX_CLIPBOARD_ITEMS = 20;
export const MAX_CLIPBOARD_CONTENT_LENGTH = 5000;
export const CLIPBOARD_RETENTION_DAYS = 7;
export const ROOM_ID_PATTERN = /^[A-Z0-9]{6,12}$/;

function randomChar() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const index = Math.floor(Math.random() * alphabet.length);
  return alphabet[index];
}

export function createRoomId(length = 6) {
  return Array.from({ length }, () => randomChar()).join("");
}

export function normalizeRoomId(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

export function isValidRoomId(value) {
  return ROOM_ID_PATTERN.test(normalizeRoomId(value));
}

export function assertRoomId(value) {
  const roomId = normalizeRoomId(value);
  if (!isValidRoomId(roomId)) {
    throw new Error("Room ID must be 6-12 uppercase letters or numbers.");
  }
  return roomId;
}

export function sanitizeClipboardContent(value) {
  const content = String(value ?? "").replace(/\r\n/g, "\n").trim();
  if (!content) {
    throw new Error("Clipboard content cannot be empty.");
  }
  if (content.length > MAX_CLIPBOARD_CONTENT_LENGTH) {
    throw new Error(`Clipboard content must be ${MAX_CLIPBOARD_CONTENT_LENGTH} characters or less.`);
  }
  return content;
}

export function parseClipboardPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }
  return {
    content: sanitizeClipboardContent(payload.content)
  };
}

export function formatClipboardItem(row) {
  return {
    id: String(row.id),
    roomId: String(row.roomId ?? row.room_id),
    content: String(row.content),
    createdAt: String(row.createdAt ?? row.created_at)
  };
}
