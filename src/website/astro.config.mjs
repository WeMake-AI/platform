import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
    cloudflareModules: true,
    imageService: "cloudflare",
    platformProxy: {
      enabled: true,
      configPath: "wrangler.jsonc",
      environment: "staging"
    }
  }),

  output: "server",

  server: {
    host: true,
    port: 1312
  },

  vite: {
    resolve: {
      alias: import.meta.env.PROD
        ? {
            "react-dom/server": "react-dom/server.edge"
          }
        : undefined
    },
    plugins: [tailwindcss()]
  },

  markdown: {
    drafts: true,
    shikiConfig: {
      theme: "css-variables"
    }
  },

  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true
  },

  site: "https://wemake.cx",

  integrations: [sitemap(), mdx()],

  build: {
    assets: "_wemake"
  }
});
