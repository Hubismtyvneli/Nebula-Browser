"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FaviconProps {
  url: string;
  /** Size in pixels (default 16) */
  size?: number;
  /** Fallback letter if favicon fails to load */
  fallback?: string;
  className?: string;
}

/**
 * Renders a real website favicon using Google's S2 favicon service.
 * Falls back to a letter avatar if the favicon fails to load.
 *
 * The favicon is fetched from:
 *   https://www.google.com/s2/favicons?domain=example.com&sz=64
 *
 * This works for any website and is cached by Google's CDN.
 */
export function Favicon({ url, size = 16, fallback, className }: FaviconProps) {
  // Key the internal state by URL so it resets naturally when URL changes
  // (avoids setState-in-effect lint error)
  return <FaviconInner key={url} url={url} size={size} fallback={fallback} className={className} />;
}

function FaviconInner({ url, size = 16, fallback, className }: FaviconProps) {
  const [hasError, setHasError] = useState(false);

  // Compute favicon URL — Google's S2 favicon service, sz=64 for crisp rendering
  const faviconUrl = url
    ? (() => {
        try {
          const domain = new URL(url).hostname;
          return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
          return "";
        }
      })()
    : "";

  // Fallback: show the first letter of the domain
  if (hasError || !faviconUrl) {
    const letter = fallback ?? deriveLetter(url);
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-sm bg-white/5 font-bold text-[var(--text-secondary)]",
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        {letter}
      </span>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={cn("shrink-0 rounded-sm", className)}
      style={{ width: size, height: size, objectFit: "contain" }}
      loading="lazy"
    />
  );
}

function deriveLetter(url: string): string {
  if (!url) return "✦";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.charAt(0).toUpperCase() || "✦";
  } catch {
    return url.charAt(0).toUpperCase() || "✦";
  }
}
