import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_CLIPBOARD_CONTENT_LENGTH,
  MAX_CLIPBOARD_ITEMS,
  createRoomId,
  isValidRoomId,
  normalizeRoomId
} from "@tools-fun/shared";
import type { ClipboardItem, ClipboardStreamEvent } from "@tools-fun/shared";
import type { FormEvent } from "react";

type ConnectionState = "idle" | "connecting" | "live" | "reconnecting" | "offline";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function mergeItems(current: ClipboardItem[], incoming: ClipboardItem[]) {
  const merged = new Map<string, ClipboardItem>();
  for (const item of [...incoming, ...current]) {
    merged.set(item.id, item);
  }

  return [...merged.values()]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, MAX_CLIPBOARD_ITEMS);
}

export function App() {
  const [roomInput, setRoomInput] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [error, setError] = useState("");
  const [copiedItemId, setCopiedItemId] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const eventSourceRef = useRef<EventSource | null>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = normalizeRoomId(params.get("room"));
    if (isValidRoomId(room)) {
      setRoomInput(room);
      setActiveRoom(room);
    } else {
      const generated = createRoomId();
      setRoomInput(generated);
    }
  }, []);

  useEffect(() => {
    if (!activeRoom) return undefined;

    const params = new URLSearchParams(window.location.search);
    params.set("room", activeRoom);
    window.history.replaceState({}, "", `?${params.toString()}`);

    let disposed = false;
    setConnectionState("connecting");
    setError("");

    async function loadHistory() {
      const response = await fetch(`/api/rooms/${activeRoom}/items`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "加载房间失败。");
      }
      if (!disposed) {
        setItems(payload.items);
      }
    }

    loadHistory()
      .then(() => {
        if (disposed) return;

        const source = new EventSource(`/api/rooms/${activeRoom}/stream`);
        eventSourceRef.current = source;

        source.addEventListener("item_created", (event) => {
          const data = JSON.parse((event as MessageEvent<string>).data) as ClipboardStreamEvent;
          setItems((current) => mergeItems(current, [data.item]));
          setConnectionState("live");
        });

        source.onopen = () => {
          setConnectionState("live");
        };

        source.onerror = () => {
          setConnectionState("reconnecting");
        };
      })
      .catch((requestError: Error) => {
        if (!disposed) {
          setError(requestError.message);
          setConnectionState("offline");
        }
      });

    return () => {
      disposed = true;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [activeRoom]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const connectionLabel = useMemo(() => {
    switch (connectionState) {
      case "connecting":
        return "正在连接";
      case "live":
        return "实时同步中";
      case "reconnecting":
        return "连接中断，正在重连";
      case "offline":
        return "当前离线";
      default:
        return "尚未进入房间";
    }
  }, [connectionState]);

  async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRoomId(roomInput);
    if (!isValidRoomId(normalized)) {
      setError("房间码需要是 6 到 12 位的大写字母或数字。");
      return;
    }
    setItems([]);
    setActiveRoom(normalized);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRoom) {
      setError("先进入一个房间，再发送内容。");
      return;
    }
    if (!draft.trim()) {
      setError("内容不能为空。");
      return;
    }

    setSubmitState("submitting");
    setError("");

    try {
      const response = await fetch(`/api/rooms/${activeRoom}/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: draft })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "发送失败。");
      }
      setDraft("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "发送失败。");
    } finally {
      setSubmitState("idle");
    }
  }

  async function handleCopyRoom() {
    if (!activeRoom || !navigator.clipboard) return;
    await navigator.clipboard.writeText(activeRoom);
  }

  async function handleCopyItem(item: ClipboardItem) {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(item.content);
    setCopiedItemId(item.id);

    if (copyResetTimerRef.current) {
      clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = setTimeout(() => {
      setCopiedItemId("");
      copyResetTimerRef.current = null;
    }, 2000);
  }

  function handleCreateRoom() {
    const nextRoom = createRoomId();
    setRoomInput(nextRoom);
    setItems([]);
    setActiveRoom(nextRoom);
  }

  return (
    <div className="page-shell">
      <section className="hero-card">
        <p className="kicker">跨设备文本同步</p>
        <h1>共享粘贴板</h1>
        <p className="lead">
          在 A 机器粘贴到 Web 端，B 机器打开同一个房间就能实时看到。
        </p>
      </section>

      <div className="grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">房间入口</p>
              <h2>进入同步房间</h2>
            </div>
            <span className={`status-badge status-badge--${connectionState}`}>{connectionLabel}</span>
          </div>

          <form onSubmit={handleJoinRoom} className="stack">
            <label htmlFor="room-code">房间码</label>
            <input
              id="room-code"
              value={roomInput}
              onChange={(event) => setRoomInput(normalizeRoomId(event.target.value))}
              placeholder="例如 ROOM88"
              autoCapitalize="characters"
            />
            <div className="actions">
              <button type="submit">进入房间</button>
              <button type="button" className="ghost-button" onClick={handleCreateRoom}>
                生成新房间
              </button>
              <button type="button" className="ghost-button" onClick={handleCopyRoom} disabled={!activeRoom}>
                复制房间码
              </button>
            </div>
          </form>

          <p className="hint">房间码知道的人都能进入，因此更适合局域网协作、临时同步和个人设备之间传递内容。</p>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">发送内容</p>
              <h2>把文本贴进来</h2>
            </div>
            <span className="subtle-count">{draft.length}/{MAX_CLIPBOARD_CONTENT_LENGTH}</span>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            <label htmlFor="clipboard-draft">当前内容</label>
            <textarea
              id="clipboard-draft"
              rows={8}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="把文本、链接或代码片段粘贴到这里。"
            />
            <button type="submit" disabled={submitState === "submitting"}>
              {submitState === "submitting" ? "发送中..." : "发送到房间"}
            </button>
          </form>

          {error ? <p role="alert" className="error-text">{error}</p> : null}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">同步记录</p>
            <h2>最近 {MAX_CLIPBOARD_ITEMS} 条</h2>
          </div>
          <span className="subtle-count">{activeRoom ? `房间 ${activeRoom}` : "还没进入房间"}</span>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">该房间还没有内容。</div>
        ) : (
          <ol className="message-list">
            {items.map((item) => (
              <li key={item.id} className="message-card">
                <div className="message-meta">
                  <div className="message-meta__summary">
                    <span>{item.roomId}</span>
                    <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
                  </div>
                  <div className="message-copy-wrap">
                    <button
                      type="button"
                      className={`ghost-button message-copy-button${copiedItemId === item.id ? " is-copied" : ""}`}
                      onClick={() => handleCopyItem(item)}
                      aria-label={copiedItemId === item.id ? "已复制" : "复制"}
                    >
                      <span aria-hidden="true">{copiedItemId === item.id ? "✅" : "📋"}</span>
                    </button>
                    <span className="message-copy-tooltip" aria-hidden="true">
                      复制
                    </span>
                    <span className={`message-copy-feedback${copiedItemId === item.id ? " is-visible" : ""}`}>
                      已复制
                    </span>
                  </div>
                </div>
                <pre>{item.content}</pre>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
