// Точка входа. Реальный Nest bootstrap-файл появится позже —
// сейчас это минимальный HTTP-сервер на встроенном модуле node:http, нужен
// только для того, чтобы было что реально поднимать и проверять в Docker
// (health-check, порты, docker-compose) до того, как появится Nest app.
import { createServer } from "node:http";
import { PlaceholderService } from "./placeholder.service.js";

const PORT = Number(process.env.PORT ?? 4000);

export function createApp() {
  const service = new PlaceholderService();

  return createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "backend" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(service.getStatus());
  });
}

if (process.env.NODE_ENV !== "test") {
  createApp().listen(PORT, () => {
    console.error(`[backend] listening on http://0.0.0.0:${PORT}`);
  });
}
