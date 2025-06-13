/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // environment: "jsdom",
    environmentMatchGlobs: [
      ["src/**/**", "jsdom"],
      ["convex/**/**", "edge-runtime"],
    ],
    server: { deps: { inline: ["convex-test"] } },
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "dist/",
        "**/*.test.{ts,tsx}",
        "**/*.config.{ts,js,mts}",
        "**/*.d.{ts,js,mts}",
        "convex/_generated/",
        "vite.config.mts",
      ],
    },
  },
});
