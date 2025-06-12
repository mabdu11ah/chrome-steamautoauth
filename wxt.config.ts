import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  outDir: "build",

  modules: ["@wxt-dev/module-svelte"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),

  manifest: {
    name: "SteamAutoAuth",
    description:
      "Automatically authenticate to Steam using your account details.",
    version: "0.5.0",
    permissions: ["storage", "activeTab", "tabs"],
  },
});
