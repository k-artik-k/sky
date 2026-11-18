import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";

const removeCrossOrigin = (): Plugin => ({
  name: "remove-crossorigin",
  transformIndexHtml(html: string) {
    return html.replace(/\s*crossorigin(=["'][^"']*["'])?/g, "");
  },
});

export default defineConfig({
  plugins: [react(), removeCrossOrigin()],
  base: "./",
});
