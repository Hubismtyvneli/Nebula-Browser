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

interface BrowserState {
  tabs: Tab[];
  activeTabId: string | null;
  bookmarks: Bookmark[];
  history: HistoryEntry[];
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

  addBookmark: (b: Omit<Bookmark, "id" | "createdAt">) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (url: string) => boolean;

  addHistory: (entry: Omit<HistoryEntry, "id" | "visitedAt">) => void;
  clearHistory: () => void;

  toggleBookmarkBar: () => void;
  toggleHistoryPanel: (v?: boolean) => void;
  toggleDownloadsPanel: (v?: boolean) => void;
  toggleSettings: (v?: boolean) => void;
  toggleCommandPalette: (v?: boolean) => void;
  toggleAISidebar: (v?: boolean) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const NTP_TITLE = "New Tab";

function makeNewTab(): Tab {
  return {
    id: uid(),
    title: NTP_TITLE,
    url: "",
    favicon: "✦",
    status: "idle",
    history: [""],
    historyIndex: 0,
    createdAt: Date.now(),
  };
}

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
      tabs: [makeNewTab()],
      activeTabId: null, // will be set on hydrate
      bookmarks: [
        { id: uid(), title: "GitHub",    url: "https://github.com",     favicon: "G", createdAt: Date.now() },
        { id: uid(), title: "YouTube",   url: "https://youtube.com",    favicon: "Y", createdAt: Date.now() },
        { id: uid(), title: "X",         url: "https://x.com",          favicon: "X", createdAt: Date.now() },
        { id: uid(), title: "Hacker News", url: "https://news.ycombinator.com", favicon: "N", createdAt: Date.now() },
        { id: uid(), title: "Wikipedia", url: "https://wikipedia.org",  favicon: "W", createdAt: Date.now() },
        { id: uid(), title: "Reddit",    url: "https://reddit.com",     favicon: "R", createdAt: Date.now() },
      ],
      history: [],
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
        const { tabs, activeTabId } = get();
        if (tabs.length === 1) {
          const fresh = makeNewTab();
          set({ tabs: [fresh], activeTabId: fresh.id });
          return;
        }
        const idx = tabs.findIndex((t) => t.id === id);
        const next = tabs.filter((t) => t.id !== id);
        let nextActive = activeTabId;
        if (activeTabId === id) {
          const fallback = next[Math.min(idx, next.length - 1)];
          nextActive = fallback?.id ?? null;
        }
        set({ tabs: next, activeTabId: nextActive });
      },
      activateTab: (id) => set({ activeTabId: id }),
      reorderTabs: (from, to) =>
        set((s) => {
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
      isBookmarked: (url) => get().bookmarks.some((b) => b.url === url),

      addHistory: (entry) =>
        set((s) => ({
          history: [
            { ...entry, id: uid(), visitedAt: Date.now() },
            ...s.history,
          ].slice(0, 200),
        })),
      clearHistory: () => set({ history: [] }),

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
