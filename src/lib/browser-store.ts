import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TabStatus = "loading" | "idle" | "error";

export interface Tab {
  id: string;
  title: string;
  url: string;          // canonical URL, or "" for NTP
  favicon?: string;     // emoji or letter for mock favicons
  status: TabStatus;
  history: string[];    // back/forward stack of URLs visited in this tab
  historyIndex: number;
  isIncognito?: boolean;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
}

export type DownloadStatus = "completed" | "in_progress" | "paused" | "failed";
export type DownloadKind = "image" | "pdf" | "text" | "video" | "audio" | "archive" | "code" | "file";

export interface DownloadItem {
  id: string;
  name: string;
  url: string;          // source URL or blob: URL
  size: number;         // bytes
  sizeLabel: string;    // pre-formatted, e.g. "4.2 MB"
  kind: DownloadKind;
  status: DownloadStatus;
  progress: number;     // 0..100
  startedAt: number;
  completedAt?: number;
  blobUrl?: string;     // object URL for preview / drag-out
  textPreview?: string; // first ~2KB of text content (for AI attach)
}

interface BrowserState {
  tabs: Tab[];
  activeTabId: string | null;
  /** When set, this tab is pinned to the right half of the viewport (split-screen). */
  splitTabId: string | null;
  bookmarks: Bookmark[];
  history: HistoryEntry[];
  downloads: DownloadItem[];
  isBookmarkBarOpen: boolean;
  isHistoryPanelOpen: boolean;
  isDownloadsPanelOpen: boolean;
  isSettingsOpen: boolean;
  isCommandPaletteOpen: boolean;
  isAISidebarOpen: boolean;

  newTab: () => string;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  reorderTabs: (from: number, to: number) => void;
  navigateTab: (id: string, url: string, title?: string) => void;
  goBack: (id: string) => void;
  goForward: (id: string) => void;
  reloadTab: (id: string) => void;
  setTabStatus: (id: string, status: TabStatus) => void;
  setTabTitle: (id: string, title: string) => void;

  /** Bulk tab actions used by the right-click context menu. */
  duplicateTab: (id: string) => void;
  closeOthers: (id: string) => void;
  closeTabsToTheLeft: (id: string) => void;
  closeTabsToTheRight: (id: string) => void;
  closeAllTabs: () => void;
  copyTabUrl: (id: string) => string | null;

  /** Split-screen: pin a tab to the right half of the viewport. */
  toggleSplit: (id: string | null) => void;
  swapSplitWithActive: () => void;
  closeSplit: () => void;

  addBookmark: (b: Omit<Bookmark, "id" | "createdAt">) => void;
  removeBookmark: (id: string) => void;
  reorderBookmarks: (from: number, to: number) => void;
  isBookmarked: (url: string) => boolean;

  addHistory: (entry: Omit<HistoryEntry, "id" | "visitedAt">) => void;
  clearHistory: () => void;

  addDownload: (d: Omit<DownloadItem, "id" | "startedAt">) => string;
  updateDownload: (id: string, patch: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
  clearDownloads: () => void;

  toggleBookmarkBar: () => void;
  toggleHistoryPanel: (v?: boolean) => void;
  toggleDownloadsPanel: (v?: boolean) => void;
  toggleSettings: (v?: boolean) => void;
  toggleCommandPalette: (v?: boolean) => void;
  toggleAISidebar: (v?: boolean) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const NTP_TITLE = "New Tab";

/**
 * Deterministic ID generator for initial/default state.
 * Uses a counter so server-rendered HTML matches client-rendered HTML
 * (Math.random and Date.now cause hydration mismatches otherwise).
 */
let initCounter = 0;
const initId = (prefix: string) => `${prefix}-${initCounter++}`;
const INIT_TIME = 1700000000000; // fixed timestamp for default state

function makeNewTab(id?: string): Tab {
  return {
    id: id ?? uid(),
    title: NTP_TITLE,
    url: "",
    favicon: "✦",
    status: "idle",
    history: [""],
    historyIndex: 0,
    createdAt: INIT_TIME,
  };
}

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
      tabs: [makeNewTab("tab-init")],
      activeTabId: "tab-init",
      splitTabId: null,
      bookmarks: [
        { id: initId("bm"), title: "GitHub",      url: "https://github.com",            favicon: "G", createdAt: INIT_TIME },
        { id: initId("bm"), title: "YouTube",     url: "https://youtube.com",           favicon: "Y", createdAt: INIT_TIME },
        { id: initId("bm"), title: "X",           url: "https://x.com",                 favicon: "X", createdAt: INIT_TIME },
        { id: initId("bm"), title: "Hacker News", url: "https://news.ycombinator.com",  favicon: "N", createdAt: INIT_TIME },
        { id: initId("bm"), title: "Wikipedia",   url: "https://wikipedia.org",         favicon: "W", createdAt: INIT_TIME },
        { id: initId("bm"), title: "Reddit",      url: "https://reddit.com",            favicon: "R", createdAt: INIT_TIME },
      ],
      history: [],
      downloads: [],
      isBookmarkBarOpen: true,
      isHistoryPanelOpen: false,
      isDownloadsPanelOpen: false,
      isSettingsOpen: false,
      isCommandPaletteOpen: false,
      isAISidebarOpen: true,

      newTab: () => {
        const t = makeNewTab();
        set((s) => ({ tabs: [...s.tabs, t], activeTabId: t.id }));
        return t.id;
      },
      closeTab: (id) => {
        const { tabs, activeTabId, splitTabId } = get();
        if (tabs.length === 1) {
          const fresh = makeNewTab();
          set({ tabs: [fresh], activeTabId: fresh.id, splitTabId: null });
          return;
        }
        const idx = tabs.findIndex((t) => t.id === id);
        const next = tabs.filter((t) => t.id !== id);
        let nextActive = activeTabId;
        if (activeTabId === id) {
          const fallback = next[Math.min(idx, next.length - 1)];
          nextActive = fallback?.id ?? null;
        }
        const nextSplit = splitTabId === id ? null : splitTabId;
        set({ tabs: next, activeTabId: nextActive, splitTabId: nextSplit });
      },
      activateTab: (id) => set({ activeTabId: id }),
      reorderTabs: (from, to) =>
        set((s) => {
          if (from === to || from < 0 || to < 0 || from >= s.tabs.length || to >= s.tabs.length) return s;
          const next = [...s.tabs];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { tabs: next };
        }),
      navigateTab: (id, url, title) =>
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== id) return t;
            const truncatedHistory = t.history.slice(0, t.historyIndex + 1);
            truncatedHistory.push(url);
            return {
              ...t,
              url,
              title: title ?? deriveTitle(url),
              status: "loading",
              history: truncatedHistory,
              historyIndex: truncatedHistory.length - 1,
            };
          }),
        })),
      goBack: (id) =>
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== id || t.historyIndex <= 0) return t;
            const idx = t.historyIndex - 1;
            const url = t.history[idx];
            return { ...t, historyIndex: idx, url, title: url ? deriveTitle(url) : NTP_TITLE, status: url ? "loading" : "idle" };
          }),
        })),
      goForward: (id) =>
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== id || t.historyIndex >= t.history.length - 1) return t;
            const idx = t.historyIndex + 1;
            const url = t.history[idx];
            return { ...t, historyIndex: idx, url, title: url ? deriveTitle(url) : NTP_TITLE, status: url ? "loading" : "idle" };
          }),
        })),
      reloadTab: (id) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id ? { ...t, status: "loading" as TabStatus } : t
          ),
        })),
      setTabStatus: (id, status) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, status } : t)),
        })),
      setTabTitle: (id, title) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      duplicateTab: (id) => {
        const src = get().tabs.find((t) => t.id === id);
        if (!src) return;
        const copy: Tab = {
          ...src,
          id: uid(),
          createdAt: Date.now(),
          history: [...src.history],
          status: "idle",
        };
        const idx = get().tabs.findIndex((t) => t.id === id);
        const next = [...get().tabs];
        next.splice(idx + 1, 0, copy);
        set({ tabs: next, activeTabId: copy.id });
      },

      closeOthers: (id) => {
        const { tabs } = get();
        const keep = tabs.find((t) => t.id === id);
        if (!keep) return;
        set({ tabs: [keep], activeTabId: keep.id, splitTabId: null });
      },

      closeTabsToTheLeft: (id) => {
        const { tabs, activeTabId, splitTabId } = get();
        const idx = tabs.findIndex((t) => t.id === id);
        if (idx === -1) return;
        const next = tabs.slice(idx);
        // If the active tab was closed, switch to the kept tab
        const stillActive = next.some((t) => t.id === activeTabId);
        const stillSplit = next.some((t) => t.id === splitTabId);
        set({
          tabs: next,
          activeTabId: stillActive ? activeTabId : id,
          splitTabId: stillSplit ? splitTabId : null,
        });
      },

      closeTabsToTheRight: (id) => {
        const { tabs, activeTabId, splitTabId } = get();
        const idx = tabs.findIndex((t) => t.id === id);
        if (idx === -1) return;
        const next = tabs.slice(0, idx + 1);
        const stillActive = next.some((t) => t.id === activeTabId);
        const stillSplit = next.some((t) => t.id === splitTabId);
        set({
          tabs: next,
          activeTabId: stillActive ? activeTabId : id,
          splitTabId: stillSplit ? splitTabId : null,
        });
      },

      closeAllTabs: () => {
        const fresh = makeNewTab();
        set({ tabs: [fresh], activeTabId: fresh.id, splitTabId: null });
      },

      copyTabUrl: (id) => {
        const t = get().tabs.find((x) => x.id === id);
        if (!t || !t.url) return null;
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(t.url).catch(() => {});
        }
        return t.url;
      },

      toggleSplit: (id) => {
        const { splitTabId, activeTabId } = get();
        // Don't split the active tab with itself
        if (id === activeTabId) return;
        // Toggling the already-split tab closes split
        if (splitTabId === id) {
          set({ splitTabId: null });
          return;
        }
        set({ splitTabId: id });
      },

      swapSplitWithActive: () => {
        const { splitTabId, activeTabId } = get();
        if (!splitTabId || !activeTabId) return;
        set({ activeTabId: splitTabId, splitTabId: activeTabId });
      },

      closeSplit: () => set({ splitTabId: null }),

      addBookmark: (b) =>
        set((s) => {
          if (s.bookmarks.some((x) => x.url === b.url)) return s;
          return {
            bookmarks: [
              ...s.bookmarks,
              { ...b, id: uid(), createdAt: Date.now() },
            ],
          };
        }),
      removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
      reorderBookmarks: (from, to) =>
        set((s) => {
          if (from === to || from < 0 || to < 0 || from >= s.bookmarks.length || to >= s.bookmarks.length) return s;
          const next = [...s.bookmarks];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { bookmarks: next };
        }),
      isBookmarked: (url) => get().bookmarks.some((b) => b.url === url),

      addHistory: (entry) =>
        set((s) => ({
          history: [
            { ...entry, id: uid(), visitedAt: Date.now() },
            ...s.history,
          ].slice(0, 200),
        })),
      clearHistory: () => set({ history: [] }),

      addDownload: (d) => {
        const id = uid();
        set((s) => ({
          downloads: [
            { ...d, id, startedAt: Date.now() },
            ...s.downloads,
          ].slice(0, 100),
        }));
        return id;
      },
      updateDownload: (id, patch) =>
        set((s) => ({
          downloads: s.downloads.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      removeDownload: (id) =>
        set((s) => ({
          downloads: s.downloads.filter((d) => d.id !== id),
        })),
      clearDownloads: () => set({ downloads: [] }),

      toggleBookmarkBar: () =>
        set((s) => ({ isBookmarkBarOpen: !s.isBookmarkBarOpen })),
      toggleHistoryPanel: (v) =>
        set((s) => ({ isHistoryPanelOpen: v ?? !s.isHistoryPanelOpen })),
      toggleDownloadsPanel: (v) =>
        set((s) => ({ isDownloadsPanelOpen: v ?? !s.isDownloadsPanelOpen })),
      toggleSettings: (v) =>
        set((s) => ({ isSettingsOpen: v ?? !s.isSettingsOpen })),
      toggleCommandPalette: (v) =>
        set((s) => ({ isCommandPaletteOpen: v ?? !s.isCommandPaletteOpen })),
      toggleAISidebar: (v) =>
        set((s) => ({ isAISidebarOpen: v ?? !s.isAISidebarOpen })),
    }),
    {
      name: "nebula-browser",
      partialize: (s) => ({
        bookmarks: s.bookmarks,
        history: s.history,
        downloads: s.downloads.filter((d) => !d.blobUrl), // blob URLs can't persist
        isBookmarkBarOpen: s.isBookmarkBarOpen,
        isAISidebarOpen: s.isAISidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.tabs.length > 0 && !state.activeTabId) {
          state.activeTabId = state.tabs[0].id;
        }
      },
    }
  )
);

function deriveTitle(url: string): string {
  if (!url) return NTP_TITLE;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
