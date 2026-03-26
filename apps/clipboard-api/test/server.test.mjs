import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createClipboardServer } from "../src/server.mjs";

async function withServer(run) {
  const tempDir = await mkdtemp(join(tmpdir(), "clipboard-api-"));
  const app = createClipboardServer({
    dbPath: join(tempDir, "clipboard.sqlite"),
    port: 0
  });
  const details = await app.start();

  try {
    await run(details.url);
  } finally {
    await app.stop();
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function readEvent(reader) {
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      throw new Error("SSE stream ended before receiving an event.");
    }
    buffer += Buffer.from(value).toString("utf8");
    if (buffer.includes("\n\n")) {
      const [rawEvent] = buffer.split("\n\n");
      const dataLine = rawEvent
        .split("\n")
        .find((line) => line.startsWith("data: "));
      if (dataLine) {
        return JSON.parse(dataLine.slice(6));
      }
      buffer = "";
    }
  }
}

test("rejects invalid room ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rooms/not-good!/items`);
    assert.equal(response.status, 422);
  });
});

test("stores a posted item and returns it in history", async () => {
  await withServer(async (baseUrl) => {
    const postResponse = await fetch(`${baseUrl}/api/rooms/ROOM88/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "hello from machine A" })
    });
    assert.equal(postResponse.status, 201);

    const listResponse = await fetch(`${baseUrl}/api/rooms/ROOM88/items`);
    const payload = await listResponse.json();

    assert.equal(payload.items.length, 1);
    assert.equal(payload.items[0].roomId, "ROOM88");
    assert.equal(payload.items[0].content, "hello from machine A");
  });
});

test("keeps the newest 20 items in descending order", async () => {
  await withServer(async (baseUrl) => {
    for (let index = 1; index <= 25; index += 1) {
      const response = await fetch(`${baseUrl}/api/rooms/ROOM99/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: `item-${index}` })
      });
      assert.equal(response.status, 201);
    }

    const listResponse = await fetch(`${baseUrl}/api/rooms/ROOM99/items`);
    const payload = await listResponse.json();

    assert.equal(payload.items.length, 20);
    assert.equal(payload.items[0].content, "item-25");
    assert.equal(payload.items.at(-1).content, "item-6");
  });
});

test("broadcasts new items over SSE only to the matching room", async () => {
  await withServer(async (baseUrl) => {
    const roomAResponse = await fetch(`${baseUrl}/api/rooms/ROOMAA/stream`);
    const roomBResponse = await fetch(`${baseUrl}/api/rooms/ROOMBB/stream`);

    assert.ok(roomAResponse.body);
    assert.ok(roomBResponse.body);

    const roomAReader = roomAResponse.body.getReader();
    const roomBReader = roomBResponse.body.getReader();

    await fetch(`${baseUrl}/api/rooms/ROOMAA/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "sync me" })
    });

    const event = await readEvent(roomAReader);
    assert.equal(event.type, "item_created");
    assert.equal(event.item.roomId, "ROOMAA");
    assert.equal(event.item.content, "sync me");

    const roomBResult = await Promise.race([
      readEvent(roomBReader).then(() => "event"),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 250))
    ]);

    assert.equal(roomBResult, "timeout");

    roomAReader.cancel();
    roomBReader.cancel();
  });
});
