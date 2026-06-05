import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime — cached long-term, loaded on every page
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/") ||
            id.includes("node_modules/wouter/") ||
            id.includes("node_modules/@tanstack/")
          ) {
            return "vendor-react";
          }

          // Radix UI primitives — used by most UI components
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }

          // Form handling — loaded on demand with form-heavy pages
          if (
            id.includes("node_modules/react-hook-form/") ||
            id.includes("node_modules/@hookform/")
          ) {
            return "vendor-forms";
          }

          // DnD kit — only for drag-and-drop features
          if (id.includes("node_modules/@dnd-kit/")) {
            return "vendor-dnd";
          }

          // Date utilities
          if (id.includes("node_modules/date-fns/")) {
            return "vendor-date";
          }

          // Icons — lucide and react-icons
          if (
            id.includes("node_modules/lucide-react/") ||
            id.includes("node_modules/react-icons/")
          ) {
            return "vendor-icons";
          }

          // Recharts + D3 — heavy chart library, only loaded on analytics pages
          // Let Vite naturally split these via lazy imports
          // (Do NOT force into a manual chunk to avoid pulling shared deps)
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
