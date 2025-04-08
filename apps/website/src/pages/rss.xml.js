import rss, { pagesGlobToRssItems } from "@astrojs/rss";
/**
 * Generates an RSS feed for blog posts.
 *
 * This asynchronous function creates an RSS feed by combining a static title and description
 * with blog posts sourced from Markdown and MDX files located in the "./blog" directory.
 * It uses the provided context to incorporate the site URL into the feed.
 *
 * @param {object} context - The endpoint context containing site-related information.
 * @returns {Promise<*>} A promise that resolves to the generated RSS feed.
 */
export async function GET(context) {
  return rss({
    title: "WeMake AI by Sakwiset",
    description: "WeMake AI by Sakwiset is an AI company that provides AI solutions to businesses.",
    site: context.site,
    items: await pagesGlobToRssItems(import.meta.glob("./blog/*.{md,mdx}"))
  });
}
