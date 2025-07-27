/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Cloudflare Worker for handling .well-known requests
 *
 * This worker dynamically routes requests to subdomain/.well-known/* paths
 * to the corresponding files in the /src directory structure.
 */

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// Only process .well-known paths
		if (!path.startsWith("/.well-known/")) {
			return new Response("Not Found", { status: 404 });
		}

		// Extract the subdomain from hostname
		const hostname = url.hostname;
		const subdomainMatch = hostname.match(/^([^.]+)\./);

		if (!subdomainMatch) {
			return new Response("Invalid subdomain", { status: 400 });
		}

		const subdomain = subdomainMatch[1];

		// Extract the filename from the path (remove /.well-known/ prefix)
		const filename = path.substring("/.well-known/".length);

		// Check for custom domain and load alternative content
		if (hostname === "mta-sts.cenergy.network" && filename === "mta-sts.txt") {
			const alternativeContent = `version: STSv1\nmode: enforce\nmx: smtp.google.com\nmax_age: 604800`;
			return new Response(alternativeContent, {
				headers: {
					"Content-Type": "text/plain"
				}
			});
		}

		if (!filename) {
			return new Response("Invalid path", { status: 400 });
		}

		// Create the asset path to look up in the /src directory
		const assetPath = `/${subdomain}/${filename}`;

		try {
			// Try to fetch the file from ASSETS
			// This uses the directory structure we set up in wrangler.jsonc
			const asset = await env.ASSETS.fetch(
				new Request(`http://placeholder${assetPath}`)
			);

			// If file found, return it with appropriate content type
			if (asset.ok) {
				// Get content type or set a default based on file extension
				let contentType = asset.headers.get("Content-Type");
				if (!contentType) {
					contentType = determineContentType(filename);
				}

				// Create a new response with the content and correct headers
				const content = await asset.text();
				return new Response(content, {
					headers: {
						"Content-Type": contentType
					}
				});
			}
		} catch (error) {
			console.error(`Error loading file: ${assetPath}`, error);
		}

		// File not found
		return new Response("File Not Found", { status: 404 });
	}
} satisfies ExportedHandler<Env>;

/**
 * Determine the Content-Type based on filename
 */
function determineContentType(filename: string): string {
	if (filename.endsWith(".txt")) {
		return "text/plain";
	}
	if (filename.endsWith(".json")) {
		return "application/json";
	}
	if (filename.endsWith(".xml")) {
		return "application/xml";
	}
	if (filename.endsWith(".html")) {
		return "text/html";
	}
	// Default content type
	return "text/plain";
}
