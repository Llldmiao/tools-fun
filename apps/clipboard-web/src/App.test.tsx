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

  it("loads room history and shows the empty state", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] })
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText("房间码"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "进入房间" }));

    await waitFor(() => {
      expect(String(fetchMock.mock.calls[0][0])).toContain("/api/rooms/ROOM88/items");
    });

    expect(await screen.findByText("该房间还没有内容。")).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
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
      "Shared Clipboard is a lightweight text sync tool for quickly sharing links, snippets, and temporary notes across browsers."
    );

    unmount();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Shared Clipboard" })).toBeInTheDocument();
  });

  it("submits text and clears the draft", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          item: {
            id: "1",
            roomId: "ROOM88",
            content: "hello",
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
  });

  it("merges incoming SSE items into the list", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] })
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText("房间码"), { target: { value: "ROOM88" } });
    fireEvent.click(screen.getByRole("button", { name: "进入房间" }));

    await waitFor(() => expect(MockEventSource.instances.length).toBe(1));

    MockEventSource.instances[0].emit("item_created", {
      type: "item_created",
      item: {
        id: "evt-1",
        roomId: "ROOM88",
        content: "同步过来的文本",
        createdAt: "2026-03-22T00:00:00.000Z"
      }
    });

    expect(await screen.findByText("同步过来的文本")).toBeInTheDocument();
  });

  it("copies a single message from the history list", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "evt-1",
            roomId: "ROOM88",
            content: "这是要复制的消息",
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
    expect(screen.getByText("已复制")).toHaveClass("is-visible");

    await new Promise((resolve) => setTimeout(resolve, 2100));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "复制" })).toBeInTheDocument();
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
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-CN");
  });
});
