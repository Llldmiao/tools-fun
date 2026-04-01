export const LANGUAGE_STORAGE_KEY = "clipboard-web-language";

export type Language = "zh-CN" | "en-US";
export type ErrorKey =
  | "invalidRoom"
  | "joinRoomFirst"
  | "emptyDraft"
  | "loadRoomFailed"
  | "submitFailed";
export type ConnectionState = "idle" | "connecting" | "live" | "reconnecting" | "offline";

type Messages = {
  locale: Language;
  languageName: string;
  languageLabel: string;
  pageTitle: string;
  pageDescription: string;
  roomTitle: (room: string) => string;
  roomDescription: string;
  kicker: string;
  heroTitle: string;
  lead: string;
  heroHint: (days: number) => string;
  roomSectionLabel: string;
  roomSectionTitle: string;
  roomLabel: string;
  roomPlaceholder: string;
  joinRoom: string;
  createRoom: string;
  copyRoom: string;
  roomHint: (days: number) => string;
  draftSectionLabel: string;
  draftSectionTitle: string;
  draftLabel: string;
  draftPlaceholder: string;
  submit: string;
  submitting: string;
  historySectionLabel: string;
  historySectionTitle: (count: number) => string;
  currentRoom: (room: string) => string;
  noActiveRoom: string;
  emptyState: string;
  copy: string;
  copied: string;
  status: Record<ConnectionState, string>;
  errors: Record<ErrorKey, string>;
};

export const messages: Record<Language, Messages> = {
  "zh-CN": {
    locale: "zh-CN",
    languageName: "简体中文",
    languageLabel: "语言",
    pageTitle: "共享粘贴板 - 多设备实时同步文本工具",
    pageDescription:
      "共享粘贴板是一个轻量的多设备文本同步工具，让你在浏览器里快速共享链接、代码片段和临时内容。",
    roomTitle: (room) => `共享粘贴板 · 房间 ${room}`,
    roomDescription: "临时共享房间中的实时文本同步视图。",
    kicker: "跨设备文本同步",
    heroTitle: "共享粘贴板",
    lead: "在 A 机器粘贴到 Web 端，B 机器打开同一个房间就能实时看到。",
    heroHint: (days) => `消息仅保留 ${days} 天，适合临时同步和短期共享。`,
    roomSectionLabel: "房间入口",
    roomSectionTitle: "进入同步房间",
    roomLabel: "房间码",
    roomPlaceholder: "例如 ROOM88",
    joinRoom: "进入房间",
    createRoom: "生成新房间",
    copyRoom: "复制房间码",
    roomHint: (days) =>
      `房间码知道的人都能进入，因此更适合局域网协作、临时同步和个人设备之间传递内容。消息会保留${days} 天，过期后自动清理。`,
    draftSectionLabel: "发送内容",
    draftSectionTitle: "把文本贴进来",
    draftLabel: "当前内容",
    draftPlaceholder: "把文本、链接或代码片段粘贴到这里。",
    submit: "发送到房间",
    submitting: "发送中...",
    historySectionLabel: "同步记录",
    historySectionTitle: (count) => `最近 ${count} 条`,
    currentRoom: (room) => `房间 ${room}`,
    noActiveRoom: "还没进入房间",
    emptyState: "该房间还没有内容。",
    copy: "复制",
    copied: "已复制",
    status: {
      idle: "尚未进入房间",
      connecting: "正在连接",
      live: "实时同步中",
      reconnecting: "连接中断，正在重连",
      offline: "当前离线"
    },
    errors: {
      invalidRoom: "房间码需要是 6 到 12 位的大写字母或数字。",
      joinRoomFirst: "先进入一个房间，再发送内容。",
      emptyDraft: "内容不能为空。",
      loadRoomFailed: "加载房间失败。",
      submitFailed: "发送失败。"
    }
  },
  "en-US": {
    locale: "en-US",
    languageName: "English",
    languageLabel: "Language",
    pageTitle: "Shared Clipboard - Real-time text sync across devices",
    pageDescription:
      "Shared Clipboard is a lightweight text sync tool for quickly sharing links, snippets, and temporary notes across browsers.",
    roomTitle: (room) => `Shared Clipboard · Room ${room}`,
    roomDescription: "Real-time text sync for a temporary shared room.",
    kicker: "Cross-device text sync",
    heroTitle: "Shared Clipboard",
    lead: "Paste on machine A, open the same room on machine B, and the text appears in real time.",
    heroHint: (days) => `Messages are kept for ${days} days, which works well for short-term syncing and sharing.`,
    roomSectionLabel: "Room Access",
    roomSectionTitle: "Join a sync room",
    roomLabel: "Room code",
    roomPlaceholder: "For example ROOM88",
    joinRoom: "Join room",
    createRoom: "Create room",
    copyRoom: "Copy room code",
    roomHint: (days) =>
      `Anyone with the room code can enter, so this is best for LAN collaboration, temporary syncing, and moving content between your own devices. Messages are kept for ${days} days and then cleaned up automatically.`,
    draftSectionLabel: "Send Text",
    draftSectionTitle: "Paste text here",
    draftLabel: "Current text",
    draftPlaceholder: "Paste text, links, or code snippets here.",
    submit: "Send to room",
    submitting: "Sending...",
    historySectionLabel: "Recent Syncs",
    historySectionTitle: (count) => `Latest ${count}`,
    currentRoom: (room) => `Room ${room}`,
    noActiveRoom: "No room joined yet",
    emptyState: "No shared text in this room yet.",
    copy: "Copy",
    copied: "Copied",
    status: {
      idle: "No room joined",
      connecting: "Connecting",
      live: "Live sync active",
      reconnecting: "Connection lost, retrying",
      offline: "Offline"
    },
    errors: {
      invalidRoom: "Room codes must be 6 to 12 uppercase letters or digits.",
      joinRoomFirst: "Join a room before sending content.",
      emptyDraft: "Content cannot be empty.",
      loadRoomFailed: "Failed to load room.",
      submitFailed: "Failed to send."
    }
  }
};
