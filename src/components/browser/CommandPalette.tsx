"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, Star, Plus, ArrowRight, Settings as SettingsIcon, Sparkles, X, Columns2, ArrowLeftRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBrowserStore } from "@/lib/browser-store";
import { prettyUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  group: "tabs" | "bookmarks" | "history" | "actions";
  action: () => void;
}

export function CommandPalette() {
  const isOpen = useBrowserStore((s) => s.isCommandPaletteOpen);
  const toggle = useBrowserStore((s) => s.toggleCommandPalette);
  const tabs = useBrowserStore((s) => s.tabs);
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const history = useBrowserStore((s) => s.history);
  const newTab = useBrowserStore((s) => s.newTab);
  const activateTab = useBrowserStore((s) => s.activateTab);
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const toggleAISidebar = useBrowserStore((s) => s.toggleAISidebar);
  const toggleSettings = useBrowserStore((s) => s.toggleSettings);
  const splitTabId = useBrowserStore((s) => s.splitTabId);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const tabCmds: Command[] = tabs.map((t) => ({
      id: `tab-${t.id}`,
      label: t.title || "New Tab",
      hint: "Tab",
      icon: <Sparkles className="h-3.5 w-3.5" />,
      group: "tabs",
      action: () => {
        activateTab(t.id);
        toggle(false);
      },
    }));
    const bmCmds: Command[] = bookmarks.map((b) => ({
      id: `bm-${b.id}`,
      label: b.title,
      hint: prettyUrl(b.url),
      icon: <Star className="h-3.5 w-3.5" />,
      group: "bookmarks",
      action: () => {
        if (activeTabId) navigateTab(activeTabId, b.url, b.title);
        toggle(false);
      },
    }));
    const histCmds: Command[] = history.slice(0, 8).map((h) => ({
      id: `hi-${h.id}`,
      label: h.title,
      hint: prettyUrl(h.url),
      icon: <Clock className="h-3.5 w-3.5" />,
      group: "history",
      action: () => {
        if (activeTabId) navigateTab(activeTabId, h.url, h.title);
        toggle(false);
      },
    }));
    const actionCmds: Command[] = [
      {
        id: "act-new-tab",
        label: "New tab",
        hint: "⌘T",
        icon: <Plus className="h-3.5 w-3.5" />,
        group: "actions",
        action: () => {
          newTab();
          toggle(false);
        },
      },
      {
        id: "act-toggle-ai",
        label: "Toggle AI sidebar",
        hint: "⌘J",
        icon: <Sparkles className="h-3.5 w-3.5" />,
        group: "actions",
        action: () => {
          toggleAISidebar();
          toggle(false);
        },
      },
      {
        id: "act-settings",
        label: "Open settings",
        icon: <SettingsIcon className="h-3.5 w-3.5" />,
        group: "actions",
        action: () => {
          toggleSettings(true);
          toggle(false);
        },
      },
      {
        id: "act-toggle-split",
        label: splitTabId ? "Exit split view" : "Enter split view",
        hint: "⌘\\",
        icon: <Columns2 className="h-3.5 w-3.5" />,
        group: "actions",
        action: () => {
          const st = useBrowserStore.getState();
          if (st.splitTabId) {
            st.closeSplit();
          } else {
            const otherTabs = st.tabs.filter((t) => t.id !== st.activeTabId && t.url);
            if (otherTabs.length > 0) {
              st.toggleSplit(otherTabs[otherTabs.length - 1].id);
            }
          }
          toggle(false);
        },
      },
      ...(splitTabId ? [{
        id: "act-swap-split",
        label: "Swap split sides",
        hint: "⌘⇧\\",
        icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
        group: "actions" as const,
        action: () => {
          useBrowserStore.getState().swapSplitWithActive();
          toggle(false);
        },
      }] : []),
    ];
    return [...actionCmds, ...tabCmds, ...bmCmds, ...histCmds];
  }, [tabs, bookmarks, history, activeTabId, activateTab, navigateTab, newTab, toggleAISidebar, toggleSettings, toggle, splitTabId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) =>
      c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  useEffect(() => setActiveIndex(0), [query]);

  // Keyboard nav
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toggle(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[activeIndex]?.action();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, filtered, activeIndex, toggle]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Group filtered results
  const groups = useMemo(() => {
    const out: Record<Command["group"], Command[]> = { tabs: [], bookmarks: [], history: [], actions: [] };
    filtered.forEach((c) => out[c.group].push(c));
    return out;
  }, [filtered]);

  const groupLabels: Record<Command["group"], string> = {
    actions: "Actions",
    tabs: "Tabs",
    bookmarks: "Bookmarks",
    history: "History",
  };

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="glass-strong fixed left-1/2 top-[20%] z-50 w-[560px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-2.5 border-b border-[var(--border-hairline)] px-4 py-3">
              <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tabs, bookmarks, history, or run a command…"
                className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                spellCheck={false}
              />
              <kbd className="rounded border border-[var(--border-hairline)] bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2 scroll-nebula">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px] text-[var(--text-tertiary)]">
                  No results for "{query}"
                </div>
              ) : (
                (Object.keys(groups) as Command["group"][]).map((g) => {
                  if (groups[g].length === 0) return null;
                  return (
                    <div key={g} className="mb-1">
                      <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        {groupLabels[g]}
                      </div>
                      {groups[g].map((cmd) => {
                        runningIndex++;
                        const idx = runningIndex;
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            data-idx={idx}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => cmd.action()}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                              idx === activeIndex ? "bg-[var(--neon-soft)]" : "hover:bg-white/3"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-md",
                                idx === activeIndex ? "text-[var(--neon)]" : "text-[var(--text-secondary)]"
                              )}
                            >
                              {cmd.icon}
                            </span>
                            <span className="flex-1 truncate text-[13px] text-[var(--text-primary)]">
                              {cmd.label}
                            </span>
                            {cmd.hint && (
                              <span className="truncate text-[11px] text-[var(--text-tertiary)]">
                                {cmd.hint}
                              </span>
                            )}
                            {idx === activeIndex && (
                              <ArrowRight className="h-3 w-3 text-[var(--neon)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border-hairline)] px-4 py-2 text-[10px] text-[var(--text-tertiary)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white/5 px-1 py-0.5">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white/5 px-1 py-0.5">↵</kbd> select
                </span>
              </div>
              <span>{filtered.length} results</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
