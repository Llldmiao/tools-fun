export const MAX_CLIPBOARD_ITEMS = 20;
export const MAX_CLIPBOARD_CONTENT_LENGTH = 5000;
export const CLIPBOARD_RETENTION_DAYS = 7;
export const ROOM_ID_PATTERN = /^[A-Z0-9]{6,12}$/;
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_GENERIC_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
export const ALLOWED_GENERIC_FILE_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
  "application/zip"
];

const ALLOWED_FILE_MIME_TYPES = new Set([...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_GENERIC_FILE_MIME_TYPES]);
const MIME_TYPE_ALIASES = new Map([
  ["image/jpg", "image/jpeg"],
  ["image/pjpeg", "image/jpeg"],
  ["application/x-zip-compressed", "application/zip"],
  ["text/x-markdown", "text/markdown"]
]);
const MIME_TYPE_BY_EXTENSION = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".pdf", "application/pdf"],
  [".txt", "text/plain"],
  [".md", "text/markdown"],
  [".markdown", "text/markdown"],
  [".json", "application/json"],
  [".csv", "text/csv"],
  [".zip", "application/zip"]
]);

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

export function sanitizeClipboardFileName(value) {
  const fileName = String(value ?? "").trim().replace(/[\u0000-\u001f\u007f/\\]+/g, "-");
  if (!fileName) {
    throw new Error("File name is required.");
  }
  if (fileName.length > 180) {
    throw new Error("File name is too long.");
  }
  return fileName;
}

export function sanitizeClipboardMimeType(value) {
  const mimeType = MIME_TYPE_ALIASES.get(String(value ?? "").trim().toLowerCase()) ?? String(value ?? "").trim().toLowerCase();
  if (!mimeType) {
    throw new Error("MIME type is required.");
  }
  if (!ALLOWED_FILE_MIME_TYPES.has(mimeType)) {
    throw new Error("File type is not supported.");
  }
  return mimeType;
}

export function resolveClipboardMimeType(value, fileName = "") {
  const rawMimeType = String(value ?? "").trim().toLowerCase();
  if (rawMimeType && rawMimeType !== "application/octet-stream") {
    return sanitizeClipboardMimeType(rawMimeType);
  }

  const normalizedFileName = String(fileName ?? "").trim().toLowerCase();
  const extensionIndex = normalizedFileName.lastIndexOf(".");
  const extension = extensionIndex >= 0 ? normalizedFileName.slice(extensionIndex) : "";
  const inferredMimeType = MIME_TYPE_BY_EXTENSION.get(extension);
  if (!inferredMimeType) {
    throw new Error("File type is not supported.");
  }
  return inferredMimeType;
}

export function sanitizeClipboardFileSize(value) {
  const size = Number(value);
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("File size must be a positive integer.");
  }
  return size;
}

export function sanitizeClipboardStorageKey(value) {
  const storageKey = String(value ?? "").trim();
  if (!storageKey) {
    throw new Error("Storage key is required.");
  }
  if (storageKey.includes("..")) {
    throw new Error("Storage key is invalid.");
  }
  return storageKey;
}

export function getClipboardItemTypeForMimeType(value) {
  const mimeType = sanitizeClipboardMimeType(value);
  return mimeType.startsWith("image/") ? "image" : "file";
}

export function parseClipboardPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be an object.");
  }
  const type = String(payload.type ?? "text").trim().toLowerCase();
  if (type === "text") {
    return {
      type: "text",
      content: sanitizeClipboardContent(payload.content)
    };
  }

  if (type === "image" || type === "file") {
    const mimeType = sanitizeClipboardMimeType(payload.mimeType);
    const inferredType = getClipboardItemTypeForMimeType(mimeType);
    if (type !== inferredType) {
      throw new Error("Item type does not match MIME type.");
    }

    const size = sanitizeClipboardFileSize(payload.size);
    const maxSize = type === "image" ? MAX_IMAGE_FILE_SIZE_BYTES : MAX_GENERIC_FILE_SIZE_BYTES;
    if (size > maxSize) {
      throw new Error(`File size must be ${maxSize} bytes or less.`);
    }

    return {
      type,
      fileName: sanitizeClipboardFileName(payload.fileName),
      mimeType,
      size,
      storageKey: sanitizeClipboardStorageKey(payload.storageKey)
    };
  }

  throw new Error("Clipboard item type is not supported.");
}

export function formatClipboardItem(row) {
  const storageKey = row.storageKey ?? row.storage_key ?? null;
  const rawType = row.type ?? "text";
  const type = rawType === "image" || rawType === "file" ? rawType : "text";
  const fileName = row.fileName ?? row.file_name ?? null;
  const mimeType = row.mimeType ?? row.mime_type ?? null;
  return {
    id: String(row.id),
    roomId: String(row.roomId ?? row.room_id),
    type,
    content: row.content == null ? null : String(row.content),
    fileName: fileName == null ? null : String(fileName),
    mimeType: mimeType == null ? null : String(mimeType),
    size: row.size == null ? null : Number(row.size),
    storageKey: storageKey == null ? null : String(storageKey),
    downloadUrl: storageKey == null ? null : `/api/files/${encodeURIComponent(String(storageKey))}`,
    createdAt: String(row.createdAt ?? row.created_at)
  };
}
