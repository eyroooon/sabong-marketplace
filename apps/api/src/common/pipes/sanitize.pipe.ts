import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import sanitizeHtml from "sanitize-html";

/**
 * Strips potentially dangerous content from string values to mitigate XSS attacks.
 *
 * The pipe:
 *   - Removes all HTML tags (including `<script>`, `<iframe>`, etc.)
 *   - Removes `javascript:` / `data:` URLs
 *   - Removes inline event-handler attributes (`onclick`, `onerror`, ...)
 *
 * It recursively walks object / array values so nested DTOs are sanitized as well.
 * Non-string primitives (numbers, booleans, dates) are returned unchanged.
 */

const JAVASCRIPT_URL_PATTERN =
  /(?:javascript|vbscript|data|file)\s*:[^\s"'<>]*/gi;
const EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const SCRIPT_TAG_PATTERN =
  /<\s*\/?\s*(?:script|iframe|object|embed|style)[^>]*>/gi;

export function sanitizeString(input: string): string {
  if (typeof input !== "string" || input.length === 0) {
    return input;
  }

  // Pre-strip obvious attack vectors that sanitize-html's strict config
  // would already drop, but we want the cleanest possible string value.
  let cleaned = input
    .replace(SCRIPT_TAG_PATTERN, "")
    .replace(EVENT_HANDLER_PATTERN, "")
    .replace(JAVASCRIPT_URL_PATTERN, "");

  // Run through sanitize-html to strip any remaining HTML tags/attributes.
  cleaned = sanitizeHtml(cleaned, {
    allowedTags: [],
    allowedAttributes: {},
    allowedSchemes: ["http", "https", "mailto", "tel"],
    disallowedTagsMode: "discard",
  });

  return cleaned.trim();
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
  if (typeof value === "object") {
    // Preserve class instances (e.g. Date, Buffer) as-is.
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      for (const key of Object.keys(value as Record<string, unknown>)) {
        const current = (value as Record<string, unknown>)[key];
        if (typeof current === "string") {
          (value as Record<string, unknown>)[key] = sanitizeString(current);
        } else if (current && typeof current === "object") {
          (value as Record<string, unknown>)[key] = sanitizeValue(current);
        }
      }
      return value;
    }
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeValue(v);
    }
    return out;
  }
  return value;
}

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    return sanitizeValue(value);
  }
}
