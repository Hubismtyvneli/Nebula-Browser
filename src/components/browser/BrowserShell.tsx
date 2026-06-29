"use client";

import { useEffect } from "react";
import { ChromeBar } from "./ChromeBar";
import { Toolbar } from "./Toolbar";
import { BookmarkBar } from "./BookmarkBar";
import { Viewport } from "./Viewport";
import { AISidebar } from "./AISidebar";
import { SettingsPanel } from "./SettingsPanel";
import { CommandPalette } from "./CommandPalette";
import { HistoryPanel } from "./HistoryPanel";
import { DownloadsPanel } from "./DownloadsPanel";
import { FileDropZone } from "./FileDropZone";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { UpdateNotification } from "./UpdateNotification";
import { useBrowserStore } from "@/lib/browser-store";
import { useSettingsStore } from "@/lib/settings-store";
import { formatBytes, classifyFile } from "@/lib/files";

export function BrowserShell() {
  const newTab = useBrowserStore((s) => s.newTab);
  const closeTab = useBrowserStore((s) => s.closeTab);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const tabs = useBrowserStore((s) => s.tabs);
  const toggleCommandPalette = useBrowserStore((s) => s.toggleCommandPalette);
  const toggleAISidebar = useBrowserStore((s) => s.toggleAISidebar);
  const toggleHistoryPanel = useBrowserStore((s) => s.toggleHistoryPanel);
  const toggleSettings = useBrowserStore((s) => s.toggleSettings);
  const activateTab = useBrowserStore((s) => s.activateTab);
  const splitTabId = useBrowserStore((s) => s.splitTabId);
  const toggleSplit = useBrowserStore((s) => s.toggleSplit);
  const closeSplit = useBrowserStore((s) => s.closeSplit);
  const swapSplitWithActive = useBrowserStore((s) => s.swapSplitWithActive);

  // Settings → DOM attributes (accent / glass / motion)
  const accent = useSettingsStore((s) => s.accent);
  const glass = useSettingsStore((s) => s.glass);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-accent", accent);
    html.setAttribute("data-glass", glass);
    if (reduceMotion) {
      html.setAttribute("data-reduce-motion", "true");
    } else {
      html.removeAttribute("data-reduce-motion");
    }
  }, [accent, glass, reduceMotion]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "t") { e.preventDefault(); newTab(); }
      else if (key === "w") {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      }
      else if (key === "k") { e.preventDefault(); toggleCommandPalette(); }
      else if (key === "j") { e.preventDefault(); toggleAISidebar(); }
      else if (key === "y") { e.preventDefault(); toggleHistoryPanel(); }
      else if (key === ",") { e.preventDefault(); toggleSettings(true); }
      // ⌘\ toggles split view; ⌘Shift\ swaps sides
      else if (key === "\\") {
        e.preventDefault();
        if (e.shiftKey) {
          swapSplitWithActive();
        } else if (splitTabId) {
          closeSplit();
        } else {
          // Pin the most recent *other* tab as the split
          const otherTabs = tabs.filter((t) => t.id !== activeTabId && t.url);
          if (otherTabs.length > 0) {
            toggleSplit(otherTabs[otherTabs.length - 1].id);
          }
        }
      }
      else if (key >= "1" && key <= "9") {
        const idx = parseInt(key, 10) - 1;
        if (tabs[idx]) {
          e.preventDefault();
          activateTab(tabs[idx].id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [newTab, closeTab, activeTabId, toggleCommandPalette, toggleAISidebar, toggleHistoryPanel, toggleSettings, tabs, activateTab, splitTabId, toggleSplit, closeSplit, swapSplitWithActive]);

  // Listen for webview downloads (Electron only) — show them in the downloads panel
  useEffect(() => {
    if (typeof window === "undefined" || !window.nebulaDesktop) return;
    const desktop = window.nebulaDesktop;

    // Map Electron download IDs → store download IDs
    const downloadMap = new Map<string, string>();

    const offStarted = desktop.onDownloadStarted((data) => {
      const store = useBrowserStore.getState();
      const kind = classifyFile(data.name, data.mimeType);
      const storeId = store.addDownload({
        name: data.name,
        url: data.url,
        size: data.size,
        sizeLabel: formatBytes(data.size),
        kind,
        status: "in_progress",
        progress: 0,
      });
      downloadMap.set(data.id, storeId);
      store.toggleDownloadsPanel(true); // auto-open the downloads panel
    });

    const offProgress = desktop.onDownloadProgress((data) => {
      const storeId = downloadMap.get(data.id);
      if (!storeId) return;
      const pct = data.total > 0 ? Math.round((data.received / data.total) * 100) : 0;
      useBrowserStore.getState().updateDownload(storeId, {
        progress: pct,
        size: data.total,
        sizeLabel: formatBytes(data.total),
      });
    });

    const offDone = desktop.onDownloadDone((data) => {
      const storeId = downloadMap.get(data.id);
      if (!storeId) return;
      useBrowserStore.getState().updateDownload(storeId, {
        status: data.state === "completed" ? "completed" : "failed",
        progress: data.state === "completed" ? 100 : 0,
        completedAt: Date.now(),
      });
      downloadMap.delete(data.id);
    });

    return () => {
      offStarted();
      offProgress();
      offDone();
    };
  }, []);

  return (
    <div className="relative z-10 flex h-screen w-screen flex-col overflow-hidden">
      <ChromeBar />
      <Toolbar />
      <BookmarkBar />
      <div className="flex flex-1 overflow-hidden">
        <Viewport />
        <AISidebar />
      </div>

      {/* Overlay panels */}
      <SettingsPanel />
      <HistoryPanel />
      <DownloadsPanel />
      <CommandPalette />

      {/* Global file drop zone — appears only when dragging OS files over the window */}
      <FileDropZone />

      {/* First-open tutorial — shows on first launch, can be dismissed */}
      <OnboardingTutorial />

      {/* Update notifier — checks GitHub on launch + every 30 min */}
      <UpdateNotification />

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}

function StatusBar() {
  const tabs = useBrowserStore((s) => s.tabs);
  const isAISidebarOpen = useBrowserStore((s) => s.isAISidebarOpen);
  const splitTabId = useBrowserStore((s) => s.splitTabId);
  return (
    <div className="flex h-5 items-center justify-between border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-[10px] text-[var(--text-tertiary)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span>{tabs.length} tab{tabs.length !== 1 ? "s" : ""}</span>
        <span className="text-[var(--border-glass)]">·</span>
        {splitTabId && (
          <>
            <span className="text-[var(--neon)]">split view on</span>
            <span className="text-[var(--border-glass)]">·</span>
          </>
        )}
        <span>GLM-4.6 ready</span>
      </div>
      <div className="flex items-center gap-3">
        {isAISidebarOpen && (
          <span className="flex items-center gap-1 text-[var(--neon)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon)] nebula-pulse" />
            AI online
          </span>
        )}
        <span>Nebula Browser v0.2.0</span>
      </div>
    </div>
  );
}
