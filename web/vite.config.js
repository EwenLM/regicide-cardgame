import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
// En dev, le front (5173) relaie /ws vers le serveur Node (3000).
export default defineConfig({
  plugins: [svelte()],
  server: { proxy: { "/ws": { target: "ws://localhost:3000", ws: true } } },
});
