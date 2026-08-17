// ВРЕМЕННЫЙ файл чтобы Docker/docker-compose можно было реально собрать и
// проверить (порты, health-check, hot-reload через volume)

import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 3000);

export function createDevServer() {
  return createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "frontend" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      "<html><body><h1>Frontend placeholder</h1>"</body></html>"
    `);
  });
}

if (process.env.NODE_ENV !== "test") {
  createDevServer().listen(PORT, () => {
    console.error(`[frontend] listening on http://0.0.0.0:${PORT}`);
  });
}
