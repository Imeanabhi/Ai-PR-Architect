import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content/index.js"), // Point to your content script
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "content"
            ? "content.js"
            : "assets/[name]-[hash].js";
        },
      },
    },
  },
});
