"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, Shield, Sparkles, Globe, Lock, X, ArrowLeftRight,
  PinOff,
} from "lucide-react";
import { useBrowserStore, type Tab } from "@/lib/browser-store";
import { useAIStore } from "@/lib/ai-store";
import { prettyUrl, faviconFor, hostOf } from "@/lib/url";
import { classifyFile } from "@/lib/files";
import { isElectron } from "@/lib/webview-registry";
import { NewTabPage } from "./NewTabPage";
import { WebviewView } from "./WebviewView";
import { SettingsPage } from "./SettingsPage";
import { AuthPage } from "./AuthPage";
import { MarketplacePage } from "./MarketplacePage";
import { ProfilePage } from "./ProfilePage";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

export function Viewport() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const splitTabId = useBrowserStore((s) => s.splitTabId);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const splitTab = splitTabId ? tabs.find((t) => t.id === splitTabId) : null;

  // Split view takes over the whole viewport when active
  if (splitTab && activeTab && splitTab.id !== activeTab.id) {
    return (
      <div className="relative flex-1 overflow-hidden">
        <SplitView leftTab={activeTab} rightTab={splitTab} />
      </div>
    );
  }

  // In Electron mode, keep ALL webviews mounted simultaneously so background tabs
  // keep their state (audio keeps playing, video doesn't pause, scroll position
  // is preserved, form inputs aren't lost). Only the active tab is visible;
  // others are hidden with display:none but stay alive in the DOM.
  if (isElectron()) {
    return <BackgroundTabContainer tabs={tabs} activeTabId={activeTabId} />;
  }

  // In regular browser mode (no webview), use the simple animated single-view
  return (
    <div className="relative flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab?.id ?? "empty"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 overflow-hidden"
        >
          <TabContent tab={activeTab} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Renders ALL tabs simultaneously, keeping their webviews alive in the background.
 * Only the active tab is visible; others are hidden via display:none.
 * This preserves audio/video playback, scroll state, and form input when switching tabs.
 */
function BackgroundTabContainer({
  tabs,
  activeTabId,
}: {
  tabs: Tab[];
  activeTabId: string | null;
}) {
  return (
    <div className="relative flex-1 overflow-hidden">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className="absolute inset-0 overflow-hidden"
            style={{ display: isActive ? "block" : "none" }}
            aria-hidden={!isActive}
          >
            <TabContent tab={tab} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders one tab's content.
 *  - Empty URL              → NewTabPage (Grok-style start page)
 *  - nebula://settings      → SettingsPage (full-page settings)
 *  - nebula://auth          → AuthPage (full-page sign-in)
 *  - blob:/data: URL        → LocalFilePreview (dropped files)
 *  - http(s) URL + Electron → WebviewView (REAL web browsing via <webview>)
 *  - http(s) URL + browser  → PagePreview (fallback card — can't iframe most sites)
 */
function TabContent({ tab }: { tab: Tab | undefined }) {
  const isAISidebarOpen = useBrowserStore((s) => s.isAISidebarOpen);
  const toggleAISidebar = useBrowserStore((s) => s.toggleAISidebar);
  const setMode = useAIStore((s) => s.setMode);
  const newConversation = useAIStore((s) => s.newConversation);
  const { theme } = useTheme();

  const url = tab?.url ?? "";
  const isBlob = url.startsWith("blob:") || url.startsWith("data:");
  const isNebulaUrl = url.startsWith("nebula://");

  const handleSummarize = () => {
    setMode("summarize");
    if (!isAISidebarOpen) toggleAISidebar(true);
    if (!useAIStore.getState().activeConversationId) newConversation();
  };

  if (!tab || !tab.url) {
    return <NewTabPage />;
  }
  // Nebula internal pages — render full-page components instead of webviews
  if (url === "nebula://settings") {
    return <SettingsPage />;
  }
  if (url === "nebula://auth") {
    return <AuthPage />;
  }
  if (url === "nebula://marketplace" || url.startsWith("nebula://marketplace/")) {
    return <MarketplacePage />;
  }
  if (url === "nebula://profile") {
    return <ProfilePage />;
  }
  if (isBlob) {
    return <LocalFilePreview url={url} name={tab.title} onSummarize={handleSummarize} />;
  }
  // In Electron, render a real webview so the user can actually browse the web.
  // The key combines tabId + navEpoch so the webview remounts ONLY when the user
  // explicitly navigates (omnibox submit, bookmark click, back/forward) — NOT when
  // the webview navigates internally (clicking a link inside the page).
  if (isElectron()) {
    return (
      <WebviewView
        key={`${tab.id}-${tab.navEpoch}`}
        tabId={tab.id}
        url={url}
        initialTitle={tab.title}
      />
    );
  }
  // In a regular browser, fall back to the preview card
  return <PagePreview url={url} title={tab.title} theme={theme ?? "dark"} onSummarize={handleSummarize} />;
}

/**
 * Split-view layout: two tabs side-by-side with a draggable neon divider.
 * The left pane shows the active tab; the right pane shows the split-pinned tab.
 * A small floating control bar at the top lets users swap sides or exit split.
 *
 * Divider dragging uses Pointer Events + setPointerCapture for smooth,
 * jank-free resizing — the pointer is "captured" by the divider element so
 * mousemove events keep firing even if the cursor leaves the element.
 * State updates are batched via requestAnimationFrame to avoid layout thrash.
 */
function SplitView({ leftTab, rightTab }: { leftTab: Tab; rightTab: Tab }) {
  const swapSplitWithActive = useBrowserStore((s) => s.swapSplitWithActive);
  const closeSplit = useBrowserStore((s) => s.closeSplit);
  const activateTab = useBrowserStore((s) => s.activateTab);
  const [splitPct, setSplitPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetPctRef = useRef(50);

  // Pointer-based divider drag — smooth, no mouse escape issues
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dividerRef.current || !containerRef.current) return;
    // Capture the pointer so mousemove keeps firing even outside the divider
    dividerRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (!dividerRef.current?.hasPointerCapture(e.pointerId)) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    targetPctRef.current = Math.min(85, Math.max(15, pct));

    // Throttle state updates to one per animation frame for buttery smoothness
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setSplitPct(targetPctRef.current);
        rafRef.current = null;
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dividerRef.current?.hasPointerCapture(e.pointerId)) {
      dividerRef.current.releasePointerCapture(e.pointerId);
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsDragging(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  // Cleanup any pending rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 flex">
      {/* Left pane */}
      <div
        className="relative h-full overflow-hidden border-r border-[var(--border-hairline)]"
        style={{ width: `${splitPct}%` }}
      >
        <SplitPaneChrome label="Active" tab={leftTab} onClick={() => activateTab(leftTab.id)} />
        <div className="absolute inset-0 top-[28px] overflow-hidden">
          <TabContent tab={leftTab} />
        </div>
      </div>

      {/* Divider — wider hit area, pointer capture for smooth drag */}
      <div
        ref={dividerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative z-20 flex h-full w-1 cursor-col-resize items-center justify-center touch-none"
        style={{
          background: isDragging ? "var(--neon)" : "var(--border-hairline)",
          boxShadow: isDragging ? "0 0 12px var(--neon-soft)" : "none",
          transition: isDragging ? "none" : "background 0.15s",
        }}
      >
        {/* Invisible wider hit area for easier grabbing */}
        <div className="absolute h-full w-3 cursor-col-resize" style={{ background: "transparent" }} />
        {/* Neon grab handle */}
        <motion.div
          animate={{
            height: isDragging ? 48 : 32,
            opacity: isDragging ? 1 : 0.7,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="w-1 rounded-full bg-[var(--neon)]"
          style={{ boxShadow: "0 0 12px var(--neon-soft)" }}
        />
      </div>

      {/* Right pane */}
      <div
        className="relative h-full flex-1 overflow-hidden"
      >
        <SplitPaneChrome
          label="Split"
          tab={rightTab}
          onClick={() => activateTab(rightTab.id)}
          actions={
            <>
              <button
                type="button"
                onClick={swapSplitWithActive}
                title="Swap sides"
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)]"
              >
                <ArrowLeftRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={closeSplit}
                title="Exit split view"
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[#FF5F57]"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          }
        />
        <div className="absolute inset-0 top-[28px] overflow-hidden">
          <TabContent tab={rightTab} />
        </div>
      </div>
    </div>
  );
}

function SplitPaneChrome({
  label,
  tab,
  onClick,
  actions,
}: {
  label: string;
  tab: Tab;
  onClick: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex h-7 items-center gap-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 backdrop-blur-xl">
      <span
        className="rounded-full bg-[var(--neon-soft)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[var(--neon)]"
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        title="Focus this tab"
      >
        <span className="flex h-3 w-3 shrink-0 items-center justify-center text-[10px] font-bold text-[var(--text-secondary)]">
          {tab.favicon ?? "✦"}
        </span>
        <span className="truncate text-[11px] font-medium text-[var(--text-primary)]">
          {tab.title || "New Tab"}
        </span>
      </button>
      {actions}
    </div>
  );
}

/**
 * Renders a locally-dropped file (blob:/data:) inside the viewport.
 * Picks the right renderer by file kind: image, video, audio, pdf, text/code.
 */
function LocalFilePreview({
  url,
  name,
  onSummarize,
}: {
  url: string;
  name: string;
  onSummarize: () => void;
}) {
  const kind = classifyFile(name);
  // Three-state: undefined = loading, string = loaded, null = error
  const [textContent, setTextContent] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (kind !== "text" && kind !== "code") return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.text())
      .then((t) => { if (!cancelled) setTextContent(t); })
      .catch(() => { if (!cancelled) setTextContent(null); });
    return () => { cancelled = true; };
  }, [url, kind]);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto scroll-nebula p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[var(--neon)]" />
            <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">
              {name}
            </span>
            <span className="rounded-full bg-[var(--neon-soft)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--neon)]">
              Local file
            </span>
          </div>
          <button
            type="button"
            onClick={onSummarize}
            className="flex h-7 items-center gap-1.5 rounded-full bg-[var(--neon-soft)] px-3 text-[11px] font-semibold text-[var(--neon)] transition-transform hover:scale-105"
          >
            <Sparkles className="h-3 w-3" />
            Summarize
          </button>
        </div>

        {/* Body */}
        <div className="flex max-h-[70vh] min-h-[260px] items-center justify-center overflow-y-auto scroll-nebula p-6">
          {kind === "image" ? (
            <img
              src={url}
              alt={name}
              className="max-h-[60vh] max-w-full rounded-lg object-contain"
              style={{ boxShadow: "0 0 32px var(--neon-soft)" }}
            />
          ) : kind === "video" ? (
            <video
              src={url}
              controls
              className="max-h-[60vh] max-w-full rounded-lg"
              style={{ boxShadow: "0 0 32px var(--neon-soft)" }}
            />
          ) : kind === "audio" ? (
            <div className="flex w-full max-w-md flex-col items-center gap-4 py-8">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--neon-soft)] text-[32px]"
                style={{ boxShadow: "0 0 24px var(--neon-soft)" }}
              >
                🎵
              </div>
              <audio src={url} controls className="w-full" />
            </div>
          ) : kind === "pdf" ? (
            <iframe
              src={url}
              title={name}
              className="h-[70vh] w-full rounded-lg border border-[var(--border-hairline)] bg-white"
            />
          ) : kind === "text" || kind === "code" ? (
            textContent === undefined ? (
              <div className="text-[12px] text-[var(--text-tertiary)]">Loading…</div>
            ) : textContent === null ? (
              <div className="text-[13px] text-[#FF5F57]">Failed to load file content.</div>
            ) : (
              <pre className="prose-nebula max-h-[60vh] w-full overflow-auto rounded-lg bg-black/30 p-4 font-mono text-[12px] leading-relaxed text-[var(--text-primary)] scroll-nebula">
                <code>{textContent}</code>
              </pre>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-[36px]">
                📄
              </div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                {name}
              </div>
              <div className="text-[12px] text-[var(--text-secondary)]">
                Preview not available for this file type.
              </div>
              <a
                href={url}
                download={name}
                className="flex h-9 items-center gap-2 rounded-full bg-[var(--text-primary)] px-4 text-[12px] font-semibold text-[var(--bg-canvas)] transition-transform hover:scale-105"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Save file
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PagePreview({
  url,
  title,
  theme,
  onSummarize,
}: {
  url: string;
  title: string;
  theme: string;
  onSummarize: () => void;
}) {
  const host = hostOf(url);
  const pretty = prettyUrl(url);
  const letter = faviconFor(url);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto scroll-nebula p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative w-full max-w-3xl overflow-hidden rounded-3xl"
      >
        {/* Browser chrome mockup */}
        <div className="flex items-center gap-2 border-b border-[var(--border-hairline)] px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="ml-3 flex h-7 flex-1 items-center gap-2 rounded-full bg-black/10 px-3">
            <Lock className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="truncate text-[11px] font-medium text-[var(--text-secondary)]">
              {pretty}
            </span>
          </div>
        </div>

        {/* Body — site "card" preview */}
        <div className="flex flex-col items-center gap-6 px-8 py-14 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 20 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-canvas)] text-[32px] font-bold shadow-lg"
            style={{ boxShadow: "0 0 32px var(--neon-soft)" }}
          >
            <span className="text-[var(--text-primary)]">{letter}</span>
          </motion.div>

          <div>
            <h2 className="mb-1 text-[22px] font-semibold text-[var(--text-primary)]">
              {host}
            </h2>
            <p className="text-[13px] text-[var(--text-secondary)]">
              {title}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5">
            <Globe className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="max-w-[280px] truncate text-[11px] text-[var(--text-tertiary)]">
              {url}
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="max-w-md text-[12px] leading-relaxed text-[var(--text-tertiary)]">
              For security, sites like <strong className="text-[var(--text-secondary)]">{host}</strong> don't allow
              being embedded inside another browser. Open it in a real new tab, or ask Nebula to summarize what
              you'll find there.
            </p>

            <div className="mt-2 flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 items-center gap-2 rounded-full bg-[var(--text-primary)] px-4 text-[12px] font-semibold text-[var(--bg-canvas)] transition-transform hover:scale-105"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </a>
              <button
                type="button"
                onClick={onSummarize}
                className="flex h-9 items-center gap-2 rounded-full border border-[var(--neon-soft)] bg-[var(--neon-soft)] px-4 text-[12px] font-semibold text-[var(--neon)] transition-transform hover:scale-105"
                style={{ boxShadow: "0 0 16px var(--neon-soft)" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Summarize with Nebula
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border-hairline)] px-5 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <Shield className="h-3 w-3" />
            <span>Connection is secure · HTTPS</span>
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)]">
            Theme: {theme}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
