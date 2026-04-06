export const MAX_CLIPBOARD_ITEMS: number;
export const MAX_CLIPBOARD_CONTENT_LENGTH: number;
export const CLIPBOARD_RETENTION_DAYS: number;
export const ROOM_ID_PATTERN: RegExp;
export const MAX_IMAGE_FILE_SIZE_BYTES: number;
export const MAX_GENERIC_FILE_SIZE_BYTES: number;
export const ALLOWED_IMAGE_MIME_TYPES: readonly string[];
export const ALLOWED_GENERIC_FILE_MIME_TYPES: readonly string[];

export type RoomId = string;
export type ClipboardItemType = "text" | "image" | "file";

export interface ClipboardItem {
  id: string;
  roomId: string;
  type: ClipboardItemType;
  content: string | null;
  fileName: string | null;
  mimeType: string | null;
  size: number | null;
  storageKey: string | null;
  downloadUrl: string | null;
  createdAt: string;
}

export interface PostClipboardTextItemRequest {
  type: "text";
  content: string;
}

export interface PostClipboardFileItemRequest {
  type: "image" | "file";
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
}

export type PostClipboardItemRequest = PostClipboardTextItemRequest | PostClipboardFileItemRequest;

export interface ClipboardStreamEvent {
  type: "item_created";
  item: ClipboardItem;
}

export function createRoomId(length?: number): RoomId;
export function normalizeRoomId(value: unknown): RoomId;
export function isValidRoomId(value: unknown): boolean;
export function assertRoomId(value: unknown): RoomId;
export function sanitizeClipboardContent(value: unknown): string;
export function sanitizeClipboardFileName(value: unknown): string;
export function sanitizeClipboardMimeType(value: unknown): string;
export function resolveClipboardMimeType(value: unknown, fileName?: unknown): string;
export function sanitizeClipboardFileSize(value: unknown): number;
export function sanitizeClipboardStorageKey(value: unknown): string;
export function getClipboardItemTypeForMimeType(value: unknown): ClipboardItemType;
export function parseClipboardPayload(payload: unknown): PostClipboardItemRequest;
export function formatClipboardItem(row: Record<string, unknown>): ClipboardItem;
