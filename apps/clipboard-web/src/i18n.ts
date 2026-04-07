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
  pageCanonicalPath: string;
  pageKeywords: string;
  socialTitle: string;
  socialDescription: string;
  siteName: string;
  categoryLabel: string;
  faqSectionLabel: string;
  faqSectionTitle: string;
  faqItems: Array<{ question: string; answer: string }>;
  useCasesSectionLabel: string;
  useCasesSectionTitle: string;
  useCases: string[];
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
  joinCurrentRoom: string;
  switchRoom: string;
  createRoom: string;
  copyRoom: string;
  roomEntered: string;
  roomHint: (days: number) => string;
  draftSectionLabel: string;
  draftSectionTitle: string;
  fileDraftSectionTitle: string;
  draftLabel: string;
  draftPlaceholder: string;
  fileDraftPlaceholder: string;
  filePickerButton: string;
  clearFileButton: string;
  fileSupportHint: string;
  submit: string;
  uploadSubmit: string;
  submitting: string;
  uploadProgress: (percent: number) => string;
  uploadProcessing: string;
  uploadPreviewAlt: string;
  historySectionLabel: string;
  historySectionTitle: (count: number) => string;
  currentRoom: (room: string) => string;
  noActiveRoom: string;
  emptyState: string;
  copy: string;
  copied: string;
  download: string;
  itemTypeText: string;
  itemTypeImage: string;
  itemTypeFile: string;
  unnamedFile: string;
  unknownType: string;
  fileSizeBytes: string;
  fileSizeKilobytes: string;
  fileSizeMegabytes: string;
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
      "共享粘贴板是一个浏览器里的跨设备剪贴板和临时文件传输工具，支持实时同步文本、链接、代码片段与常见文件。",
    pageCanonicalPath: "/",
    pageKeywords: "共享粘贴板,跨设备剪贴板,浏览器剪贴板同步,临时文件传输,实时文本同步,在线粘贴板",
    socialTitle: "共享粘贴板：跨设备实时同步文本和文件",
    socialDescription:
      "用浏览器就能在手机和电脑之间临时同步文本、链接、代码片段和文件，不需要登录，适合短期共享。",
    siteName: "共享粘贴板",
    categoryLabel: "效率工具",
    faqSectionLabel: "常见问题",
    faqSectionTitle: "这个工具适合怎么用？",
    faqItems: [
      {
        question: "共享粘贴板能做什么？",
        answer: "它适合在手机、电脑和平板之间临时传链接、代码片段、验证码截图、文档和压缩包。"
      },
      {
        question: "需要注册或登录吗？",
        answer: "不需要。知道房间码就能进入同一个临时共享房间。"
      },
      {
        question: "消息会保存多久？",
        answer: "内容只保留有限天数，适合临时同步和短期共享，不适合作为长期网盘。"
      },
      {
        question: "支持哪些文件？",
        answer: "支持常见图片格式以及 PDF、TXT、MD、JSON、CSV、ZIP 等文件类型。"
      }
    ],
    useCasesSectionLabel: "使用场景",
    useCasesSectionTitle: "什么时候会比发微信、传 AirDrop 更顺手？",
    useCases: [
      "把电脑上的链接、命令行片段或代码快速传到手机。",
      "在公司电脑和个人设备之间临时同步小文件或截图。",
      "给同事一个房间码，临时共享测试账号、日志片段或下载地址。"
    ],
    roomTitle: (room) => `共享粘贴板 · 房间 ${room}`,
    roomDescription: "临时共享房间中的实时文本同步视图。",
    kicker: "跨设备文本与文件同步",
    heroTitle: "共享粘贴板",
    lead: "在 A 机器上传文本或文件，B 机器打开同一个房间就能实时看到。",
    heroHint: (days) => `消息仅保留 ${days} 天，适合临时同步和短期共享。`,
    roomSectionLabel: "房间入口",
    roomSectionTitle: "进入同步房间",
    roomLabel: "房间码",
    roomPlaceholder: "例如 ROOM88",
    joinRoom: "进入房间",
    joinCurrentRoom: "已在当前房间",
    switchRoom: "切换到这个房间",
    createRoom: "生成新房间",
    copyRoom: "复制房间码",
    roomEntered: "已进入",
    roomHint: (days) =>
      `房间码知道的人都能进入，因此更适合局域网协作、临时同步和个人设备之间传递内容。消息会保留${days} 天，过期后自动清理。`,
    draftSectionLabel: "发送内容",
    draftSectionTitle: "把文本贴进来",
    fileDraftSectionTitle: "上传一个文件",
    draftLabel: "当前内容",
    draftPlaceholder: "把文本、链接或代码片段粘贴到这里。",
    fileDraftPlaceholder: "已选择文件，发送时会上传该文件。",
    filePickerButton: "选择图片或文件",
    clearFileButton: "清除文件",
    fileSupportHint: "支持 PNG、JPG、GIF、WEBP、PDF、TXT、MD、JSON、CSV、ZIP。一次上传 1 个文件。",
    submit: "发送到房间",
    uploadSubmit: "上传到房间",
    submitting: "发送中...",
    uploadProgress: (percent) => `正在上传 ${percent}%`,
    uploadProcessing: "上传完成，正在写入房间记录...",
    uploadPreviewAlt: "待上传图片预览",
    historySectionLabel: "同步记录",
    historySectionTitle: (count) => `最近 ${count} 条`,
    currentRoom: (room) => `房间 ${room}`,
    noActiveRoom: "还没进入房间",
    emptyState: "该房间还没有内容。",
    copy: "复制",
    copied: "已复制",
    download: "下载",
    itemTypeText: "文本",
    itemTypeImage: "图片",
    itemTypeFile: "文件",
    unnamedFile: "未命名文件",
    unknownType: "未知类型",
    fileSizeBytes: "B",
    fileSizeKilobytes: "KB",
    fileSizeMegabytes: "MB",
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
      "Shared Clipboard is a browser-based cross-device clipboard and temporary file transfer tool for syncing text, links, code snippets, and common files in real time.",
    pageCanonicalPath: "/",
    pageKeywords:
      "shared clipboard,cross-device clipboard,browser clipboard sync,temporary file transfer,real-time text sync,online clipboard",
    socialTitle: "Shared Clipboard: real-time text and file sync across devices",
    socialDescription:
      "Move text, links, snippets, screenshots, and files between phone and desktop in the browser without signing in.",
    siteName: "Shared Clipboard",
    categoryLabel: "Productivity",
    faqSectionLabel: "FAQ",
    faqSectionTitle: "What is this tool best for?",
    faqItems: [
      {
        question: "What can Shared Clipboard help with?",
        answer: "It works well for moving links, snippets, screenshots, documents, and temporary notes between your devices."
      },
      {
        question: "Do I need an account?",
        answer: "No. Anyone with the room code can open the same temporary room."
      },
      {
        question: "How long is content stored?",
        answer: "Items are kept for a limited number of days, so the tool is better for temporary syncing than long-term storage."
      },
      {
        question: "What file types are supported?",
        answer: "Common image formats are supported, along with files such as PDF, TXT, MD, JSON, CSV, and ZIP."
      }
    ],
    useCasesSectionLabel: "Use Cases",
    useCasesSectionTitle: "When is this easier than AirDrop, chat apps, or cloud drives?",
    useCases: [
      "Send a command, URL, or code snippet from your laptop to your phone in seconds.",
      "Move a screenshot, PDF, or notes file between work and personal devices without setup.",
      "Share a temporary room code with a teammate to pass logs, test data, or download links."
    ],
    roomTitle: (room) => `Shared Clipboard · Room ${room}`,
    roomDescription: "Real-time text sync for a temporary shared room.",
    kicker: "Cross-device text and file sync",
    heroTitle: "Shared Clipboard",
    lead: "Upload text or a file on machine A, open the same room on machine B, and it appears in real time.",
    heroHint: (days) => `Messages are kept for ${days} days, which works well for short-term syncing and sharing.`,
    roomSectionLabel: "Room Access",
    roomSectionTitle: "Join a sync room",
    roomLabel: "Room code",
    roomPlaceholder: "For example ROOM88",
    joinRoom: "Join room",
    joinCurrentRoom: "Currently in this room",
    switchRoom: "Switch to this room",
    createRoom: "Create room",
    copyRoom: "Copy room code",
    roomEntered: "Joined",
    roomHint: (days) =>
      `Anyone with the room code can enter, so this is best for LAN collaboration, temporary syncing, and moving content between your own devices. Messages are kept for ${days} days and then cleaned up automatically.`,
    draftSectionLabel: "Send Content",
    draftSectionTitle: "Paste text here",
    fileDraftSectionTitle: "Upload one file",
    draftLabel: "Current content",
    draftPlaceholder: "Paste text, links, or code snippets here.",
    fileDraftPlaceholder: "A file is selected and will be uploaded when you submit.",
    filePickerButton: "Choose image or file",
    clearFileButton: "Clear file",
    fileSupportHint: "Supports PNG, JPG, GIF, WEBP, PDF, TXT, MD, JSON, CSV, and ZIP. One file per upload.",
    submit: "Send to room",
    uploadSubmit: "Upload to room",
    submitting: "Sending...",
    uploadProgress: (percent) => `Uploading ${percent}%`,
    uploadProcessing: "Upload finished, saving the item to the room...",
    uploadPreviewAlt: "Selected image preview",
    historySectionLabel: "Recent Syncs",
    historySectionTitle: (count) => `Latest ${count}`,
    currentRoom: (room) => `Room ${room}`,
    noActiveRoom: "No room joined yet",
    emptyState: "No shared content in this room yet.",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    itemTypeText: "Text",
    itemTypeImage: "Image",
    itemTypeFile: "File",
    unnamedFile: "Unnamed file",
    unknownType: "Unknown type",
    fileSizeBytes: "B",
    fileSizeKilobytes: "KB",
    fileSizeMegabytes: "MB",
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
