import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    // _versioni/ è solo un archivio di snapshot: non va testato.
    exclude: ["**/node_modules/**", "**/dist/**", "_versioni/**"],
  },
});
