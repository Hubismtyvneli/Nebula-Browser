"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/settings-store";

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseNotes: string | null;
  releaseUrl: string | null;
  publishedAt: string | null;
  assets: Array<{ name: string; url: string; size: number }>;
}

const APP_VERSION = "0.4.3";
// Your GitHub repo — update checker fetches the latest release from here
const GITHUB_REPO = "Hubismtyvneli/Nebula-Browser";

export function UpdateNotification() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const dismissedVersion = useSettingsStore((s) => s.dismissedUpdateVersion);
  const setDismissedVersion = useSettingsStore((s) => s.setDismissedUpdateVersion);

  /** Check GitHub for a newer release. */
  const checkForUpdates = async (silent = false) => {
    if (!silent) setIsChecking(true);
    try {
      const res = await fetch(`/api/updates/check?current=${APP_VERSION}`);
      const data: UpdateInfo = await res.json();
      setUpdate(data);

      // If user already dismissed this version, don't re-show
      if (data.hasUpdate && data.latestVersion === dismissedVersion) {
        setIsDismissed(true);
      } else if (data.hasUpdate) {
        setIsDismissed(false);
      }
    } catch {
      // Network error — fail silently
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  // Check on mount + every 30 minutes
  useEffect(() => {
    checkForUpdates(true);
    const interval = setInterval(() => checkForUpdates(true), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (update) setDismissedVersion(update.latestVersion);
  };

  const handleDownload = () => {
    if (update?.releaseUrl) {
      window.open(update.releaseUrl, "_blank");
    } else if (typeof window !== "undefined" && window.nebulaDesktop?.openExternal) {
      window.nebulaDesktop.openExternal(`https://github.com/${GITHUB_REPO}/releases/latest`);
    } else {
      window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, "_blank");
    }
  };

  const showPopup = update?.hasUpdate && !isDismissed && !isChecking;

  return (
    <>
      {/* Floating notification popup (bottom-right) */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass-strong fixed bottom-6 right-6 z-[90] w-[380px] overflow-hidden rounded-2xl"
          >
            {/* Neon top accent */}
            <div
              className="h-0.5 w-full"
              style={{
                background: "linear-gradient(90deg, transparent, var(--neon), transparent)",
                boxShadow: "0 0 12px var(--neon-soft)",
              }}
            />

            <div className="p-5">
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      background: "var(--neon-soft)",
                      boxShadow: "0 0 16px var(--neon-soft)",
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-[var(--neon)]" />
                  </motion.div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                      New update available
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)]">
                      v{update.currentVersion} → v{update.latestVersion}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Release notes (first 200 chars) */}
              {update.releaseNotes && (
                <div className="mb-4 max-h-32 overflow-y-auto rounded-lg bg-black/20 p-3 text-[11px] leading-relaxed text-[var(--text-secondary)] scroll-nebula">
                  <pre className="prose-nebula whitespace-pre-wrap font-sans">
                    {update.releaseNotes.slice(0, 400)}
                    {update.releaseNotes.length > 400 ? "…" : ""}
                  </pre>
                </div>
              )}

              {/* Published date */}
              {update.publishedAt && (
                <div className="mb-3 text-[10px] text-[var(--text-tertiary)]">
                  Released {new Date(update.publishedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all"
                  style={{
                    background: "var(--neon-soft)",
                    color: "var(--neon)",
                    boxShadow: "0 0 12px var(--neon-soft)",
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download update
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex h-9 items-center justify-center rounded-lg px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Up to date" indicator — used by settings panel via the global checkForUpdates */}
      {/* This is a no-op render; the settings panel calls checkForUpdates directly */}
      {isChecking && !showPopup && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[10px] text-white/60 backdrop-blur-md">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking for updates…
        </div>
      )}
    </>
  );
}

/**
 * Exported for the settings panel to trigger a manual check.
 * Returns the update info or null.
 */
export async function checkForUpdatesManual(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`/api/updates/check?current=${APP_VERSION}`);
    return await res.json();
  } catch {
    return null;
  }
}

export { APP_VERSION, GITHUB_REPO };

// Re-export for settings panel
export function UpdateStatusBadge({ update }: { update: UpdateInfo | null }) {
  if (!update) return null;
  if (update.hasUpdate) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-[var(--neon-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--neon)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon)] nebula-pulse" />
        v{update.latestVersion} available
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
      <CheckCircle2 className="h-3 w-3 text-[var(--text-secondary)]" />
      Up to date (v{APP_VERSION})
    </span>
  );
}
