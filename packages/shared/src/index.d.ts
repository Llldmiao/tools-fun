export const MAX_CLIPBOARD_ITEMS: number;
export const MAX_CLIPBOARD_CONTENT_LENGTH: number;
export const ROOM_ID_PATTERN: RegExp;

export type RoomId = string;

export interface ClipboardItem {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
}

export interface PostClipboardItemRequest {
  content: string;
}

export interface ClipboardStreamEvent {
  type: "item_created";
  item: ClipboardItem;
}

export function createRoomId(length?: number): RoomId;
export function normalizeRoomId(value: unknown): RoomId;
export function isValidRoomId(value: unknown): boolean;
export function assertRoomId(value: unknown): RoomId;
export function sanitizeClipboardContent(value: unknown): string;
export function parseClipboardPayload(payload: unknown): PostClipboardItemRequest;
export function formatClipboardItem(row: Record<string, unknown>): ClipboardItem;
