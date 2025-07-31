import { D1Database } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
}

interface ContactFormData {
  full_name: string;
  work_email: string;
  work_phone?: string;
  company?: string;
  project_details: string;
  csrf_token?: string;
  _honeypot?: string; // Honeypot field to catch bots
}

// Simple email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Simple rate limiting with a Map (in memory cache)
// This won't persist across multiple instances but provides basic protection
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const ipRequestMap = new Map<string, { count: number; timestamp: number }>();

// Helper function to sanitize input
function sanitizeInput(input: string | null): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
  params: any;
}) => {
  try {
    // Get client IP for rate limiting
    const clientIP =
      context.request.headers.get("CF-Connecting-IP") ||
      context.request.headers.get("X-Forwarded-For") ||
      "unknown";

    // Check rate limit
    const now = Date.now();
    const clientRequests = ipRequestMap.get(clientIP);

    if (clientRequests) {
      // Reset if window has expired
      if (now - clientRequests.timestamp > RATE_LIMIT_WINDOW) {
        ipRequestMap.set(clientIP, { count: 1, timestamp: now });
      } else if (clientRequests.count >= MAX_REQUESTS_PER_WINDOW) {
        // Rate limit exceeded
        return new Response(
          JSON.stringify({
            success: false,
            message:
              "Zu viele Anfragen. Bitte versuchen Sie es später noch einmal."
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-Content-Type-Options": "nosniff",
              "Retry-After": "60"
            }
          }
        );
      } else {
        // Increment counter
        ipRequestMap.set(clientIP, {
          count: clientRequests.count + 1,
          timestamp: clientRequests.timestamp
        });
      }
    } else {
      // First request from this IP
      ipRequestMap.set(clientIP, { count: 1, timestamp: now });
    }

    // Get form data from the request
    const formData = await context.request.formData();

    // Check honeypot field - if filled, it's likely a bot
    const honeypot = formData.get("_honeypot") as string;
    if (honeypot && honeypot.length > 0) {
      // Return success to the bot but don't process the submission
      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Vielen Dank für Ihre Anfrage! Wir werden uns in Kürze bei Ihnen melden."
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          }
        }
      );
    }

    // Extract and sanitize form fields
    const workPhone = sanitizeInput(formData.get("work_phone") as string);
    const company = sanitizeInput(formData.get("company") as string);

    const contactData: ContactFormData = {
      full_name: sanitizeInput(formData.get("full_name") as string),
      work_email: sanitizeInput(formData.get("work_email") as string),
      ...(workPhone && { work_phone: workPhone }),
      ...(company && { company: company }),
      project_details: sanitizeInput(formData.get("project_details") as string),
      csrf_token: formData.get("csrf_token") as string
    };

    // Check CSRF token (in a real implementation, validate against session)
    if (!contactData.csrf_token) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Ungültige Anfrage: CSRF-Token fehlt"
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          }
        }
      );
    }

    // Validate required fields
    if (
      !contactData.full_name ||
      !contactData.work_email ||
      !contactData.project_details
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bitte füllen Sie alle erforderlichen Felder aus"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          }
        }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(contactData.work_email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bitte geben Sie eine gültige E-Mail-Adresse ein"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          }
        }
      );
    }

    // Check input lengths to prevent abuse
    if (contactData.full_name.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Der Name ist zu lang"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          }
        }
      );
    }

    if (contactData.project_details.length > 2000) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Die Projektdetails sind zu lang"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          }
        }
      );
    }

    // Insert data into D1 database
    const result = await context.env.DB.prepare(
      `
      INSERT INTO contact_submissions (full_name, work_email, work_phone, company, project_details)
      VALUES (?, ?, ?, ?, ?)
    `
    )
      .bind(
        contactData.full_name,
        contactData.work_email,
        contactData.work_phone,
        contactData.company,
        contactData.project_details
      )
      .run();

    // Check if the insert was successful
    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Vielen Dank für Ihre Anfrage! Wir werden uns in Kürze bei Ihnen melden."
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store"
          }
        }
      );
    } else {
      throw new Error("Database insert failed");
    }
  } catch (error) {
    // Log the error (in a production environment you might want to use a proper logging service)
    console.error("Error processing form submission:", error);

    // Return an error response
    return new Response(
      JSON.stringify({
        success: false,
        message:
          "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später noch einmal."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff"
        }
      }
    );
  }
};
