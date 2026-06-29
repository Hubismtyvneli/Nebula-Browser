"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { useBrowserStore } from "@/lib/browser-store";
import { faviconFor } from "@/lib/url";

export function BookmarkBar() {
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const isOpen = useBrowserStore((s) => s.isBookmarkBarOpen);
  const toggle = useBrowserStore((s) => s.toggleBookmarkBar);
  const removeBookmark = useBrowserStore((s) => s.removeBookmark);
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const addHistory = useBrowserStore((s) => s.addHistory);

  const handleOpen = (url: string, title: string) => {
    if (!activeTabId) return;
    navigateTab(activeTabId, url, title);
    addHistory({ url, title });
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 36, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex items-center gap-1 overflow-hidden border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={toggle}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            title="Hide bookmark bar"
          >
            <Star className="h-3 w-3" />
          </button>

          <div className="flex h-full flex-1 items-center gap-1 overflow-x-auto scroll-nebula">
            <AnimatePresence initial={false}>
              {bookmarks.map((b) => (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, width: 0, transition: { duration: 0.16 } }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="group flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 cursor-pointer hover:bg-white/8"
                  onClick={() => handleOpen(b.url, b.title)}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/5 text-[10px] font-bold text-[var(--text-secondary)]">
                    {b.favicon ?? faviconFor(b.url)}
                  </span>
                  <span className="max-w-[120px] truncate text-[12px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                    {b.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(b.id);
                    }}
                    className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-[var(--text-tertiary)] opacity-0 hover:bg-white/10 hover:text-[var(--text-primary)] group-hover:opacity-100"
                    aria-label="Remove bookmark"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {bookmarks.length === 0 && (
            <span className="px-2 text-[11px] text-[var(--text-tertiary)]">
              No bookmarks yet — click the star in the toolbar to add one.
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
