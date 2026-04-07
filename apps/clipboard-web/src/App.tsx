import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALLOWED_GENERIC_FILE_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  CLIPBOARD_RETENTION_DAYS,
  MAX_CLIPBOARD_CONTENT_LENGTH,
  MAX_CLIPBOARD_ITEMS,
  createRoomId,
  isValidRoomId,
  normalizeRoomId
} from "@tools-fun/shared";
import type { ClipboardItem, ClipboardStreamEvent } from "@tools-fun/shared";
import type { ChangeEvent, FormEvent } from "react";
import { LANGUAGE_STORAGE_KEY, messages } from "./i18n";
import type { ConnectionState, ErrorKey, Language } from "./i18n";

type SubmitState = "idle" | "submitting";

const ACCEPTED_FILE_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_GENERIC_FILE_MIME_TYPES].join(",");
const SITE_URL = "https://lengmiaomiao.win";
const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/social-card.svg`;

function setHeadMeta(name: string, content: string) {
  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.append(meta);
  }
  meta.setAttribute("content", content);
}

function setHeadProperty(property: string, content: string) {
  let meta = document.head.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.append(meta);
  }
  meta.setAttribute("content", content);
}

function setCanonicalLink(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.append(link);
  }
  link.setAttribute("href", href);
}

function setAlternateLink(language: Language, href: string) {
  let link = document.head.querySelector(`link[rel="alternate"][hreflang="${language}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", language);
    document.head.append(link);
  }
  link.setAttribute("href", href);
}

function setJsonLd(id: string, payload: object) {
  let script = document.head.querySelector(`script[data-jsonld="${id}"]`);
  if (!script) {
    script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.setAttribute("data-jsonld", id);
    document.head.append(script);
  }
  script.textContent = JSON.stringify(payload);
}

function getRoomFromLocation() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hashRoom = normalizeRoomId(hash.get("room"));
  if (isValidRoomId(hashRoom)) {
    return hashRoom;
  }

  const query = new URLSearchParams(window.location.search);
  const queryRoom = normalizeRoomId(query.get("room"));
  if (isValidRoomId(queryRoom)) {
    return queryRoom;
  }

  return "";
}

function replaceLocationForRoom(room: string) {
  const query = new URLSearchParams(window.location.search);
  query.delete("room");
  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : "";
  window.history.replaceState({}, "", `${window.location.pathname}${suffix}#room=${room}`);
}

function formatTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function formatFileSize(value: number | null, unitShort: string, unitMedium: string, unitLarge: string) {
  if (value == null) return "";
  if (value < 1024) return `${value} ${unitShort}`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} ${unitMedium}`;
  return `${(value / (1024 * 1024)).toFixed(1)} ${unitLarge}`;
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

function getNormalizedItemType(item: ClipboardItem) {
  return item.type === "image" || item.type === "file" ? item.type : "text";
}

export function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [roomInput, setRoomInput] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [errorKey, setErrorKey] = useState<ErrorKey | "">("");
  const [serverError, setServerError] = useState("");
  const [copiedItemId, setCopiedItemId] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const eventSourceRef = useRef<EventSource | null>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = messages[language];

  const error = errorKey ? t.errors[errorKey] : serverError;

  useEffect(() => {
    const room = getRoomFromLocation();
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
    function handleHashChange() {
      const room = getRoomFromLocation();
      if (room) {
        setRoomInput(room);
        setActiveRoom(room);
        return;
      }

      setActiveRoom("");
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (!activeRoom) return undefined;
    replaceLocationForRoom(activeRoom);

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
  }, [activeRoom, t.errors.loadRoomFailed]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const roomMode = activeRoom.length > 0;
    const pageUrl = `${SITE_URL}${t.pageCanonicalPath}`;
    const socialTitle = roomMode ? t.roomTitle(activeRoom) : t.socialTitle;
    const socialDescription = roomMode ? t.roomDescription : t.socialDescription;
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: t.locale,
      mainEntity: t.faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    };
    const softwareJsonLd = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: t.siteName,
      applicationCategory: t.categoryLabel,
      operatingSystem: "Web",
      inLanguage: t.locale,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      },
      description: t.pageDescription,
      url: pageUrl,
      featureList: [
        t.kicker,
        t.lead,
        t.fileSupportHint,
        t.heroHint(CLIPBOARD_RETENTION_DAYS)
      ]
    };

    document.title = roomMode ? t.roomTitle(activeRoom) : t.pageTitle;
    setHeadMeta("description", roomMode ? t.roomDescription : t.pageDescription);
    setHeadMeta("keywords", t.pageKeywords);
    setHeadMeta("robots", roomMode ? "noindex,nofollow" : "index,follow");
    setHeadMeta("twitter:card", "summary_large_image");
    setHeadMeta("twitter:title", socialTitle);
    setHeadMeta("twitter:description", socialDescription);
    setHeadMeta("twitter:image", DEFAULT_SOCIAL_IMAGE);
    setHeadProperty("og:type", "website");
    setHeadProperty("og:site_name", t.siteName);
    setHeadProperty("og:locale", t.locale);
    setHeadProperty("og:title", socialTitle);
    setHeadProperty("og:description", socialDescription);
    setHeadProperty("og:url", pageUrl);
    setHeadProperty("og:image", DEFAULT_SOCIAL_IMAGE);
    setCanonicalLink(pageUrl);
    setAlternateLink("zh-CN", pageUrl);
    setAlternateLink("en-US", pageUrl);
    setJsonLd("software-application", softwareJsonLd);
    setJsonLd("faq-page", faqJsonLd);
  }, [activeRoom, t]);

  const connectionLabel = useMemo(() => t.status[connectionState], [connectionState, t]);

  const composeLabel = useMemo(() => {
    if (selectedFile) {
      return `${selectedFile.name} · ${formatFileSize(selectedFile.size, t.fileSizeBytes, t.fileSizeKilobytes, t.fileSizeMegabytes)}`;
    }
    return `${draft.length}/${MAX_CLIPBOARD_CONTENT_LENGTH}`;
  }, [draft.length, selectedFile, t]);

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
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setActiveRoom(normalized);
  }

  async function uploadSelectedFile(roomId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch(`/api/rooms/${roomId}/uploads`, {
      method: "POST",
      body: formData
    });
    const uploadPayload = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error(uploadPayload.error ?? t.errors.submitFailed);
    }

    const itemResponse = await fetch(`/api/rooms/${roomId}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(uploadPayload.upload)
    });
    const itemPayload = await itemResponse.json();
    if (!itemResponse.ok) {
      throw new Error(itemPayload.error ?? t.errors.submitFailed);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRoom) {
      setErrorKey("joinRoomFirst");
      setServerError("");
      return;
    }
    if (!selectedFile && !draft.trim()) {
      setErrorKey("emptyDraft");
      setServerError("");
      return;
    }

    setSubmitState("submitting");
    setErrorKey("");
    setServerError("");

    try {
      if (selectedFile) {
        await uploadSelectedFile(activeRoom, selectedFile);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const response = await fetch(`/api/rooms/${activeRoom}/items`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "text", content: draft })
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? t.errors.submitFailed);
        }
        setDraft("");
      }
    } catch (requestError) {
      setServerError(requestError instanceof Error ? requestError.message : t.errors.submitFailed);
    } finally {
      setSubmitState("idle");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
    setErrorKey("");
    setServerError("");
  }

  function handleClearFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleCopyRoom() {
    if (!activeRoom || !navigator.clipboard) return;
    await navigator.clipboard.writeText(activeRoom);
  }

  async function handleCopyItem(item: ClipboardItem) {
    if (!navigator.clipboard || item.type !== "text" || !item.content) return;
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
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setActiveRoom(nextRoom);
  }

  function getItemTypeLabel(item: ClipboardItem) {
    const itemType = getNormalizedItemType(item);
    if (itemType === "image") return t.itemTypeImage;
    if (itemType === "file") return t.itemTypeFile;
    return t.itemTypeText;
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

      <section className="panel info-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">{t.useCasesSectionLabel}</p>
            <h2>{t.useCasesSectionTitle}</h2>
          </div>
        </div>
        <ul className="info-list">
          {t.useCases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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
              <h2>{selectedFile ? t.fileDraftSectionTitle : t.draftSectionTitle}</h2>
            </div>
            <span className="subtle-count">{composeLabel}</span>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            <label htmlFor="clipboard-draft">{t.draftLabel}</label>
            <textarea
              id="clipboard-draft"
              rows={8}
              value={draft}
              disabled={selectedFile !== null}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedFile ? t.fileDraftPlaceholder : t.draftPlaceholder}
            />

            <div className="file-picker-row">
              <label htmlFor="clipboard-file" className="file-picker-button ghost-button">
                {t.filePickerButton}
              </label>
              <input
                ref={fileInputRef}
                id="clipboard-file"
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileChange}
                className="file-input"
              />
              {selectedFile ? (
                <button type="button" className="ghost-button" onClick={handleClearFile}>
                  {t.clearFileButton}
                </button>
              ) : null}
            </div>

            {selectedFile ? (
              <div className="selected-file-card">
                <strong>{selectedFile.name}</strong>
                <span>{selectedFile.type || t.unknownType}</span>
                <span>{formatFileSize(selectedFile.size, t.fileSizeBytes, t.fileSizeKilobytes, t.fileSizeMegabytes)}</span>
              </div>
            ) : (
              <p className="hint compact-hint">{t.fileSupportHint}</p>
            )}

            <button type="submit" disabled={submitState === "submitting"}>
              {submitState === "submitting" ? t.submitting : selectedFile ? t.uploadSubmit : t.submit}
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
            {items.map((item) => {
              const itemType = getNormalizedItemType(item);

              return (
                <li key={item.id} className="message-card">
                <div className="message-meta">
                  <div className="message-meta__summary">
                    <span>{item.roomId}</span>
                    <span className="message-type-tag">{getItemTypeLabel(item)}</span>
                    <time dateTime={item.createdAt}>{formatTime(item.createdAt, language)}</time>
                  </div>

                  {itemType === "text" ? (
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
                  ) : item.downloadUrl ? (
                    <a className="ghost-button download-button" href={item.downloadUrl}>
                      {t.download}
                    </a>
                  ) : null}
                </div>

                {itemType === "text" ? (
                  <pre>{item.content}</pre>
                ) : (
                  <div className="attachment-card">
                    {itemType === "image" && item.downloadUrl ? (
                      <a href={item.downloadUrl} className="attachment-preview-link">
                        <img
                          className="attachment-preview"
                          src={item.downloadUrl}
                          alt={item.fileName ?? t.unnamedFile}
                          loading="lazy"
                        />
                      </a>
                    ) : null}
                    <div className="attachment-meta">
                      <strong>{item.fileName ?? t.unnamedFile}</strong>
                      <span>{item.mimeType ?? t.unknownType}</span>
                      <span>{formatFileSize(item.size, t.fileSizeBytes, t.fileSizeKilobytes, t.fileSizeMegabytes)}</span>
                    </div>
                  </div>
                )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="panel info-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">{t.faqSectionLabel}</p>
            <h2>{t.faqSectionTitle}</h2>
          </div>
        </div>
        <div className="faq-list">
          {t.faqItems.map((item) => (
            <article key={item.question} className="faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
