const encoder = new TextEncoder();

function sseFrame(type, payload) {
  return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function sseComment(text) {
  return encoder.encode(`: ${text}\n\n`);
}

export class RoomDurableObject {
  constructor(ctx) {
    this.ctx = ctx;
    this.connections = new Set();
    this.heartbeatTimer = null;
  }

  fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname.endsWith("/stream")) {
      return this.handleStream();
    }

    if (request.method === "POST" && url.pathname === "/__broadcast") {
      return this.handleBroadcast(request);
    }

    return new Response("Not found.", { status: 404 });
  }

  handleStream() {
    let connection;

    const stream = new ReadableStream({
      start: (controller) => {
        connection = controller;
        this.connections.add(controller);
        controller.enqueue(sseComment("connected"));
        this.ensureHeartbeat();
      },
      cancel: () => {
        if (connection) {
          this.connections.delete(connection);
        }
        if (this.connections.size === 0) {
          this.stopHeartbeat();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive"
      }
    });
  }

  async handleBroadcast(request) {
    const payload = await request.json();
    const chunk = sseFrame("item_created", payload);

    for (const controller of [...this.connections]) {
      try {
        controller.enqueue(chunk);
      } catch {
        this.connections.delete(controller);
      }
    }

    if (this.connections.size === 0) {
      this.stopHeartbeat();
    }

    return new Response(null, { status: 204 });
  }

  ensureHeartbeat() {
    if (this.connections.size === 0 || this.heartbeatTimer !== null) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      const heartbeat = sseComment("heartbeat");

      for (const controller of [...this.connections]) {
        try {
          controller.enqueue(heartbeat);
        } catch {
          this.connections.delete(controller);
        }
      }

      if (this.connections.size === 0) {
        this.stopHeartbeat();
      }
    }, 15000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
