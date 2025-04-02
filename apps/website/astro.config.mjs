import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  output: "static",

  server: {
    port: 1312,
  },

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    drafts: true,
    shikiConfig: {
      theme: "css-variables",
    },
  },

  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },

  site: "https://wemake.cx",

  integrations: [sitemap(), mdx()],

  build: {
    assets: "_wemake",
  },
});
