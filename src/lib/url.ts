/**
 * Smart URL/search detection — same logic as Chrome's omnibox.
 * If the input looks like a URL (has a scheme, or is a single token with a TLD),
 * treat it as a URL. Otherwise, treat it as a search query.
 */
export function normalizeOmniboxInput(input: string): { type: "url" | "search"; value: string } {
  const trimmed = input.trim();
  if (!trimmed) return { type: "search", value: "" };

  // Already has a scheme
  if (/^https?:\/\//i.test(trimmed)) {
    return { type: "url", value: trimmed };
  }
  // about:blank, chrome:, etc.
  if (/^[a-z]+:\/\//i.test(trimmed) || /^(about|chrome|nebula):/i.test(trimmed)) {
    return { type: "url", value: trimmed };
  }
  // localhost
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return { type: "url", value: `http://${trimmed}` };
  }
  // Looks like a domain (no spaces, has a dot, TLD ≥ 2 chars)
  const noSpaces = !/\s/.test(trimmed);
  const hasDot = trimmed.includes(".");
  const tldMatch = trimmed.match(/\.([a-z]{2,})$/i);
  if (noSpaces && hasDot && tldMatch) {
    return { type: "url", value: `https://${trimmed}` };
  }
  // Otherwise it's a search
  return { type: "search", value: trimmed };
}

export function searchUrl(q: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function prettyUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    const query = u.search ? `?…` : "";
    return `${u.hostname.replace(/^www\./, "")}${path}${query}`;
  } catch {
    return url;
  }
}

export function hostOf(url: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** A single-letter favicon fallback derived from a URL. */
export function faviconFor(url: string): string {
  if (!url) return "✦";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.charAt(0).toUpperCase() || "✦";
  } catch {
    return "✦";
  }
}
