import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Тесты логики (без DOM): алиас "@" совпадает с paths из tsconfig.json
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
