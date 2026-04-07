import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { LANGUAGE_STORAGE_KEY } from "./i18n";

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    const bucket = this.listeners.get(type) ?? new Set();
    bucket.add(listener);
    this.listeners.set(type, bucket);
  }

  close() {}

  emit(type: string, data: unknown) {
    const event = { data: JSON.stringify(data) } as MessageEvent<string>;
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe("clipboard app", () => {
  const fetchMock = vi.fn();
  const writeTextMock = vi.fn();

  function readJsonLd(id: string) {
    const script = document.head.querySelector(`script[data-jsonld="${id}"]`);
    expect(script).not.toBeNull();
    return JSON.parse(script?.textContent ?? "null");
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock.mockResolvedValue(undefined)
      }
    });
    window.history.replaceState({}, "", "/");
    window.localStorage.clear();
    document.documentElement.lang = "";
    MockEventSource.instances = [];
    fetchMock.mockReset();
    writeTextMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function emptyHistoryResponse() {
    return {
      ok: true,
      json: async () => ({ items: [] })
    };
  }

  it("loads room history and shows the empty state", async () => {
    fetchMock.mockResolvedValueOnce(emptyHistoryResponse());

    render(<App />);

    fireEvent.change(screen.getByLabelText("房间码"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "进入房间" }));

    await waitFor(() => {
      expect(String(fetchMock.mock.calls[0][0])).toContain("/api/rooms/ROOM88/items");
    });

    expect(await screen.findByText("该房间还没有内容。")).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
    expect(window.location.hash).toBe("#room=ROOM88");
  });

  it("switches to English, persists the selection, and updates landing metadata", async () => {
    const { unmount } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("heading", { name: "Shared Clipboard" })).toBeInTheDocument();
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en-US");
    expect(document.documentElement.lang).toBe("en-US");

    await waitFor(() => {
      expect(document.title).toBe("Shared Clipboard - Real-time text sync across devices");
    });
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Shared Clipboard is a browser-based cross-device clipboard and temporary file transfer tool for syncing text, links, code snippets, and common files in real time."
    );
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://lengmiaomiao.win/");
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(
      "Shared Clipboard: real-time text and file sync across devices"
    );

    unmount();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Shared Clipboard" })).toBeInTheDocument();
  });

  it("submits text and clears the draft", async () => {
    fetchMock
      .mockResolvedValueOnce(emptyHistoryResponse())
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          item: {
            id: "1",
            roomId: "ROOM88",
            type: "text",
            content: "hello",
            fileName: null,
            mimeType: null,
            size: null,
            storageKey: null,
            downloadUrl: null,
            createdAt: "2026-03-22T00:00:00.000Z"
          }
        })
      });

    render(<App />);

    fireEvent.change(screen.getByLabelText("房间码"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "进入房间" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("当前内容"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "发送到房间" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText("当前内容")).toHaveValue("");
    expect(fetchMock.mock.calls[1][1]?.body).toContain('"type":"text"');
  });

  it("uploads a selected file and creates an item", async () => {
    fetchMock
      .mockResolvedValueOnce(emptyHistoryResponse())
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          upload: {
            type: "image",
            fileName: "demo.png",
            mimeType: "image/png",
            size: 1234,
            storageKey: "rooms/ROOM88/2026/04/06/uuid-demo.png"
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          item: {
            id: "2",
            roomId: "ROOM88",
            type: "image",
            content: null,
            fileName: "demo.png",
            mimeType: "image/png",
            size: 1234,
            storageKey: "rooms/ROOM88/2026/04/06/uuid-demo.png",
            downloadUrl: "/api/files/rooms%2FROOM88%2F2026%2F04%2F06%2Fuuid-demo.png",
            createdAt: "2026-03-22T00:00:00.000Z"
          }
        })
      });

    render(<App />);

    fireEvent.change(screen.getByLabelText("房间码"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "进入房间" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const fileInput = document.getElementById("clipboard-file") as HTMLInputElement;
    const file = new File(["file-body"], "demo.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText("demo.png")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "上传到房间" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/rooms/ROOM88/uploads");
    expect(String(fetchMock.mock.calls[2][0])).toContain("/api/rooms/ROOM88/items");
  });

  it("merges incoming file items into the list", async () => {
    fetchMock.mockResolvedValueOnce(emptyHistoryResponse());

    render(<App />);

    fireEvent.change(screen.getByLabelText("房间码"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "进入房间" }));

    await waitFor(() => expect(MockEventSource.instances.length).toBe(1));

    MockEventSource.instances[0].emit("item_created", {
      type: "item_created",
      item: {
        id: "evt-1",
        roomId: "ROOM88",
        type: "file",
        content: null,
        fileName: "notes.pdf",
        mimeType: "application/pdf",
        size: 2048,
        storageKey: "rooms/ROOM88/2026/04/06/evt-1-notes.pdf",
        downloadUrl: "/api/files/rooms%2FROOM88%2F2026%2F04%2F06%2Fevt-1-notes.pdf",
        createdAt: "2026-03-22T00:00:00.000Z"
      }
    });

    expect(await screen.findByText("notes.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载" })).toHaveAttribute(
      "href",
      "/api/files/rooms%2FROOM88%2F2026%2F04%2F06%2Fevt-1-notes.pdf"
    );
  });

  it("copies a single text message from the history list", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "evt-1",
            roomId: "ROOM88",
            type: "text",
            content: "这是要复制的消息",
            fileName: null,
            mimeType: null,
            size: null,
            storageKey: null,
            downloadUrl: null,
            createdAt: "2026-03-22T00:00:00.000Z"
          }
        ]
      })
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText("房间码"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "进入房间" }));

    await screen.findByText("这是要复制的消息");
    fireEvent.click(screen.getByRole("button", { name: "复制" }));

    expect(writeTextMock).toHaveBeenCalledWith("这是要复制的消息");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "已复制" })).toBeInTheDocument();
    });
  });

  it("renders an English room flow with English date formatting", async () => {
    const createdAt = "2026-03-22T00:00:00.000Z";

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "evt-1",
            roomId: "ROOM88",
            content: "Copied from another device",
            createdAt
          }
        ]
      })
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "English" }));
    fireEvent.change(screen.getByLabelText("Room code"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "Join room" }));

    expect(await screen.findByText("Copied from another device")).toBeInTheDocument();
    expect(screen.getByText("Room ROOM88")).toBeInTheDocument();
    expect(document.title).toBe("Shared Clipboard · Room ROOM88");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Real-time text sync for a temporary shared room."
    );
    expect(screen.getByText(new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(createdAt)))).toBeInTheDocument();
  });

  it("keeps the landing page indexable before entering a room", () => {
    render(<App />);

    expect(document.title).toBe("共享粘贴板 - 多设备实时同步文本工具");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("index,follow");
    expect(document.head.querySelector('meta[name="keywords"]')?.getAttribute("content")).toContain("跨设备剪贴板");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-CN");
  });

  it("publishes JSON-LD for the landing page in both schema blocks", () => {
    render(<App />);

    const softwareJsonLd = readJsonLd("software-application");
    expect(softwareJsonLd["@type"]).toBe("SoftwareApplication");
    expect(softwareJsonLd.name).toBe("共享粘贴板");
    expect(softwareJsonLd.url).toBe("https://lengmiaomiao.win/");
    expect(softwareJsonLd.featureList).toEqual(
      expect.arrayContaining([
        "跨设备文本与文件同步",
        "在 A 机器上传文本或文件，B 机器打开同一个房间就能实时看到。"
      ])
    );

    const faqJsonLd = readJsonLd("faq-page");
    expect(faqJsonLd["@type"]).toBe("FAQPage");
    expect(faqJsonLd.inLanguage).toBe("zh-CN");
    expect(faqJsonLd.mainEntity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "Question",
          name: "共享粘贴板能做什么？"
        })
      ])
    );
  });

  it("loads a room from the hash fragment on first render", async () => {
    window.history.replaceState({}, "", "/#room=ROOM88");
    fetchMock.mockResolvedValueOnce(emptyHistoryResponse());

    render(<App />);

    await waitFor(() => {
      expect(String(fetchMock.mock.calls[0][0])).toContain("/api/rooms/ROOM88/items");
    });

    expect(screen.getByDisplayValue("ROOM88")).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("migrates an old room query into the hash fragment", async () => {
    window.history.replaceState({}, "", "/?room=ROOM88");
    fetchMock.mockResolvedValueOnce(emptyHistoryResponse());

    render(<App />);

    await waitFor(() => {
      expect(window.location.hash).toBe("#room=ROOM88");
    });

    expect(window.location.search).toBe("");
  });

  it("reacts to hashchange by switching to another room", async () => {
    fetchMock
      .mockResolvedValueOnce(emptyHistoryResponse())
      .mockResolvedValueOnce(emptyHistoryResponse());

    render(<App />);

    fireEvent.change(screen.getByLabelText("房间码"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "进入房间" }));

    await waitFor(() => {
      expect(String(fetchMock.mock.calls[0][0])).toContain("/api/rooms/ROOM88/items");
    });

    window.history.replaceState({}, "", "/#room=ROOM99");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(String(fetchMock.mock.calls[1][0])).toContain("/api/rooms/ROOM99/items");
    });

    expect(screen.getByDisplayValue("ROOM99")).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
  });
});
