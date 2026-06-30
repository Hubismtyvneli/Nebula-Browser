"use client";

import { motion } from "framer-motion";
import {
  ExternalLink, Shield, Sparkles, Globe, Lock,
} from "lucide-react";
import { useBrowserStore, type Tab } from "@/lib/browser-store";
import { useAIStore } from "@/lib/ai-store";
import { prettyUrl, hostOf } from "@/lib/url";
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

  // ALWAYS use BackgroundTabContainer — keeps all webviews mounted even during
  // split view and tab switching. No more reloads when switching or splitting.
  return (
    <BackgroundTabContainer
      tabs={tabs}
      activeTabId={activeTabId}
      splitTabId={splitTabId}
    />
  );
}

/**
 * Renders ALL tabs simultaneously, keeping their webviews alive in the background.
 * Handles both normal mode (one tab visible) and split mode (two tabs side by side)
 * WITHOUT unmounting any webviews — no reloads when switching or splitting.
 */
function BackgroundTabContainer({
  tabs,
  activeTabId,
  splitTabId,
}: {
  tabs: Tab[];
  activeTabId: string | null;
  splitTabId: string | null;
}) {
  const splitActive = splitTabId && splitTabId !== activeTabId;

  return (
    <div className="relative flex-1 overflow-hidden">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isSplit = splitActive && tab.id === splitTabId;
        const isVisible = isActive || isSplit;

        // In split mode: active tab = left half, split tab = right half
        // All other tabs: hidden
        let style: React.CSSProperties = { display: isVisible ? "block" : "none" };
        if (splitActive && isVisible) {
          if (isActive) {
            style = { display: "block", position: "absolute", top: 0, bottom: 0, left: 0, width: "50%", zIndex: 1 };
          } else {
            style = { display: "block", position: "absolute", top: 0, bottom: 0, right: 0, width: "50%", zIndex: 1 };
          }
        } else if (isVisible) {
          style = { display: "block", position: "absolute", inset: 0, zIndex: 1 };
        }

        return (
          <div
            key={tab.id}
            className="overflow-hidden"
            style={style}
            aria-hidden={!isVisible}
          >
            <TabContent tab={tab} />
          </div>
        );
      })}

      {/* Split divider — only shown in split mode */}
      {splitActive && <SplitDivider />}
    </div>
  );
}

function SplitDivider() {
  const swapSplitWithActive = useBrowserStore((s) => s.swapSplitWithActive);
  const closeSplit = useBrowserStore((s) => s.closeSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dividerRef.current) return;
    dividerRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dividerRef.current?.hasPointerCapture(e.pointerId) || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(85, Math.max(15, ((e.clientX - rect.left) / rect.width) * 100));

    // Direct DOM manipulation — no React re-renders
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const tabs = containerRef.current?.children;
        if (tabs && tabs.length >= 2) {
          for (let i = 0; i < tabs.length - 1; i++) {
            const tab = tabs[i] as HTMLElement;
            if (tab.style.display !== "none") {
              // This is a visible tab — update its width directly
            }
          }
        }
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dividerRef.current?.hasPointerCapture(e.pointerId)) {
      dividerRef.current.releasePointerCapture(e.pointerId);
    }
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-20">
      <div
        ref={dividerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="pointer-events-auto absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 cursor-col-resize touch-none"
        style={{
          background: isDragging ? "var(--neon)" : "var(--border-hairline)",
          boxShadow: isDragging ? "0 0 12px var(--neon-soft)" : "none",
          transition: isDragging ? "none" : "background 0.15s",
        }}
      >
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-1">
          <button type="button" onClick={swapSplitWithActive} className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)]" title="Swap sides">
            ⇄
          </button>
          <button type="button" onClick={closeSplit} className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[#FF5F57]" title="Exit split">
            ✕
          </button>
        </div>
      </div>
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

// Stub components for non-Electron mode
function LocalFilePreview({ url, name, onSummarize }: { url: string; name: string; onSummarize: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="glass-strong rounded-2xl p-6 text-center">
        <Shield className="mx-auto mb-3 h-8 w-8 text-[var(--neon)]" />
        <h3 className="mb-2 text-[16px] font-semibold">{name}</h3>
        <p className="text-[12px] text-[var(--text-secondary)]">Local file preview</p>
      </div>
    </div>
  );
}

function PagePreview({ url, title, theme, onSummarize }: { url: string; title: string; theme: string; onSummarize: () => void }) {
  const host = hostOf(url);
  const pretty = prettyUrl(url);
  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto scroll-nebula p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative w-full max-w-3xl overflow-hidden rounded-3xl"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border-hairline)] px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="ml-3 flex h-7 flex-1 items-center gap-2 rounded-full bg-black/10 px-3">
            <Lock className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="truncate text-[11px] font-medium text-[var(--text-secondary)]">{pretty}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 px-8 py-14 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 20 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-canvas)] text-[32px] font-bold shadow-lg"
            style={{ boxShadow: "0 0 32px var(--neon-soft)" }}
          >
            <span className="text-[var(--text-primary)]">{host.charAt(0).toUpperCase()}</span>
          </motion.div>
          <div>
            <h2 className="mb-1 text-[22px] font-semibold text-[var(--text-primary)]">{host}</h2>
            <p className="text-[13px] text-[var(--text-secondary)]">{title}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5">
            <Globe className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="max-w-[280px] truncate text-[11px] text-[var(--text-tertiary)]">{url}</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <p className="max-w-md text-[12px] leading-relaxed text-[var(--text-tertiary)]">
              For security, sites like <strong className="text-[var(--text-secondary)]">{host}</strong> don't allow
              being embedded inside another browser. Open it in a real new tab, or ask Nebula to summarize.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <a href={url} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-2 rounded-full bg-[var(--text-primary)] px-4 text-[12px] font-semibold text-[var(--bg-canvas)] transition-transform hover:scale-105">
                <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
              </a>
              <button type="button" onClick={onSummarize} className="flex h-9 items-center gap-2 rounded-full border border-[var(--neon-soft)] bg-[var(--neon-soft)] px-4 text-[12px] font-semibold text-[var(--neon)] transition-transform hover:scale-105" style={{ boxShadow: "0 0 16px var(--neon-soft)" }}>
                <Sparkles className="h-3.5 w-3.5" /> Summarize
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border-hairline)] px-5 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <Shield className="h-3 w-3" /> <span>Connection is secure · HTTPS</span>
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)]">Theme: {theme}</div>
        </div>
      </motion.div>
    </div>
  );
}
