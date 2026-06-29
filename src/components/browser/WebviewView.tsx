"use client";

import { motion } from "framer-motion";
import { ExternalLink, Shield, Sparkles, Lock, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBrowserStore } from "@/lib/browser-store";
import { useAIStore } from "@/lib/ai-store";
import { prettyUrl, hostOf } from "@/lib/url";
import {
  registerWebview,
  unregisterWebview,
  type WebViewElement,
} from "@/lib/webview-registry";

interface WebviewViewProps {
  tabId: string;
  /** The initial URL to load. Changes to this prop are IGNORED after mount
   *  to prevent reload feedback loops (webview navigates → store updates URL →
   *  prop changes → webview re-loads → infinite loop). */
  url: string;
  initialTitle: string;
}

/**
 * Renders a real, interactive web page using Electron's <webview> tag.
 *
 * CRITICAL: The `src` attribute is set ONCE on mount. We never update it in
 * response to prop changes — that would cause a reload feedback loop because
 * the webview's own navigation events update the tab store, which would then
 * flow back as a new `url` prop and re-trigger the load.
 *
 * When the user types a NEW url in the omnibox, the TabContent component
 * unmounts this WebviewView (keyed by tab id + url) and mounts a fresh one
 * with the new src.
 */
export function WebviewView({ tabId, url, initialTitle }: WebviewViewProps) {
  const webviewRef = useRef<WebViewElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track the last URL we synced to the store, so we don't sync the same one twice
  const lastSyncedUrl = useRef<string>("");

  const setTabStatus = useBrowserStore((s) => s.setTabStatus);
  const setTabTitle = useBrowserStore((s) => s.setTabTitle);
  const isAISidebarOpen = useBrowserStore((s) => s.isAISidebarOpen);
  const toggleAISidebar = useBrowserStore((s) => s.toggleAISidebar);
  const setMode = useAIStore((s) => s.setMode);
  const newConversation = useAIStore((s) => s.newConversation);

  const host = hostOf(url);

  // Register/unregister the webview so the Toolbar can call goBack/goForward/reload
  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    registerWebview(tabId, wv);

    const onLoadingStart = () => {
      setIsLoading(true);
      setError(null);
      setTabStatus(tabId, "loading");
    };
    const onLoadingStop = () => {
      setIsLoading(false);
      setTabStatus(tabId, "idle");
    };
    const onTitleUpdated = (e: Event) => {
      const ev = e as unknown as { title: string };
      if (ev.title) {
        setTabTitle(tabId, ev.title);
      }
    };
    const onDidNavigate = (e: Event) => {
      const ev = e as unknown as { url: string };
      // Sync the new URL silently to the store WITHOUT triggering a reload.
      // We do this by directly patching the tab in the store via getState,
      // avoiding the navigateTab() action which sets status to "loading".
      if (ev.url && ev.url !== lastSyncedUrl.current) {
        lastSyncedUrl.current = ev.url;
        // Directly patch the URL in the store without triggering a loading cycle
        useBrowserStore.setState((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tabId
              ? { ...t, url: ev.url, title: wv.getTitle() || t.title }
              : t
          ),
        }));
      }
    };
    const onDidFailLoad = (e: Event) => {
      const ev = e as unknown as { errorCode: number; errorDescription: string; isMainFrame: boolean };
      // Ignore sub-frame errors and the ABORTED (-3) code which happens when
      // the user navigates away before a load completes (normal behavior).
      if (!ev.isMainFrame) return;
      if (ev.errorCode === -3) return; // ERR_ABORTED — user navigated away, not a real error
      if (ev.errorCode === 0) return;
      setError(ev.errorDescription || `Error code ${ev.errorCode}`);
      setTabStatus(tabId, "error");
    };
    const onNewWindow = (e: Event) => {
      const ev = e as unknown as { url: string };
      // Open links that request new windows in the user's default browser
      if (ev.url) {
        if (window.nebulaDesktop?.openExternal) {
          window.nebulaDesktop.openExternal(ev.url);
        } else {
          window.open(ev.url, "_blank");
        }
      }
    };

    wv.addEventListener("did-start-loading", onLoadingStart);
    wv.addEventListener("did-stop-loading", onLoadingStop);
    wv.addEventListener("page-title-updated", onTitleUpdated);
    wv.addEventListener("did-navigate", onDidNavigate);
    wv.addEventListener("did-navigate-in-page", onDidNavigate);
    wv.addEventListener("did-fail-load", onDidFailLoad);
    wv.addEventListener("new-window", onNewWindow);

    // Mark the initial URL as already synced so we don't re-trigger a load
    lastSyncedUrl.current = url;

    return () => {
      unregisterWebview(tabId);
      wv.removeEventListener("did-start-loading", onLoadingStart);
      wv.removeEventListener("did-stop-loading", onLoadingStop);
      wv.removeEventListener("page-title-updated", onTitleUpdated);
      wv.removeEventListener("did-navigate", onDidNavigate);
      wv.removeEventListener("did-navigate-in-page", onDidNavigate);
      wv.removeEventListener("did-fail-load", onDidFailLoad);
      wv.removeEventListener("new-window", onNewWindow);
    };
  }, [tabId]); // Only re-run if tabId changes — NOT on url change

  const handleSummarize = () => {
    setMode("summarize");
    if (!isAISidebarOpen) toggleAISidebar(true);
    if (!useAIStore.getState().activeConversationId) newConversation();
  };

  return (
    <div className="relative h-full w-full bg-[var(--bg-canvas)]">
      {/* Loading bar at the top */}
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-0 right-0 top-0 z-20 h-0.5 origin-left"
          style={{
            background: "var(--neon)",
            boxShadow: "0 0 8px var(--neon-soft)",
          }}
        />
      )}

      {/* The actual webview — fills the entire viewport.
          src is set ONCE on mount; subsequent navigations happen inside the
          webview itself and are synced back to the store via events. */}
      <webview
        ref={webviewRef as React.RefObject<HTMLWebViewElement>}
        src={url}
        className="h-full w-full"
        style={{ border: "none", display: "inline-flex" }}
        allowpopups="true"
      />

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-canvas)] p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong max-w-md rounded-2xl p-6 text-center"
          >
            <div className="mb-3 text-[#FF5F57]">
              <Shield className="mx-auto h-8 w-8" />
            </div>
            <h3 className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">
              Couldn&apos;t load this page
            </h3>
            <p className="mb-4 text-[12px] text-[var(--text-secondary)]">
              {error}
            </p>
            <p className="mb-4 text-[11px] text-[var(--text-tertiary)]">
              URL: {prettyUrl(url)}
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  webviewRef.current?.reload();
                }}
                className="flex h-8 items-center gap-1.5 rounded-full bg-[var(--neon-soft)] px-3 text-[11px] font-semibold text-[var(--neon)]"
              >
                <Loader2 className="h-3 w-3" />
                Retry
              </button>
              <button
                type="button"
                onClick={() =>
                  window.nebulaDesktop?.openExternal
                    ? window.nebulaDesktop.openExternal(url)
                    : window.open(url, "_blank")
                }
                className="flex h-8 items-center gap-1.5 rounded-full bg-white/5 px-3 text-[11px] font-semibold text-[var(--text-primary)]"
              >
                <ExternalLink className="h-3 w-3" />
                Open in system browser
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating "Summarize" button (bottom-right) */}
      <motion.button
        type="button"
        onClick={handleSummarize}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-4 right-4 z-10 flex h-9 items-center gap-1.5 rounded-full bg-[var(--neon-soft)] px-3 text-[12px] font-semibold text-[var(--neon)] backdrop-blur-md"
        style={{ boxShadow: "0 0 16px var(--neon-soft)" }}
        title="Summarize this page with Nebula AI"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Summarize
      </motion.button>

      {/* Security badge (top-left, minimal) */}
      <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[9px] text-white/60 backdrop-blur-md">
        <Lock className="h-2.5 w-2.5" />
        {host}
      </div>
    </div>
  );
}
