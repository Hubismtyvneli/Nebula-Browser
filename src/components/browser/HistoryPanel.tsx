"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useBrowserStore } from "@/lib/browser-store";
import { prettyUrl } from "@/lib/url";
import { Favicon } from "./Favicon";

export function HistoryPanel() {
  const isOpen = useBrowserStore((s) => s.isHistoryPanelOpen);
  const toggle = useBrowserStore((s) => s.toggleHistoryPanel);
  const history = useBrowserStore((s) => s.history);
  const clearHistory = useBrowserStore((s) => s.clearHistory);
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const activeTabId = useBrowserStore((s) => s.activeTabId);

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter(
      (h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q)
    );
  }, [history, search]);

  // Group by day
  const grouped = useMemo(() => {
    const out: Record<string, typeof filtered> = {};
    filtered.forEach((h) => {
      const d = new Date(h.visitedAt);
      const today = new Date();
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      let label: string;
      if (d.toDateString() === today.toDateString()) label = "Today";
      else if (d.toDateString() === yest.toDateString()) label = "Yesterday";
      else label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      (out[label] ??= []).push(h);
    });
    return out;
  }, [filtered]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--text-secondary)]" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">History</h2>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{history.length} entries</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[#FF5F57]"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggle(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-b border-[var(--border-hairline)] p-3">
              <div className="flex h-9 items-center gap-2 rounded-lg bg-black/10 px-3">
                <Search className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search history…"
                  className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-nebula">
              {filtered.length === 0 ? (
                <div className="px-5 py-12 text-center text-[12px] text-[var(--text-tertiary)]">
                  {history.length === 0
                    ? "No history yet. Visit a page to see it here."
                    : `No matches for "${search}"`}
                </div>
              ) : (
                Object.entries(grouped).map(([day, items]) => (
                  <div key={day} className="px-3 py-2">
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      {day}
                    </div>
                    {items.map((h) => (
                      <motion.button
                        key={h.id}
                        type="button"
                        whileHover={{ x: 2 }}
                        onClick={() => {
                          if (activeTabId) {
                            navigateTab(activeTabId, h.url, h.title);
                            toggle(false);
                          }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
                      >
                        <Favicon url={h.url} size={24} className="bg-white/5" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                            {h.title}
                          </div>
                          <div className="truncate text-[10px] text-[var(--text-tertiary)]">
                            {prettyUrl(h.url)}
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          {new Date(h.visitedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
