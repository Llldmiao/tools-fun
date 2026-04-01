import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLIPBOARD_RETENTION_DAYS,
  MAX_CLIPBOARD_CONTENT_LENGTH,
  MAX_CLIPBOARD_ITEMS,
  createRoomId,
  isValidRoomId,
  normalizeRoomId
} from "@tools-fun/shared";
import type { ClipboardItem, ClipboardStreamEvent } from "@tools-fun/shared";
import type { FormEvent } from "react";
import { LANGUAGE_STORAGE_KEY, messages } from "./i18n";
import type { ConnectionState, ErrorKey, Language } from "./i18n";

function setHeadMeta(name: string, content: string) {
  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.append(meta);
  }
  meta.setAttribute("content", content);
}

function formatTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en-US" || stored === "zh-CN") {
      return stored;
    }
  } catch {
    return "zh-CN";
  }

  return "zh-CN";
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
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [roomInput, setRoomInput] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [errorKey, setErrorKey] = useState<ErrorKey | "">("");
  const [serverError, setServerError] = useState("");
  const [copiedItemId, setCopiedItemId] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const eventSourceRef = useRef<EventSource | null>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = messages[language];

  const error = errorKey ? t.errors[errorKey] : serverError;

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
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (!activeRoom) return undefined;

    const params = new URLSearchParams(window.location.search);
    params.set("room", activeRoom);
    window.history.replaceState({}, "", `?${params.toString()}`);

    let disposed = false;
    setConnectionState("connecting");
    setErrorKey("");
    setServerError("");

    async function loadHistory() {
      const response = await fetch(`/api/rooms/${activeRoom}/items`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.errors.loadRoomFailed);
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
          setServerError(requestError.message);
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

  useEffect(() => {
    const roomMode = activeRoom.length > 0;

    document.title = roomMode ? t.roomTitle(activeRoom) : t.pageTitle;
    setHeadMeta("description", roomMode ? t.roomDescription : t.pageDescription);
    setHeadMeta("robots", roomMode ? "noindex,nofollow" : "index,follow");
  }, [activeRoom, t]);

  const connectionLabel = useMemo(() => {
    return t.status[connectionState];
  }, [connectionState, t]);

  async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRoomId(roomInput);
    if (!isValidRoomId(normalized)) {
      setErrorKey("invalidRoom");
      setServerError("");
      return;
    }
    setErrorKey("");
    setServerError("");
    setItems([]);
    setActiveRoom(normalized);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRoom) {
      setErrorKey("joinRoomFirst");
      setServerError("");
      return;
    }
    if (!draft.trim()) {
      setErrorKey("emptyDraft");
      setServerError("");
      return;
    }

    setSubmitState("submitting");
    setErrorKey("");
    setServerError("");

    try {
      const response = await fetch(`/api/rooms/${activeRoom}/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: draft })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.errors.submitFailed);
      }
      setDraft("");
    } catch (requestError) {
      setServerError(requestError instanceof Error ? requestError.message : t.errors.submitFailed);
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
        <div className="hero-topbar">
          <div>
            <p className="kicker">{t.kicker}</p>
            <h1>{t.heroTitle}</h1>
          </div>
          <div className="language-switcher" role="group" aria-label={t.languageLabel}>
            {(["zh-CN", "en-US"] as const).map((nextLanguage) => (
              <button
                key={nextLanguage}
                type="button"
                className={`language-switcher__button${language === nextLanguage ? " is-active" : ""}`}
                onClick={() => setLanguage(nextLanguage)}
                aria-pressed={language === nextLanguage}
              >
                {messages[nextLanguage].languageName}
              </button>
            ))}
          </div>
        </div>
        <p className="lead">{t.lead}</p>
        <p className="hint">{t.heroHint(CLIPBOARD_RETENTION_DAYS)}</p>
      </section>

      <div className="grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">{t.roomSectionLabel}</p>
              <h2>{t.roomSectionTitle}</h2>
            </div>
            <span className={`status-badge status-badge--${connectionState}`}>{connectionLabel}</span>
          </div>

          <form onSubmit={handleJoinRoom} className="stack">
            <label htmlFor="room-code">{t.roomLabel}</label>
            <input
              id="room-code"
              value={roomInput}
              onChange={(event) => setRoomInput(normalizeRoomId(event.target.value))}
              placeholder={t.roomPlaceholder}
              autoCapitalize="characters"
            />
            <div className="actions">
              <button type="submit">{t.joinRoom}</button>
              <button type="button" className="ghost-button" onClick={handleCreateRoom}>
                {t.createRoom}
              </button>
              <button type="button" className="ghost-button" onClick={handleCopyRoom} disabled={!activeRoom}>
                {t.copyRoom}
              </button>
            </div>
          </form>

          <p className="hint">{t.roomHint(CLIPBOARD_RETENTION_DAYS)}</p>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">{t.draftSectionLabel}</p>
              <h2>{t.draftSectionTitle}</h2>
            </div>
            <span className="subtle-count">{draft.length}/{MAX_CLIPBOARD_CONTENT_LENGTH}</span>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            <label htmlFor="clipboard-draft">{t.draftLabel}</label>
            <textarea
              id="clipboard-draft"
              rows={8}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t.draftPlaceholder}
            />
            <button type="submit" disabled={submitState === "submitting"}>
              {submitState === "submitting" ? t.submitting : t.submit}
            </button>
          </form>

          {error ? <p role="alert" className="error-text">{error}</p> : null}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">{t.historySectionLabel}</p>
            <h2>{t.historySectionTitle(MAX_CLIPBOARD_ITEMS)}</h2>
          </div>
          <span className="subtle-count">{activeRoom ? t.currentRoom(activeRoom) : t.noActiveRoom}</span>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">{t.emptyState}</div>
        ) : (
          <ol className="message-list">
            {items.map((item) => (
              <li key={item.id} className="message-card">
                <div className="message-meta">
                  <div className="message-meta__summary">
                    <span>{item.roomId}</span>
                    <time dateTime={item.createdAt}>{formatTime(item.createdAt, language)}</time>
                  </div>
                  <div className="message-copy-wrap">
                    <button
                      type="button"
                      className={`ghost-button message-copy-button${copiedItemId === item.id ? " is-copied" : ""}`}
                      onClick={() => handleCopyItem(item)}
                      aria-label={copiedItemId === item.id ? t.copied : t.copy}
                    >
                      <span aria-hidden="true">{copiedItemId === item.id ? "✅" : "📋"}</span>
                    </button>
                    <span className="message-copy-tooltip" aria-hidden="true">
                      {t.copy}
                    </span>
                    <span className={`message-copy-feedback${copiedItemId === item.id ? " is-visible" : ""}`}>
                      {t.copied}
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
